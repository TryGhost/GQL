/**
 * # Knexify
 *
 * This is, at present, little more than a hack and needs revisiting.
 * The `buildWhere` function is able to correctly transform JSON from GQL into a knex querybuilder
 * How and where to do this needs to be considered.
 */

var _ = require('lodash'),
    // local functions
    processFilter,
    buildWhere,
    knexify,

    // contextual information we need to do the next stage of processing
    resourceContext = {
        posts: {
            name: 'posts',
            propAliases: {author: 'author.slug', tags: 'tags.slug', tag: 'tags.slug'},
            relations: []
        },
        tags: {
            name: 'tags',
            propAliases: {},
            relations: []
        },
        users: {
            name: 'users',
            propAliases: {role: 'roles.name'},
            relations: []
        }
    };


processFilter = function processFilter(filter, context) {
    var joins = [],
        addJoin,
        expandAlias,
        processProperty,
        processProperties;

    addJoin = function addJoin(join) {
        if (joins.indexOf(join) === -1) {
            joins.push(join);
        }
    };

    expandAlias = function expandAlias(property) {
        // Expand property aliases into their proper paths
        if (context.propAliases && context.propAliases[property]) {
            property = context.propAliases[property];
        }

        return property;
    };

    processProperty = function processProperty(property) {
        var parts;

        property = expandAlias(property);

        // Separate property by '.'
        parts = property.split('.');

        // If length is 1, we only have a column name, add table name
        if (parts.length === 1) {
            property = context.name ? context.name + '.' + property : property;
        }

        // Collect relations together into an array of 'include' properties
        // This is sort of a hack for building joins and include params later
        // It almost certainly doesn't belong here
        if (parts.length > 1) {
            addJoin(parts[0]);
            //if (context.relations && context.relations.indexOf(parts[parts.length - 1]) > -1) {
            //    addJoin(path);
            //}
        }

        return property;
    };

    processProperties = function processProperties(statements) {
        _.each(statements, function (statement) {
            if (statement.group) {
                processProperties(statement.group);
            } else {
                statement.prop = processProperty(statement.prop)
            }
        });
    };

    processProperties(filter.statements);

    filter.joins = joins;

    return filter;
};

/**
 * Build Where
 *
 * @param qb
 * @param statements
 * @returns {*}
 */
buildWhere = function buildWhere(qb, statements) {
    if (statements.length === 0) {
        return qb;
    }

    _.each(statements, function(statement, index) {
        var whereFunc = 'andWhere';
        if (index === 0) {
            whereFunc = 'where';

        } else if (statement.func === 'or') {
            whereFunc = 'orWhere';
        }

        if (statement.value === null) {
            if (statement.func === 'or') {
                whereFunc = statement.op === 'IS NOT' ? 'orWhereNotNull' : 'orWhereNull';
                delete statement.op;
                delete statement.value;
            } else {
                whereFunc = statement.op === 'IS NOT' ? 'whereNotNull' : 'whereNull';

                delete statement.op;
                delete statement.value;
            }
        }

        // Is this a Group?
        if (statement.group) {
            qb[whereFunc](function () {
                buildWhere(this, statement.group);
            });
        } else {
            // @TODO - validate value vs id here, to ensure we only pass valid things into where
            qb[whereFunc](statement.prop, statement.op, statement.value);
        }
    });

    return qb;
};

knexify = function knexify(qb, filter) {
    filter = processFilter(filter, resourceContext[qb._single.table]);
    return buildWhere(qb, filter.statements);
};

module.exports = knexify;

// For testing only
module.exports._buildWhere = buildWhere;
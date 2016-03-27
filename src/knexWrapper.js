var _ = require('lodash'), knexWrapper,
    buildCondition, buildConditions,
    buildLogicalDollarCondition,
    buildDollarComparisonCondition,
    buildSimpleComparisonCondition,
    orAnalogues, dollarConditionMap,
    applyCondition, applyConditions,
    buildRelations, objectifyRelations,
    transform;

dollarConditionMap = {
    $gt: '>',
    $gte: '>=',
    $lt: '<',
    $lte: '<=',
    $like: 'like'
};

buildLogicalDollarCondition = function (conditions, key, value, negated, parentKey, transformers) {
    // it's a logical grouping such as $and, $or or $not
    if (key === '$or') {
        // or queries always come in as an array.
        // they need to be treated specially to prevent them from being confused with an in query
        var _conditions = [];
        if (_.isArray(value)) {
            _.forEach(value, function (_value) {
                _conditions.push(buildConditions(_value, false, null, transformers));
            });
        } else if (_.isPlainObject(value)) {
            // it was an or condition with a single value
            _conditions.push(buildConditions(value, false, null, transformers));
        } else {
            throw new Error('$or conditions only accept arrays or an object (which represents an array of length 1) as a value');
        }
        if (_.isArray(_conditions) && _conditions.length === 1) {
            _conditions = _conditions[0];
        }
        conditions.push({or: _conditions});
    } else if (key === '$not') {
        conditions.push(buildConditions(value, true, parentKey, transformers));
    } else {
        // it's an comparison operator such as { $lt : 5 }
        conditions.push(buildCondition(key, value, negated, parentKey, transformers));
    }
};

transform = function (value, key, transformers) {
    if (transformers && transformers.hasOwnProperty(key)) {
        return transformers[key].apply(null, [value]);
    }
    return value;
};

buildDollarComparisonCondition = function (condition, key, value, negated, parentKey, transformers) {
    if (dollarConditionMap.hasOwnProperty(key)) {
        condition[negated ? 'whereNot' : 'where'] = [parentKey, dollarConditionMap[key], transform(value, parentKey, transformers)];
    } else if (key.match(/^\$having\./i)) {
        if (negated) {
            throw new Error('$having cannot be negated. It\'s invalid SQL.');
        }
        var valkey, alias;
        valkey = Object.keys(value)[0];
        if (!dollarConditionMap.hasOwnProperty(valkey)) {
            throw new Error('Unsupported aggregate comparison operator: \'' + valkey + '\'');
        }
        alias = key.substr(8);
        condition.having = [alias, dollarConditionMap[valkey], transform(value[valkey], alias)];
    } else {
        throw new Error('' + key + ' is not a valid comparison operator');
    }
    return condition;
};

buildSimpleComparisonCondition = function (condition, key, value, negated, transformers) {
    if (_.isNull(value)) {
        condition[negated ? 'whereNotNull' : 'whereNull'] = [key];
    } else if (_.isArray(value)) {
        condition[negated ? 'whereNotIn' : 'whereIn'] = [key, transform(value, key, transformers)];
    } else if (!_.isPlainObject(value)) {
        condition[negated ? 'whereNot' : 'where'] = [key, transform(value, key, transformers)];
    } else {
        condition = buildConditions(value, negated, key, transformers);
    }
    return condition;
};

buildCondition = function (key, value, negated, parentKey, transformers) {
    if (key) {
        var condition = {};
        if (key.charAt(0) === '$') {
            condition = buildDollarComparisonCondition(condition, key, value, negated, parentKey, transformers);
        } else {
            condition = buildSimpleComparisonCondition(condition, key, value, negated, transformers);
        }
        return condition;
    }
};

buildConditions = function (filter, negated, parentKey, transformers) {
    var conditions = [];
    if (_.isArray(filter)) { // it's a clause
        _.each(filter, function (f) {
            conditions.push(buildConditions(f, negated, parentKey, transformers));
        });
    } else if (_.isPlainObject(filter)) {
        _.each(Object.keys(filter), function (key) {
            var value = filter[key];
            if (key.charAt(0) === '$') {
                if (_.isArray(value) && !key.match(/\$or/i) && !key.match(/\$not/i)) {
                    throw new Error('Arrays are not valid values for comparison conditions that aren\'t IN conditions');
                }
                buildLogicalDollarCondition(conditions, key, value, negated, parentKey, transformers);
            } else {
                // it's an attribute matcher such as { name : 'sample' }
                conditions.push(buildCondition(key, value, negated, null, transformers));
            }
        });
    }
    // This is necessary because with negation we can end up with arbitrarily nested arrays without this.
    if (conditions && conditions.length === 1) {
        conditions = conditions[0];
    }
    return conditions;
};

// Storing the or equivalents of the where clauses is
// an efficient way of getting the equivalent without
// string splitting and concatenation.
orAnalogues = {
    where: 'orWhere',
    whereNot: 'orWhereNot',
    whereIn: 'orWhereIn',
    whereNotIn: 'orWhereNotIn',
    whereNull: 'orWhereNotNull',
    whereNotNull: 'orWhereNotNull'
};

applyCondition = function (knex, condition, useOr, _qb) {
    var qb = _qb ? _qb : knex;
    if (_.isArray(condition)) { // it's a clause/group.
        qb = qb[useOr ? 'orWhere' : 'where'].apply(qb, [(function () {
            var f = function () {
                var c, i, o;
                for (i = 0; i < condition.length; i = i + 1) {
                    if (condition[i].hasOwnProperty('or')) {
                        o = true;
                        c = condition[i].or;
                    } else {
                        o = false;
                        c = condition[i];
                    }
                    applyCondition(knex, c, o, this);
                }
            };
            f.bind(qb);
            return f;
        }())]);
    } else {
        // There should be only one attribute in the condition
        // Using forIn is a concise way to iterate over the object.
        _.forIn(condition, function (value, key) {
            if (key === 'or') { // flip the and to an or
                applyCondition(knex, value, true, qb);
            } else {
                if (key === 'having') {
                    // having's are handled differently because there is no or functionality for having
                    qb = qb.having.apply(qb, value);
                } else {
                    qb = qb[useOr ? orAnalogues[key] : key].apply(qb, value);
                }
            }
        });
    }
};

applyConditions = function (knex, conditions) {
    // or's are explicitly stated
    // and's are implied

    if (!_.isArray(conditions)) {
        applyCondition(knex, conditions);
    } else {
        _.forEach(conditions, function (condition) {
            applyCondition(knex, condition);
        });
    }
};

buildRelations = function (conditions) {
    var relations = [];
    if (conditions) {
        if (_.isPlainObject(conditions)) {
            _.forIn(conditions, function (value, key) {
                if (key.match(/^\$or/i) || key.match(/^\$not/i)) {
                    relations.push(buildRelations(value));
                } else if (!key.match(/^\$/)) {
                    relations.push(key);
                }
            });
        } else if (_.isArray(conditions)) {
            _.each(conditions, function (condition) {
                relations.push(buildRelations(condition));
            });
        }
    }
    return _.uniq(_.flattenDeep(relations));
};

objectifyRelations = function (relations) {
    var o = [], p;
    _.each(relations, function (r) {
        p = r.indexOf('.');
        if (p > 0) { // ignore period at first character too
            o.push(r.substring(0, p));
        }
    });
    return _.uniq(o);
};

knexWrapper = function (filters, transformers) {
    this.filters = filters;
    this.conditions = buildConditions(filters, false, null, transformers);
    this.relations = function () {
        return objectifyRelations(buildRelations(this.filters));
    };
};

knexWrapper.prototype.applyTo = function (knex) {
    applyConditions(knex, this.conditions);
    return knex;
};

module.exports = knexWrapper;

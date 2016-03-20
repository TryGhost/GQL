var _ = require('lodash'), knexWrapper,
    buildCondition, buildConditions,
    buildLogicalDollarCondition,
    buildDollarComparisonCondition,
    buildSimpleComparisonCondition,
    orAnalogues, dollarConditionMap,
    applyCondition, applyConditions;

dollarConditionMap = {
    $gt: '>',
    $gte: '>=',
    $lt: '<',
    $lte: '<=',
    $like: 'like'
};

buildLogicalDollarCondition = function (conditions, key, value, negated, parentKey) {
    // it's a logical grouping such as $and, $or or $not
    if (key === '$or') {
        // or queries always come in as an array.
        // they need to be treated specially to prevent them from being confused with an in query
        var _conditions = [];
        if (_.isArray(value)) {
            _.forEach(value, function (_value) {
                _conditions.push(buildConditions(_value));
            });
        } else if (_.isPlainObject(value)) {
            // it was an or condition with a single value
            _conditions.push(buildConditions(value));
        } else {
            throw new Error('$or conditions only accept arrays or an object (which represents an array of length 1) as a value');
        }
        conditions.push({or: _conditions});
    } else if (key === '$not') {
        conditions.push(buildConditions(value, true, parentKey));
    } else {
        // it's an comparison operator such as { $lt : 5 }
        conditions.push(buildCondition(key, value, negated, parentKey));
    }
};

buildDollarComparisonCondition = function (condition, key, value, negated, parentKey) {
    if (dollarConditionMap.hasOwnProperty(key)) {
        condition[negated ? 'whereNot' : 'where'] = [parentKey, dollarConditionMap[key], value];
    } else if (key.match(/^\$having\./i)) {
        if (negated) {
            throw new Error('$having cannot be negated. It\'s invalid SQL.');
        }
        var valkey = Object.keys(value)[0];
        if (!dollarConditionMap.hasOwnProperty(valkey)) {
            throw new Error('Unsupported aggregate comparison operator: \'' + valkey + '\'');
        }
        condition.having = [key.substr(8), dollarConditionMap[valkey], value[valkey]];
    } else {
        throw new Error('' + key + ' is not a valid comparison operator');
    }
    return condition;
};

buildSimpleComparisonCondition = function (condition, key, value, negated) {
    if (_.isNull(value)) {
        condition[negated ? 'whereNotNull' : 'whereNull'] = [key];
    } else if (_.isArray(value)) {
        condition[negated ? 'whereNotIn' : 'whereIn'] = [key, value];
    } else if (!_.isPlainObject(value)) {
        condition[negated ? 'whereNot' : 'where'] = [key, value];
    } else {
        condition = buildConditions(value, false, key);
    }
    return condition;
};

buildCondition = function (key, value, negated, parentKey) {
    if (key) {
        var condition = {};
        if (key.charAt(0) === '$') {
            condition = buildDollarComparisonCondition(condition, key, value, negated, parentKey);
        } else {
            condition = buildSimpleComparisonCondition(condition, key, value, negated);
        }
        return condition;
    }
};

buildConditions = function (filter, negated, parentKey) {
    var conditions = [];
    _.forIn(filter, function (value, key) {
        if (key.charAt(0) === '$') {
            buildLogicalDollarCondition(conditions, key, value, negated, parentKey);
        } else {
            // it's an attribute matcher such as { name : 'sample' }
            conditions.push(buildCondition(key, value, negated));
        }
    });
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
                for (var i = 0; i < condition.length; i = i + 1) {
                    applyCondition(knex, condition[i], false, this);
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
                    qb = qb[key].apply(qb, value);
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

knexWrapper = function (filters) {
    this.filters = filters;
    this.conditions = buildConditions(filters);
};

knexWrapper.prototype.applyTo = function (knex) {
    applyConditions(knex, this.conditions);
    return knex;
};

module.exports = knexWrapper;

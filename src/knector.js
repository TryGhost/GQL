var _, parser, Statement, knector,
    buildLogicalDollarCondition,
    buildDollarComparisonCondition,
    buildSimpleComparisonCondition;
_ = require('lodash');
parser = require('../dist/parser').parser;
Statement = require('./statement');

knector = function (name, collection) {
    this.collectionName = name; // will be used for aggregates and joins
    this.collection = collection;
    this.joins = [];
};
knector.prototype.filter = function (filters) {
    if (_.isString(filters)) {
        filters = parser.parse(filters);
    }

    return new Statement(this.collectionName, this.collection, this.buildConditions(filters), this.joins);
};

buildLogicalDollarCondition = function (self, conditions, key, value, negated, parentKey) {
    // it's a logical grouping such as $and, $or or $not
    if (key === '$or') {
        // or queries always come in as an array.
        // they need to be treated specially to prevent them from being confused with an in query
        var _conditions = [];
        if (_.isArray(value)) {
            _.forEach(value, function (_value) {
                _conditions.push(self.buildConditions(_value));
            });
        } else if (_.isPlainObject(value)) {
            // it was an or condition with a single value
            _conditions.push(self.buildConditions(value));
        } else {
            throw new Error('$or conditions only accept arrays or an object (which represents an array of length 1) as a value');
        }
        conditions.push({or: _conditions});
    } else if (key === '$not') {
        conditions.push(self.buildConditions(value, true, parentKey));
    } else {
        // it's an comparison operator such as { $lt : 5 }
        conditions.push(self.buildCondition(key, value, negated, parentKey));
    }
};

knector.prototype.buildConditions = function (filter, negated, parentKey) {
    var self = this, conditions = [];
    _.forIn(filter, function (value, key) {
        if (key.charAt(0) === '$') {
            buildLogicalDollarCondition(self, conditions, key, value, negated, parentKey);
        } else {
            // it's an attribute matcher such as { name : 'sample' }
            conditions.push(self.buildCondition(key, value, negated));
        }
    });
    // This is necessary because with negation we can end up with arbitrarily nested arrays without this.
    if (conditions && conditions.length === 1) {
        conditions = conditions[0];
    }
    return conditions;
};

buildDollarComparisonCondition = function (self, condition, key, value, negated, parentKey) {
    // could be $gt, $gte, $lt, $lte, $ne
    if (key === '$gt') {
        condition[negated ? 'whereNot' : 'where'] = [parentKey, '>', value];
    } else if (key === '$gte') {
        condition[negated ? 'whereNot' : 'where'] = [parentKey, '>=', value];
    } else if (key === '$lt') {
        condition[negated ? 'whereNot' : 'where'] = [parentKey, '<', value];
    } else if (key === '$lte') {
        condition[negated ? 'whereNot' : 'where'] = [parentKey, '<=', value];
    } else if (key === '$like') {
        condition[negated ? 'whereNot' : 'where'] = [parentKey, 'like', value];
    } else if (key === '$ne') {
        condition = self.buildCondition(parentKey, value, true);
    } else {
        throw new Error('' + key + ' is not a valid comparison operator');
    }
    return condition;
};

buildSimpleComparisonCondition = function (self, condition, key, value, negated) {
    if (_.isNull(value)) {
        condition[negated ? 'whereNotNull' : 'whereNull'] = [key];
    } else if (_.isArray(value)) {
        condition[negated ? 'whereNotIn' : 'whereIn'] = [key, value];
    } else if (!_.isPlainObject(value)) {
        condition[negated ? 'whereNot' : 'where'] = [key, value];
    } else {
        condition = self.buildConditions(value, false, key);
    }
    return condition;
};

buildAggregateCondition = function (self, condition, key, value, negated, parentKey) {
    if(key.match(/\.\$count\.distinct$/)) {

    } else if(key.match(/\.\$count$/)) {
    } else if(key.match(/\.\$sum$/)) {
    } else if(key.match(/\.\$max$/)) {
    } else if(key.match(/\.\$min$/)) {
    }
    // it's an aggregate query such as 'posts.$count'
    throw new Error('Aggregate queries are not yet supported');
};

knector.prototype.buildCondition = function (key, value, negated, parentKey) {
    if (key) {
        var condition = {};
        if (key.charAt(0) === '$') {
            condition = buildDollarComparisonCondition(this, condition, key, value, negated, parentKey);
        } else if (-1 !== key.indexOf('.$')) {
            condition = buildAggregateCondition(this, condition, key, value, negated, parentKey);
        } else {
            condition = buildSimpleComparisonCondition(this, condition, key, value, negated);
        }
        return condition;
    }
};

var joinTables = function(self, nearTable, nearColumn, farTable, farColumn) {
    self.joins.push([[nearTable, nearColumn],[farTable, farColumn]]);
};

knector.prototype.join = function (nearColumn, farTable, farColumn) {
    // This data structure ensures exactly one join to a far table column from a near column
    joinTables(this, this.collectionName, nearColumn, farTable, farColumn);
    this.collection.innerJoin(farTable, this.collectionName + '.' + nearColumn, farTable + '.' + farColumn);
    return this;
};

knector.prototype.joinThrough = function (nearColumn, middleTable, middleColumnJoinedWithNearColumn, middleColumnJoinedWithFarColumn, farTable, farColumn) {
    joinTables(this, this.collectionName, nearColumn, middleTable, middleColumnJoinedWithNearColumn);
    joinTables(this, middleTable, middleColumnJoinedWithFarColumn, farTable, farColumn);
    this.collection.innerJoin(middleTable, this.collectionName + '.' + nearColumn, middleTable + '.' + middleColumnJoinedWithNearColumn);
    this.collection.innerJoin(farTable, middleTable + '.' + middleColumnJoinedWithFarColumn, farTable + '.' + farColumn);
    return this;
};

module.exports = knector;

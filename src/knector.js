var _, parser, Statement, knector;
_ = require('lodash');
parser = require('./parser');
Statement = require('./statement');

knector = function (collection) {
    this.collection = collection;
};
knector.prototype.filter = function (filters) {
    if (_.isString(filters)) {
        filters = parser.parse(filters);
    }

    return new Statement(this.collection, this.buildConditions(filters));
};

knector.prototype.buildConditions = function (filter, negated, parentKey) {
    var self = this, conditions = [];
    _.forIn(filter, function (value, key) {
        if (key) {
            if (key.charAt(0) === '$') {
                // it's a logical grouping such as $and, $or or $not
                if (key === '$or') {
                    // or queries always come in as an array.
                    // they need to be treated specially to prevent them from being confused with an in query
                    if (_.isArray(value)) {
                        var _conditions = [];
                        _.forEach(value, function (_value) {
                            _conditions.push(self.buildConditions(_value));
                        });
                        conditions.push({or: _conditions});
                    } else {
                        throw new Error('$or conditions only accept arrays as a value');
                    }
                } else if (key === '$not') {
                    conditions.push(self.buildConditions(value, true, parentKey));
                } else {
                    // it's an comparison operator such as { $lt : 5 }
                    conditions.push(self.buildCondition(key, value, negated, parentKey));
                }
            } else if (-1 !== key.indexOf('.$')) {
                // it's an aggregate query such as 'posts.$count'
                throw new Error('Aggregate queries are not yet supported');
            } else {
                // it's an attribute matcher such as { name : 'sample' }
                conditions.push(self.buildCondition(key, value, negated));
            }
        }
    });
    // This is necessary because with negation we can end up with arbitrarily nested arrays without this.
    if (conditions && conditions.length === 1) {
        conditions = conditions[0];
    }
    return conditions;
};

knector.prototype.buildCondition = function (key, value, negated, parentKey) {
    if (key) {
        var condition = {};
        if (key.charAt(0) === '$') {
            // could be $gt, $gte, $lt, $lte, $ne
            if (key === '$gt') {
                condition[negated ? 'whereNot' : 'where'] = [parentKey, '>', value];
            } else if (key === '$gte') {
                condition[negated ? 'whereNot' : 'where'] = [parentKey, '>=', value];
            } else if (key === '$lt') {
                condition[negated ? 'whereNot' : 'where'] = [parentKey, '<', value];
            } else if (key === '$lte') {
                condition[negated ? 'whereNot' : 'where'] = [parentKey, '<=', value];
            } else if (key === '$ne') {
                condition = this.buildCondition(parentKey, value, true);
            } else {
                throw new Error('' + key + ' is not a valid comparison operator');
            }
        } else {
            if (_.isNull(value)) {
                condition[negated ? 'whereNotNull' : 'whereNull'] = [key];
            } else if (_.isArray(value)) {
                condition[negated ? 'whereNotIn' : 'whereIn'] = [key, value];
            } else if (!_.isPlainObject(value)) {
                condition[negated ? 'whereNot' : 'where'] = [key, value];
            } else {
                condition = this.buildConditions(value, false, key);
            }
        }
        return condition;
    }
};

module.exports = knector;

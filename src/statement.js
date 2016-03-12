var _, statement, orAnalogues, applyCondition, applyConditions;
_ = require('lodash');

statement = function (collection, conditions) {
    this.collection = collection;
    this.conditions = conditions;
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

applyCondition = function (statement, condition, useOr) {
    if (_.isArray(condition)) { // it's a clause/group.
        statement.collection = statement.collection[useOr ? 'orWhere' : 'where'].apply(statement.collection, [(function () {
            return function () {
                _.each(condition, function (_condition) {
                    // FIXME This needs to get properly wired into what's referred to as a 'Grouped chain' here
                    // FIXME http://knexjs.org/#Builder-where
                    applyCondition(statement, _condition);
                });
            };
        }())]);
    } else {
        // There should be only one attribute in the condition
        // Using forIn is a concise way to iterate over the object.
        _.forIn(condition, function (value, key) {
            if (key === 'or') { // flip the and to an or
                applyCondition(statement, value, true);
            } else {
                statement.collection = statement.collection[useOr ? orAnalogues[key] : key].apply(statement.collection, value);
            }
        });
    }
};

applyConditions = function (statement) {
    // or's are explicitly stated
    // and's are implied

    if (!_.isArray(statement.conditions)) {
        applyCondition(statement, statement.conditions);
    } else {
        _.forEach(statement.conditions, function (condition) {
            applyCondition(statement, condition);
        });
    }
};

statement.prototype.fetch = function (fields) {
    applyConditions(this);

    var _fields = fields ? _.isString(fields) ? [fields] : fields : ['*'];
    return this.collection.select.apply(this.collection, _fields);
};

statement.prototype.orderBy = function (attribute, direction) {
    this.collection.orderBy(attribute, direction);
    return this;
};

statement.prototype.limit = function (limit) {
    this.collection.limit(limit);
    return this;
};

statement.prototype.offset = function (offset) {
    this.collection.offset(offset);
    return this;
};

statement.prototype.toSQL = function (fields) {
    return this.fetch(fields).toString();
};

module.exports = statement;

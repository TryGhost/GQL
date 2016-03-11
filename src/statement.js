var _ = require('lodash');

var statement = function(collection, conditions) {
    this.collection = collection;
    this.conditions = conditions;
};

// Storing the or equivalents of the where clauses is
// an efficient way of getting the equivalent without
// string splitting and concatenation.
var orAnalogues = {
    where: 'orWhere',
    whereNot: 'orWhereNot',
    whereIn: 'orWhereIn',
    whereNotIn: 'orWhereNotIn',
    whereNull: 'orWhereNotNull',
    whereNotNull: 'orWhereNotNull'
};

var applyCondition = function(statement, condition, useOr) {
    // There should be only one attribute in the condition
    // Using forIn is a concise way to iterate over the object.
    _.forIn(condition, function(value, key){
        if ('or' === key) {
            _.forEach(value, function(clause) {
                applyCondition(statement, clause, true);
            });
        } else {
            statement.collection = statement.collection[!!useOr ? orAnalogues[key] : key].apply(statement.collection, value);
        }
    });
};

var applyConditions = function(statement) {
    // or's are explicitly stated
    // and's are implied

    if(!_.isArray(statement.conditions)) {
        applyCondition(statement, statement.conditions);
    } else {
        _.forEach(statement.conditions, function(condition) {
            applyCondition(statement, condition);
        });
    }
};

statement.prototype.fetch = function(showSql) {
    applyConditions(this);
    if(showSql) {
        console.log(this.collection.toString());
    }
    return this.collection.select();
};

statement.prototype.toSQL = function() {
    return applyConditions(this) && this.collection.toString();
};

module.exports = statement;

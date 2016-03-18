var _, statement, orAnalogues, applyCondition, applyConditions;
_ = require('lodash');

statement = function (collectionName, collection, conditions, joins) {
    this.collectionName = collectionName;
    this.collection = collection;
    this.conditions = conditions;
    this.joins = joins;
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

applyCondition = function (statement, condition, useOr, _qb) {
    var qb = _qb ? _qb : statement.collection;
    if (_.isArray(condition)) { // it's a clause/group.
        qb = qb[useOr ? 'orWhere' : 'where'].apply(qb, [(function () {
            var f = function () {
                for (var i = 0; i < condition.length; i = i + 1) {
                    applyCondition(statement, condition[i], false, this);
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
                applyCondition(statement, value, true, qb);
            } else {
                qb = qb[useOr ? orAnalogues[key] : key].apply(qb, value);
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

statement.prototype.debug = function () {
    this.collection.on('query', function (data) {
        console.dir(data); // prints the substituted sql query
    });
    return this;
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

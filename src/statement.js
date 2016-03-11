var statement = function(collection, conditions) {
    this.collection = collection;
    this.conditions = conditions;
};

statement.prototype.fetch = function() {
    // FIXME apply all of the conditions to the collection and execute the query
    throw "fetch not yet implemented";
};

statement.prototype.toSQL = function() {
    throw "toSQL not yet implemented";
};

module.exports = statement;

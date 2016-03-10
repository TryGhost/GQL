var _ = require('lodash');
var parser = require('./parser');

var knector = function(knex) {
    this.knex = knex;
};

knector.prototype.filter = function(filters) {
    if(_.isString(filters)) {
        filters = parser.parse(filters);
    }

    // At this point filters is an object
    // FIXME buildup the query to execute.

    return this;
};

knector.prototype.fetch = function() {
    // FIXME
    return [];
};

knector.prototype.toSQL = function() {
    return knex.toSQL();
};

module.exports = knector;

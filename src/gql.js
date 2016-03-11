var Knector = require('./knector'),
    parser = require('./parser'),
    gql;

gql = function (knex) {
    this.knex = knex;
};

// returns a filter object
gql.prototype.parse = function (query) {
    return parser.parse(query);
};

gql.prototype.findAll = function (collection) {
    return new Knector(this.knex(collection)); // jshint ignore:line
};

module.exports = gql;

var parser = require('../dist/parser').parser,
    _ = require('lodash'),
    gql, knexWrapper = require('./knexWrapper');

gql = {
    parse: function (filters) {
        if (_.isString(filters)) {
            filters = filters ? parser.parse(filters) : {};
        }

        return new knexWrapper(filters);
    }
};

module.exports = gql;

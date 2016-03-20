var parser = require('../dist/parser').parser,
    _ = require('lodash'),
    gql, KnexWrapper = require('./knexWrapper');

gql = {
    parse: function (filters) {
        if (_.isString(filters)) {
            filters = filters ? parser.parse(filters) : {};
        }

        return new KnexWrapper(filters);
    }
};

module.exports = gql;

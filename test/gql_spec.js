/* globals describe, it */
var gql = require('../lib/gql'),
    knex = require('knex')({}),
    toSQL;

toSQL = exports.toSQL = function (input, resource) {
    var parsedFilter = gql.parse(input);
    return gql.knexify(knex(resource), parsedFilter).toQuery();
};

describe('GQL', function () {
    it('should correctly get from GQL -> SQL', function () {
        toSQL('id:1', 'posts').should.eql('select * from "posts" where "posts"."id" = 1');
    });

    it('should correctly escape bad sequences', function () {
        (function () {toSQL('id:\'1 and 1‘=\'1`\'', 'posts');}).should.throw();
        toSQL('id:\'1 and 1‘=\\\'1`\'', 'posts').should.eql('select * from "posts" where "posts"."id" = \'1 and 1‘=\\\'1`\'');
    });
});

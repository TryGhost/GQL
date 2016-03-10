var _ = require('lodash');

var chai = require('chai');
chai.should();
chai.use(require('chai-bookshelf'));

var knex = require('knex')({
    client: 'sqlite3',
    connection: {filename: ':memory:'}
});

var gql = require('../src/gql');
gql = new gql(knex);

describe('GQL', function () {
    before(function(){
        knex.schema.createTableIfNotExists('posts', function(table){
            table.increments();
            table.string('name');
            table.binary('image');
            table.boolean('featured');
            table.timestamps();
        });
    });

    beforeEach(function(){
        var image = 'asdfghjkl;';
        knex('posts').del();
        knex('posts').insert({
            name: 'sample'
        });
        knex('posts').insert({
            name: 'featured-sample',
            featured: true
        });
        knex('posts').insert({
            name: 'sample-with-image',
            image: image
        });
        knex('posts').insert({
            name: 'featured-sample-with-image',
            featured: true,
            image: image
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // safety tests
    // -----------------------------------------------------------------------------------------------------------------

    it.skip('should correctly escape bad sequences', function () {
        //    (function () {toSQL('id:\'1 and 1‘=\'1`\'', 'posts');}).should.throw();
        //    toSQL('id:\'1 and 1‘=\\\'1`\'', 'posts').should.eql('select * from "posts" where "posts"."id" = \'1 and 1‘=\\\'1`\'');
    });

    // -----------------------------------------------------------------------------------------------------------------
    // parser tests
    // -----------------------------------------------------------------------------------------------------------------

    it('should parse an empty string into an empty filter object', function(){
        _.isEmpty(gql.parse('')).should.equal(true);
    });

    // -----------------------------------------------------------------------------------------------------------------
    // filter tests
    // -----------------------------------------------------------------------------------------------------------------

    it('should return all posts when calling findAll with an empty filter', function() {
        gql.findAll('posts').filter('').fetch().should.have.length(4);
        gql.findAll('posts').filter({}).fetch().should.have.length(4);
    });

    it('should perform exact string matches', function(){
        gql.findAll('posts').filter('name:sample').fetch().should.have.length(1);
        gql.findAll('posts').filter({ name: 'sample' }).fetch().should.have.length(1);
    });

});

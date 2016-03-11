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

describe('gql', function () {
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
            name: 'sample',
            created_at: '2016-03-01'
        });
        knex('posts').insert({
            name: 'featured-sample',
            featured: true,
            created_at: '2016-03-02'
        });
        knex('posts').insert({
            name: 'sample-with-image',
            image: image,
            created_at: '2016-03-03'
        });
        knex('posts').insert({
            name: 'featured-sample-with-image',
            featured: true,
            image: image,
            created_at: '2016-03-04'
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

    describe('findAll', function(){
        it('should support a string argument', function(){
            var conditions = gql.findAll('posts').filter('').conditions;
            //_.isEqual(conditions, { and: { where: [ 'name', 'sample' ]}}).should.equal(true);
        });

        it('should support exact not matches', function(){
            var conditions = gql.findAll('posts').filter({ $not: { name: 'sample' } }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNot: [ 'name', 'sample' ] }).should.equal(true);
        });

        it('should support less than matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $lt: '2016-03-02' } }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { where: [ 'created_at', '<', '2016-03-02' ] }).should.equal(true);
        });

        it('should support not less than matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $not: { $lt: '2016-03-02' } } }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNot: [ 'created_at', '<', '2016-03-02' ] }).should.equal(true);
        });

        it('should support greater than matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $gt: '2016-03-02' } }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { where: [ 'created_at', '>', '2016-03-02' ] }).should.equal(true);
        });

        it('should support not greater than matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $not: { $gt: '2016-03-02' } } }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNot: [ 'created_at', '>', '2016-03-02' ] }).should.equal(true);
        });

        it('should support less than equal matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $lte: '2016-03-02' } }).conditions;
            //console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { where: [ 'created_at', '<=', '2016-03-02' ] }).should.equal(true);
        });

        it('should support not less than equal matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $not: { $lte: '2016-03-02' } } }).conditions;
            //console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNot: [ 'created_at', '<=', '2016-03-02' ] }).should.equal(true);
        });

        it('should support greater than equal matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $gte: '2016-03-02' } }).conditions;
            //console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { where: [ 'created_at', '>=', '2016-03-02' ] }).should.equal(true);
        });

        it('should support not greater than equal matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $not: { $gte: '2016-03-02' } } }).conditions;
            //console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNot: [ 'created_at', '>=', '2016-03-02' ] }).should.equal(true);
        });

        it('should support null matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: null }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNull: [ 'created_at' ] }).should.equal(true);
        });

        it('should support not null matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $ne: null } }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNotNull: [ 'created_at' ] }).should.equal(true);
        });

        it('should support not null matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: { $ne: null } }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNotNull: [ 'created_at' ] }).should.equal(true);
        });

        it('should support in matches', function(){
            var conditions = gql.findAll('posts').filter({ created_at: [ '2016-03-01', '2016-03-02' ] }).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereIn: [ 'created_at', [ '2016-03-01', '2016-03-02' ] ] }).should.equal(true);
        });

        it('should support not in matches', function(){
            var conditions = gql.findAll('posts').filter({ $not: { created_at: [ '2016-03-01', '2016-03-02' ] }}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, { whereNotIn: [ 'created_at', [ '2016-03-01', '2016-03-02' ] ] }).should.equal(true);
        });

        it('should throw an error for a bad comparison operator', function(){
            (function() {gql.findAll('posts').filter({ $bad: { created_at: [ '2016-03-01', '2016-03-02' ] }})}).should.throw();
        });

        it('should throw an error for an aggregate query', function(){
            (function() {gql.findAll('posts').filter({ 'posts.$count': { $gt: 0 }})}).should.throw();
        });

        it('should throw an error for an $or clause that does not have an array value', function(){
            (function() {gql.findAll('posts').filter({ $or: { name: 'sample' }})}).should.throw();
        });

        // -------------------------------------------------------------------------------------------------------------
        // nested queries --
        // -------------------------------------------------------------------------------------------------------------

        it('should support queries nested one level deep', function(){
            var conditions = gql.findAll('posts').filter({
                $and: [
                    { $not: { created_at: [ '2016-03-01', '2016-03-02' ] } },
                    { created_at: { $lt: '2016-03-04' } }
                ]
            }).conditions;
            //console.log(JSON.stringify(conditions));
            _.isEqual(conditions, [
                { whereNotIn: [ 'created_at', [ '2016-03-01', '2016-03-02' ] ] },
                { where: [ 'created_at', '<', '2016-03-04']}
            ]).should.equal(true);
        });

        it('should support queries nested one level deep', function(){
            var conditions = gql.findAll('posts').filter({
                $or: [
                    [
                        { created_at: { $lt: '2016-03-04' } },
                        { $not: { created_at: [ '2016-03-01', '2016-03-02' ] } }
                    ]
                    , {
                        featured: false
                    }
                ]
            }).conditions;
            //console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {
                or: [
                    [
                        {
                            where: ['created_at', '<', '2016-03-04']
                        },
                        {
                            whereNotIn: [
                                'created_at', ['2016-03-01', '2016-03-02']
                            ]
                        }
                    ],
                    {where: ['featured', false]}
                ]
            }).should.equal(true);
        });

    });

    // -----------------------------------------------------------------------------------------------------------------
    // logical grouping --
    // -----------------------------------------------------------------------------------------------------------------

    it('should support and queries', function(){
        var conditions = gql.findAll('posts').filter( { $and: [ { name: 'sample' }, { featured: false } ] }).conditions;
        console.log(JSON.stringify(conditions));
        _.isEqual(conditions, [{ where: [ 'name', 'sample' ] }, { where: [ 'featured', false ]}]).should.equal(true);
    });

    it('should support or queries', function(){
        var conditions = gql.findAll('posts').filter( { $or: [ { name: 'sample' }, { featured: false } ] }).conditions;
        console.log(JSON.stringify(conditions));
        _.isEqual(conditions, { or: [{ where: [ 'name', 'sample' ]}, { where: [ 'featured', false ]}]}).should.equal(true);
    });

    // -----------------------------------------------------------------------------------------------------------------
    // query execution --
    // -----------------------------------------------------------------------------------------------------------------

    it.skip('should return all posts when calling findAll with an empty filter', function() {
        gql.findAll('posts').filter('').fetch().should.have.length(4);
        gql.findAll('posts').filter({}).fetch().should.have.length(4);
    });

    it.skip('should perform exact string matches', function(){
        gql.findAll('posts').filter('name:sample').fetch().should.have.length(1);
        gql.findAll('posts').filter({ name: 'sample' }).fetch().should.have.length(1);
    });

});

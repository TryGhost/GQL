var _, chai, knex, gql, Gql;
_ = require('lodash');

chai = require('chai');
chai.should();
chai.use(require('chai-bookshelf'));
chai.use(require('chai-as-promised'));

knex = require('knex')({
    client: 'sqlite3',
    connection: {filename: ':memory:'}
});

Gql = require('../src/gql');
gql = new Gql(knex);

describe('gql', function () {
    before(function (done) {
        knex.schema.createTableIfNotExists('posts', function (table) {
            table.increments();
            table.string('name');
            table.binary('image');
            table.boolean('featured').defaultTo(false);
            table.timestamps();
        }).then(function () {
            done();
        });
    });

    beforeEach(function (done) {
        var image = 'asdfghjkl;';
        knex('posts')
            .del()
            .then(function () {
                return knex('posts').insert({
                    name: 'sample',
                    created_at: '2016-03-01'
                });
            })
            .then(function () {
                return knex('posts').insert({
                    name: 'featured-sample',
                    featured: true,
                    created_at: '2016-03-02'
                });
            })
            .then(function () {
                return knex('posts').insert({
                    name: 'sample-with-image',
                    image: image,
                    created_at: '2016-03-03'
                });
            })
            .then(function () {
                return knex('posts').insert({
                    name: 'featured-sample-with-image',
                    featured: true,
                    image: image,
                    created_at: '2016-03-04'
                });
            }).then(function () {
            done();
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

    it('should parse an empty string into an empty filter object', function () {
        _.isEmpty(gql.parse('')).should.equal(true);
    });

    // -----------------------------------------------------------------------------------------------------------------
    // filter tests
    // -----------------------------------------------------------------------------------------------------------------

    describe('findAll', function () {
        it('should support a string argument', function () {
            // var conditions = gql.findAll('posts').filter('').conditions;
            // TODO Once the parser is complete we can revisit this to ensure that it actually creates the correct
            // TODO conditions. For now it will suffice to just verify that it accepts a string argument without error.
        });

        it('should support exact not matches', function () {
            var conditions = gql.findAll('posts').filter({$not: {name: 'sample'}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNot: ['name', 'sample']}).should.equal(true);
        });

        it('should support less than matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$lt: '2016-03-02'}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {where: ['created_at', '<', '2016-03-02']}).should.equal(true);
        });

        it('should support not less than matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$not: {$lt: '2016-03-02'}}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNot: ['created_at', '<', '2016-03-02']}).should.equal(true);
        });

        it('should support greater than matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$gt: '2016-03-02'}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {where: ['created_at', '>', '2016-03-02']}).should.equal(true);
        });

        it('should support not greater than matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$not: {$gt: '2016-03-02'}}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNot: ['created_at', '>', '2016-03-02']}).should.equal(true);
        });

        it('should support less than equal matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$lte: '2016-03-02'}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {where: ['created_at', '<=', '2016-03-02']}).should.equal(true);
        });

        it('should support not less than equal matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$not: {$lte: '2016-03-02'}}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNot: ['created_at', '<=', '2016-03-02']}).should.equal(true);
        });

        it('should support greater than equal matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$gte: '2016-03-02'}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {where: ['created_at', '>=', '2016-03-02']}).should.equal(true);
        });

        it('should support not greater than equal matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$not: {$gte: '2016-03-02'}}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNot: ['created_at', '>=', '2016-03-02']}).should.equal(true);
        });

        it('should support null matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: null}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNull: ['created_at']}).should.equal(true);
        });

        it('should support not null matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$ne: null}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNotNull: ['created_at']}).should.equal(true);
        });

        it('should support not null matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: {$ne: null}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNotNull: ['created_at']}).should.equal(true);
        });

        it('should support in matches', function () {
            var conditions = gql.findAll('posts').filter({created_at: ['2016-03-01', '2016-03-02']}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereIn: ['created_at', ['2016-03-01', '2016-03-02']]}).should.equal(true);
        });

        it('should support not in matches', function () {
            var conditions = gql.findAll('posts').filter({$not: {created_at: ['2016-03-01', '2016-03-02']}}).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, {whereNotIn: ['created_at', ['2016-03-01', '2016-03-02']]}).should.equal(true);
        });

        it('should throw an error for a bad comparison operator', function () {
            (function () {
                gql.findAll('posts').filter({$bad: {created_at: ['2016-03-01', '2016-03-02']}});
            }).should.throw();
        });

        it('should throw an error for an aggregate query', function () {
            (function () {
                gql.findAll('posts').filter({'posts.$count': {$gt: 0}});
            }).should.throw();
        });

        it('should throw an error for an $or clause that does not have an array value', function () {
            (function () {
                gql.findAll('posts').filter({$or: {name: 'sample'}});
            }).should.throw();
        });

        // -------------------------------------------------------------------------------------------------------------
        // nested queries --
        // -------------------------------------------------------------------------------------------------------------

        it('should support queries nested one level deep', function () {
            var conditions = gql.findAll('posts').filter([
                    {$not: {created_at: ['2016-03-01', '2016-03-02']}},
                    {created_at: {$lt: '2016-03-04'}}
                ]
            ).conditions;
            console.log(JSON.stringify(conditions));
            _.isEqual(conditions, [
                {whereNotIn: ['created_at', ['2016-03-01', '2016-03-02']]},
                {where: ['created_at', '<', '2016-03-04']}
            ]).should.equal(true);
        });

        it('should support queries nested one level deep', function () {
            var conditions = gql.findAll('posts').filter({
                $or: [
                    [{created_at: {$lt: '2016-03-04'}},
                        {$not: {created_at: ['2016-03-01', '2016-03-02']}}],
                    {
                        featured: false
                    }
                ]
            }).conditions;
            console.log(JSON.stringify(conditions));
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

    it('should support and queries', function () {
        var conditions = gql.findAll('posts').filter([{name: 'sample'}, {featured: false}]).conditions;
        console.log(JSON.stringify(conditions));
        _.isEqual(conditions, [{where: ['name', 'sample']}, {where: ['featured', false]}]).should.equal(true);
    });

    it('should support or queries', function () {
        var conditions = gql.findAll('posts').filter({$or: [{name: 'sample'}, {featured: false}]}).conditions;
        console.log(JSON.stringify(conditions));
        _.isEqual(conditions, {or: [{where: ['name', 'sample']}, {where: ['featured', false]}]}).should.equal(true);
    });

    // -----------------------------------------------------------------------------------------------------------------
    // query execution --
    // -----------------------------------------------------------------------------------------------------------------

    it('should return all posts when calling findAll with an empty string filter', function (done) {
        gql.findAll('posts')
            .filter('')
            .fetch(true)
            .then(function (result) {
                result.length.should.equal(4);
                console.log(JSON.stringify(result));
                done();
            });
    });

    it('should return all posts when calling findAll with an empty object filter', function (done) {
        gql.findAll('posts')
            .filter({})
            .fetch(true)
            .then(function (result) {
                result.length.should.equal(4);
                console.log(JSON.stringify(result));
                done();
            });
    });

    it('should perform exact string matches', function (done) {
        gql.findAll('posts')
            .filter({name: 'sample'})
            .fetch(true)
            .then(function (result) {
                result[0].name.should.equal('sample');
                console.log(JSON.stringify(result));
                done();
            });
    });
});

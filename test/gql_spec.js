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

describe('GQL', function () {
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

    it('should correctly escape bad sequences', function () {
        (function () {
            gql.parse('id:\'1 and 1‘=\'1`\'').toSQL();
        }).should.throw();
        gql.findAll('posts').filter('posts.id:\'1 and a=\\\'1`\'').toSQL()
            .should.eql('select * from "posts" where "posts"."id" = \'1 and a=\\\'1`\'');
    });

    describe('filter with a string', function () {
        it('should support a string argument', function (done) {
            gql.findAll('posts').filter('name:sample').fetch().then(function (result) {
                result.length.should.eql(1);
                Object.keys(result[0]).length.should.eql(6);
                done();
            });
        });

        it('should not accept an empty string filter', function () {
            (function () {
                gql.parse('').toSQL();
            }).should.throw();
        });
    });

    describe('basic matching', function () {
        it('should perform exact string matches', function (done) {
            gql.findAll('posts')
                .filter({name: 'sample'})
                .fetch()
                .then(function (result) {
                    result[0].name.should.eql('sample');
                    // console.log(JSON.stringify(result));
                    done();
                });
        });

        it('should support exact not matches', function () {
            gql.findAll('posts').filter({$not: {name: 'sample'}}).conditions
                .should.eql({whereNot: ['name', 'sample']});
        });

        it('should support less than matches', function () {
            gql.findAll('posts').filter({created_at: {$lt: '2016-03-02'}}).conditions
                .should.eql({where: ['created_at', '<', '2016-03-02']});
        });

        it('should support not less than matches', function () {
            gql.findAll('posts').filter({created_at: {$not: {$lt: '2016-03-02'}}}).conditions
                .should.eql({whereNot: ['created_at', '<', '2016-03-02']});
        });

        it('should support greater than matches', function () {
            gql.findAll('posts').filter({created_at: {$gt: '2016-03-02'}}).conditions
                .should.eql({where: ['created_at', '>', '2016-03-02']});
        });

        it('should support not greater than matches', function () {
            gql.findAll('posts').filter({created_at: {$not: {$gt: '2016-03-02'}}}).conditions
                .should.eql({whereNot: ['created_at', '>', '2016-03-02']});
        });

        it('should support less than equal matches', function () {
            gql.findAll('posts').filter({created_at: {$lte: '2016-03-02'}}).conditions
                .should.eql({where: ['created_at', '<=', '2016-03-02']});
        });

        it('should support not less than equal matches', function () {
            gql.findAll('posts').filter({created_at: {$not: {$lte: '2016-03-02'}}}).conditions
                .should.eql({whereNot: ['created_at', '<=', '2016-03-02']});
        });

        it('should support greater than equal matches', function () {
            gql.findAll('posts').filter({created_at: {$gte: '2016-03-02'}}).conditions
                .should.eql({where: ['created_at', '>=', '2016-03-02']});
        });

        it('should support not greater than equal matches', function () {
            gql.findAll('posts').filter({created_at: {$not: {$gte: '2016-03-02'}}}).conditions
                .should.eql({whereNot: ['created_at', '>=', '2016-03-02']});
        });

        it('should support null matches', function () {
            gql.findAll('posts').filter({created_at: null}).conditions
                .should.eql({whereNull: ['created_at']});
        });

        it('should support not null matches', function () {
            gql.findAll('posts').filter({created_at: {$ne: null}}).conditions
                .should.eql({whereNotNull: ['created_at']});
        });

        it('should support not null matches', function () {
            gql.findAll('posts').filter({created_at: {$ne: null}}).conditions
                .should.eql({whereNotNull: ['created_at']});
        });
    });

    describe('in clauses', function () {
        it('should support in matches', function () {
            gql.findAll('posts').filter({created_at: ['2016-03-01', '2016-03-02']}).conditions
                .should.eql({whereIn: ['created_at', ['2016-03-01', '2016-03-02']]});
        });

        it('should support not in matches', function () {
            gql.findAll('posts').filter({$not: {created_at: ['2016-03-01', '2016-03-02']}}).conditions
                .should.eql({whereNotIn: ['created_at', ['2016-03-01', '2016-03-02']]});
        });
    });

    describe('invalid filters', function () {
        it('should throw an error for a bad comparison operator', function () {
            (function () {
                gql.findAll('posts').filter({$bad: {created_at: ['2016-03-01', '2016-03-02']}});
            }).should.throw();
        });

        it('should throw an error for an aggregate query', function () {
            (function () {
                gql.findAll('posts').filter({'posts.id.$count': {$gt: 0}});
            }).should.throw();
        });

        it('should throw an error for an $or clause that does not have objects for values.', function () {
            (function () {
                gql.findAll('posts').filter({$or: ['sample']});
            }).should.not.throw();
        });

        it('should not throw an error for an $or clause that has a single object value', function () {
            (function () {
                gql.findAll('posts').filter({$or: {name: 'sample'}});
            }).should.not.throw();
        });
    });

    describe('nested groups', function () {
        it('should support $and queries nested one level deep', function () {
            var conditions = gql.findAll('posts').filter([
                    {$not: {created_at: ['2016-03-01', '2016-03-02']}},
                    {created_at: {$lt: '2016-03-04'}}
                ]
            ).conditions;
            // console.log(JSON.stringify(conditions));
            _.isEqual(conditions, [
                {whereNotIn: ['created_at', ['2016-03-01', '2016-03-02']]},
                {where: ['created_at', '<', '2016-03-04']}
            ]).should.eql(true);
        });

        it('should be able to execute queries containing groups of clauses', function () {
            var conditions, filter, sql;
            filter = gql.findAll('posts').filter({
                $or: [
                    [{created_at: {$lt: '2016-03-04'}},
                        {$not: {created_at: ['2016-03-01', '2016-03-02']}}],
                    {featured: false}
                ]
            });
            conditions = filter.conditions;
            // console.log(JSON.stringify(conditions));
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
            }).should.eql(true);
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // logical grouping --
    // -----------------------------------------------------------------------------------------------------------------

    describe('grouping by logical operators', function () {
        it('should support and queries', function () {
            var conditions = gql.findAll('posts').filter([{name: 'sample'}, {featured: false}]).conditions;
            // console.log(JSON.stringify(conditions));
            _.isEqual(conditions, [{where: ['name', 'sample']}, {where: ['featured', false]}]).should.eql(true);
        });

        it('should support or queries', function () {
            var conditions, test;
            conditions = gql.findAll('posts').filter([{$or: [{name: 'sample'}, {featured: false}]}]).conditions;
            test = {or: [{where: ['name', 'sample']}, {where: ['featured', false]}]};
            conditions.should.eql(test);
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // query execution --
    // -----------------------------------------------------------------------------------------------------------------

    describe('returned field selection', function () {
        it('should return all fields of all posts when called with no filter and no fetch fields', function (done) {
            gql.findAll('posts')
                .filter()
                .fetch()
                .then(function (result) {
                    result.length.should.eql(4);
                    Object.keys(result[0]).length.should.eql(6);
                    // console.log(JSON.stringify(result));
                    done();
                });
        });

        it('should return all fields of all posts when called with no filter and \'*\'', function (done) {
            gql.findAll('posts')
                .filter()
                .fetch('*')
                .then(function (result) {
                    result.length.should.eql(4);
                    Object.keys(result[0]).length.should.eql(6);
                    // console.log(JSON.stringify(result));
                    done();
                });
        });

        it('should return only id when called with fields \'id\' as a string', function (done) {
            gql.findAll('posts')
                .filter()
                .fetch('id')
                .then(function (result) {
                    result.length.should.eql(4);
                    Object.keys(result[0]).length.should.eql(1);
                    // console.log(JSON.stringify(result));
                    done();
                });
        });

        it('should return only id when called with fields [\'id\'] as an array', function (done) {
            gql.findAll('posts')
                .filter()
                .fetch(['id'])
                .then(function (result) {
                    result.length.should.eql(4);
                    Object.keys(result[0]).length.should.eql(1);
                    // console.log(JSON.stringify(result));
                    done();
                });
        });
    });

    describe('limit queries', function () {
        it('should return only 1 record after calling limit(1)', function (done) {
            gql.findAll('posts')
                .filter()
                .limit(1)
                .fetch('id')
                .then(function (result) {
                    result.length.should.eql(1);
                    Object.keys(result[0]).length.should.eql(1);
                    // console.log(JSON.stringify(result));
                    done();
                });
        });
    });

    describe('offset queries', function () {
        it('should return only 2 records after calling offset(2)', function (done) {
            gql.findAll('posts')
                .filter()
                .offset(2)
                .fetch('id')
                .then(function (result) {
                    result.length.should.eql(2);
                    Object.keys(result[0]).length.should.eql(1);
                    // console.log(JSON.stringify(result));
                    done();
                });
        });
    });

    describe('orderBy queries', function () {
        it('should return all posts in descending order after calling orderBy(\'name\', \'desc\')', function (done) {
            gql.findAll('posts')
                .filter({})
                .orderBy('name', 'desc')
                .fetch('name')
                .then(function (results) {
                    results.length.should.eql(4);
                    Object.keys(results[0]).length.should.eql(1);
                    // console.log(JSON.stringify(results));
                    var names = [];
                    _.each(results, function (result) {
                        names.push(result.name);
                    });

                    _.isMatch(names, _.sortBy(names).reverse()).should.eql(true);
                    done();
                });
        });

        it('should return all posts in ascending order after calling orderBy(\'name\')', function (done) {
            gql.findAll('posts')
                .filter({})
                .orderBy('name')
                .fetch('name')
                .then(function (results) {
                    results.length.should.eql(4);
                    Object.keys(results[0]).length.should.eql(1);
                    // console.log(JSON.stringify(results));
                    var names = [];
                    _.each(results, function (result) {
                        names.push(result.name);
                    });

                    _.isMatch(names, _.sortBy(names)).should.eql(true);
                    done();
                });
        });
    });

    describe('fetch().toSQL()', function () {
        it('should correctly convert statement to SQL string', function () {
            gql.findAll('posts')
                .filter({})
                .orderBy('name')
                .fetch('name')
                .toString()
                .should.eql('select "name" from "posts" order by "name" asc');
        });
    });

    describe('filter with objects', function () {
        it('should accept and properly query given an array of filters', function () {
            gql.findAll('posts')
                .filter([{name: 'sample'}, {featured: true}])
                .orderBy('name')
                .toSQL('name')
                .should.eql('select "name" from "posts" where "name" = \'sample\' and "featured" = true order by "name" asc');
        });

        it('should return all posts when calling findAll with an empty object filter', function (done) {
            gql.findAll('posts')
                .filter({})
                .fetch()
                .then(function (result) {
                    result.length.should.eql(4);
                    // console.log(JSON.stringify(result));
                    done();
                });
        });
    });

    describe('grouped clauses', function () {
        it('should support nested or queries one level deep', function (done) {
            var query = 'name:sample,(!name:sample+created_at:<=\'2016-03-03\'),(created_at:>\'2016-03-03\')';
            gql.parse(query).should.eql([
                {name: 'sample'},
                {$or: [
                    // no nested array because the outer array had only one element and was therefore reduced
                    {$not: {name: 'sample'}},
                    {created_at: {$lte: '2016-03-03'}}
                ]},
                {$or: {created_at: {$gt: '2016-03-03'}}}
            ]);

            query = 'name:sample,(!name:sample+created_at:<=\'2016-03-03\'),(created_at:\'2016-03-03\',created_at:\'2016-03-04\')';
            gql.parse(query).should.eql([
                {name: 'sample'},
                {$or: [ {$not: {name: 'sample'}}, {created_at: {$lte: '2016-03-03'}} ]},
                {$or: [ {created_at: '2016-03-03'}, {$or: {created_at: '2016-03-04'}} ]}
            ]);

            gql.findAll('posts')
                .filter(query)
                .fetch().then(function (result) {
                    console.log(JSON.stringify(result));
                    result.length.should.eql(3);
                    done();
            });
        });
    });
});

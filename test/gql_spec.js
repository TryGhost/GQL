var _, chai, knex, gql;
_ = require('lodash');

chai = require('chai');
chai.should();
chai.use(require('chai-bookshelf'));
chai.use(require('chai-as-promised'));

knex = require('knex')({
    client: 'sqlite3',
    connection: {filename: ':memory:'}
    // , debug: true
});

gql = require('../src/gql');

describe('GQL', function () {
    before(function (done) {
        var image = 'asdfghjkl;';
        knex.schema.createTable('posts', function (table) {
            table.increments();
            table.string('name');
            table.binary('image');
            table.integer('author_id');
            table.boolean('featured').defaultTo(false);
            table.timestamps();
        }).then(function () {
            return knex.schema.createTable('users', function (table) {
                table.increments();
                table.string('username');
                table.string('name');
                table.timestamps();
            }).then(function () {
                return knex('users').insert({
                    id: 1,
                    username: 'foo',
                    name: 'Foo Foo'
                }).then(function () {
                    return knex('users').insert({
                        id: 2,
                        username: 'bar',
                        name: 'Bar Bar'
                    });
                });
            });
        }).then(function () {
            return knex.schema.createTable('comments', function (table) {
                table.increments();
                table.integer('author_id');
                table.integer('post_id');
                table.string('comment');
                table.timestamps();
            });
        }).then(function () {
            return knex.schema.createTable('tags', function (table) {
                table.increments();
                table.string('name');
                table.string('slug');
                table.timestamps();
            });
        }).then(function () {
            return knex.schema.createTable('posts_tags', function (table) {
                table.integer('post_id');
                table.integer('tag_id');
                table.timestamps();
            });
        }).then(function () {
            return knex.schema.createTable('products', function (table) {
                table.increments();
                table.string('name');
                table.decimal('price');
                table.timestamps();
            });
        }).then(function () {
            return knex.schema.createTable('customers', function (table) {
                table.increments();
                table.string('name');
                table.timestamps();
            });
        }).then(function () {
            return knex.schema.createTable('orders', function (table) {
                table.increments();
                table.integer('customer_id');
                table.integer('product_id');
                table.integer('quantity');
                table.timestamps();
            });
        }).then(function () {
            return knex('posts').insert({
                id: 1,
                author_id: 1,
                name: 'sample',
                created_at: '2016-03-01'
            }).then(function () {
                return knex('comments').insert({
                    id: 1,
                    author_id: 1,
                    post_id: 1,
                    comment: 'Hello world'
                }).then(function () {
                    return knex('comments').insert({
                        id: 2,
                        author_id: 1,
                        post_id: 1,
                        comment: 'Hello again'
                    });
                }).then(function () {
                    return knex('tags').insert({
                        id: 1,
                        name: 'Hot',
                        slug: 'hot'
                    }).then(function () {
                        return knex('tags').insert({
                            id: 2,
                            name: 'Cold',
                            slug: 'cold'
                        });
                    }).then(function () {
                        return knex('posts_tags').insert({
                            tag_id: 1,
                            post_id: 1
                        }).then(function () {
                            return knex('posts_tags').insert({
                                tag_id: 2,
                                post_id: 1
                            });
                        });
                    });
                });
            });
        }).then(function () {
            return knex('posts').insert({
                id: 2,
                author_id: 2,
                name: 'featured-sample',
                featured: true,
                created_at: '2016-03-02'
            }).then(function () {
                return knex('posts_tags').insert({
                    tag_id: 1,
                    post_id: 2
                });
            });
        }).then(function () {
            return knex('posts').insert({
                id: 3,
                author_id: 2,
                name: 'sample-with-image',
                image: image,
                created_at: '2016-03-03'
            });
        }).then(function () {
            return knex('posts').insert({
                id: 4,
                author_id: 2,
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
            gql.parse('id:\'1 and 1‘=\'1`\'').applyTo(knex('posts')).toSQL();
        }).should.throw();
        gql.parse('posts.id:\'1 and a=\\\'1`\'').applyTo(knex('posts')).toString()
            .should.eql('select * from "posts" where "posts"."id" = \'1 and a=\\\'1`\'');
    });

    describe('filter with a string', function () {
        it('should support a string argument', function (done) {
            gql.parse('name:sample').applyTo(knex('posts')).select().then(function (result) {
                result.length.should.eql(1);
                Object.keys(result[0]).length.should.eql(7);
                done();
            });
        });

        it('should interpret an an empty string as no conditions (empty array)', function () {
            gql.parse('').conditions.should.eql([]);
        });
    });

    describe('basic matching', function () {
        it('should perform exact string matches', function (done) {
            gql.parse({name: 'sample'}).applyTo(knex('posts'))
                .select()
                .then(function (result) {
                    result[0].name.should.eql('sample');
                    // console.log(JSON.stringify(result));
                    done();
                });
        });

        it('should perform like matches', function () {
            it('on json', function (done) {
                gql.parse([{name: {$like: '%ample'}}, {name: {$like: 'fe%'}}]).applyTo(knex('posts'))
                    .select()
                    .then(function (result) {
                        result.length.should.eql(1);
                        result[0].name.should.eql('featured-sample');
                        // console.log(JSON.stringify(result));
                        done();
                    });
            });

            it('on strings', function (done) {
                var query = gql.parse('name:~%ample+name:~fe%');
                query.applyTo(knex('posts'))
                    .select()
                    .then(function (result) {
                        result.length.should.eql(1);
                        result[0].name.should.eql('featured-sample');
                        done();
                    });
            });
        });

        it('should support exact not matches', function () {
            gql.parse({$not: {name: 'sample'}}).conditions
                .should.eql({whereNot: ['name', 'sample']});
            gql.parse('!name:sample').conditions
                .should.eql({whereNot: ['name', 'sample']});
        });

        it('should not support exact not equals matches using $ne', function () {
            (function () {
                gql.parse({name: {$ne: 'sample'}});
            }).should.throw();
        });

        it('should support less than matches', function () {
            gql.parse({created_at: {$lt: '2016-03-02'}}).conditions
                .should.eql({where: ['created_at', '<', '2016-03-02']});
            gql.parse('created_at:<\'2016-03-02\'').conditions
                .should.eql({where: ['created_at', '<', '2016-03-02']});
        });

        it('should support not less than matches', function () {
            gql.parse({created_at: {$not: {$lt: '2016-03-02'}}}).conditions
                .should.eql({whereNot: ['created_at', '<', '2016-03-02']});
            var q = gql.parse('!created_at:<\'2016-03-02\'');
            q.conditions.should.eql({whereNot: ['created_at', '<', '2016-03-02']});
        });

        it('should support greater than matches', function () {
            gql.parse({created_at: {$gt: '2016-03-02'}}).conditions
                .should.eql({where: ['created_at', '>', '2016-03-02']});
            gql.parse('created_at:>\'2016-03-02\'').conditions
                .should.eql({where: ['created_at', '>', '2016-03-02']});
        });

        it('should support not greater than matches', function () {
            gql.parse({created_at: {$not: {$gt: '2016-03-02'}}}).conditions
                .should.eql({whereNot: ['created_at', '>', '2016-03-02']});
            gql.parse('!created_at:>\'2016-03-02\'').conditions
                .should.eql({whereNot: ['created_at', '>', '2016-03-02']});
        });

        it('should support less than equal matches', function () {
            gql.parse({created_at: {$lte: '2016-03-02'}}).conditions
                .should.eql({where: ['created_at', '<=', '2016-03-02']});
            gql.parse('created_at:<=\'2016-03-02\'').conditions
                .should.eql({where: ['created_at', '<=', '2016-03-02']});
        });

        it('should support not less than equal matches', function () {
            gql.parse({created_at: {$not: {$lte: '2016-03-02'}}}).conditions
                .should.eql({whereNot: ['created_at', '<=', '2016-03-02']});
            gql.parse('!created_at:<=\'2016-03-02\'').conditions
                .should.eql({whereNot: ['created_at', '<=', '2016-03-02']});
        });

        it('should support greater than equal matches', function () {
            gql.parse({created_at: {$gte: '2016-03-02'}}).conditions
                .should.eql({where: ['created_at', '>=', '2016-03-02']});
            gql.parse('created_at:>=\'2016-03-02\'').conditions
                .should.eql({where: ['created_at', '>=', '2016-03-02']});
        });

        it('should support not greater than equal matches', function () {
            gql.parse({created_at: {$not: {$gte: '2016-03-02'}}}).conditions
                .should.eql({whereNot: ['created_at', '>=', '2016-03-02']});
            gql.parse('!created_at:>=\'2016-03-02\'').conditions
                .should.eql({whereNot: ['created_at', '>=', '2016-03-02']});
        });

        it('should support null matches', function () {
            gql.parse({created_at: null}).conditions
                .should.eql({whereNull: ['created_at']});
            gql.parse('created_at:null').conditions
                .should.eql({whereNull: ['created_at']});
        });

        it('should support not null matches', function () {
            gql.parse({$not: {created_at: null}}).conditions
                .should.eql({whereNotNull: ['created_at']});
            gql.parse('!created_at:null').conditions
                .should.eql({whereNotNull: ['created_at']});
        });

        it('should support Javascript Date values through the JSON API', function (done) {
            // Dates are supported to the extent that knex supports them. So timezone issues, etc. would all be handled
            // however Knex handles them. Dates are supported by GQL as a value type though.

            // yes, this is intended to be 02-01, a date prior to all of the dates in our database
            var query = gql.parse({created_at: {$gt: new Date('2016-02-01')}});
            query.applyTo(knex('posts'))
                .select()
                .then(function (result) {
                    result.length.should.eql(4);
                    done();
                });
        });
    });

    describe('in clauses', function () {
        it('should support in matches', function () {
            gql.parse({created_at: ['2016-03-01', '2016-03-02']}).conditions
                .should.eql({whereIn: ['created_at', ['2016-03-01', '2016-03-02']]});
            gql.parse('created_at: [\'2016-03-01\', \'2016-03-02\']').conditions
                .should.eql({whereIn: ['created_at', ['2016-03-01', '2016-03-02']]});
        });

        it('should support not in matches', function () {
            gql.parse({$not: {created_at: ['2016-03-01', '2016-03-02']}}).conditions
                .should.eql({whereNotIn: ['created_at', ['2016-03-01', '2016-03-02']]});
            gql.parse('!created_at: [\'2016-03-01\', \'2016-03-02\']').conditions
                .should.eql({whereNotIn: ['created_at', ['2016-03-01', '2016-03-02']]});
        });
    });

    describe('invalid filters', function () {
        it('should throw an error for a bad comparison operator (json api only)', function () {
            (function () {
                gql.parse({$bad: {created_at: ['2016-03-01', '2016-03-02']}});
            }).should.throw();
        });

        it('should throw an error for an $or clause that does not have a value that\'s an array.', function () {
            (function () {
                gql.parse({$or: 'sample'});
            }).should.throw();
            (function () {
                gql.parse(',sample');
            }).should.throw();
        });

        it('should not throw an error for an $or clause that has a single object value', function () {
            (function () {
                gql.parse({$or: {name: 'sample'}});
            }).should.not.throw();
            (function () {
                // this throws because it's not or'd with anything
                gql.parse(',name:sample');
            }).should.throw();
        });
    });

    describe('aggregate queries', function () {
        var usersAndPosts;
        beforeEach(function () {
            // the join and group by are not part of the query.
            // the specify how the users and posts table relate.
            // so we do that outside of the filters.
            usersAndPosts = knex('users')
                .join('posts', 'users.id', 'posts.author_id')
                .groupBy('users.id');
        });

        it('should support $having', function (done) {
            // we only need to specify the filter here
            gql.parse('$having.post_count:>0')
                .applyTo(usersAndPosts)
                // specify which fields to get
                .select('users.*')
                .count('posts.id as post_count')
                // order just so we can verify correct counts
                .orderBy('id')
                .then(function (result) {
                    result.length.should.eql(2);
                    result[0].post_count.should.eql(1);
                    result[1].post_count.should.eql(3);
                    done();
                });
        });

        it('should fail an attempt to negate $having', function () {
            (function () {
                gql.parse('!$having.post_count:>0').applyTo(usersAndPosts);
            }).should.throw();
        });

        it('should fail an attempt to use an invalid operator with $having (json api only)', function () {
            (function () {
                // only possible with json api. parser will throw this sort of thing out when parsing.
                gql.parse({'$having.post_count': {$uhoh: 0}}).applyTo(usersAndPosts);
            }).should.throw();
        });
    });

    describe('nested groups', function () {
        it('should support $and queries nested one level deep', function () {
            var e, p;
            e = [
                {whereNotIn: ['created_at', ['2016-03-01', '2016-03-02']]},
                {where: ['created_at', '<', '2016-03-04']}
            ];

            p = gql.parse([
                    {$not: {created_at: ['2016-03-01', '2016-03-02']}},
                    {created_at: {$lt: '2016-03-04'}}
                ]
            );
            p.conditions.should.eql(e);
            gql.parse('!(created_at:[\'2016-03-01\',\'2016-03-02\'])+created_at:<\'2016-03-04\'').should.eql(p);
        });

        it('should support $or queries nested one level deep', function () {
            var p, e;
            p = gql.parse([
                    [{created_at: {$lt: '2016-03-04'}},
                        {$not: {created_at: ['2016-03-01', '2016-03-02']}}],
                    {$or: {featured: false}}
                ]
            );

            e = [
                [
                    {where: ['created_at', '<', '2016-03-04']},
                    {whereNotIn: ['created_at', ['2016-03-01', '2016-03-02']]}
                ],
                {or: {where: ['featured', false]}}
            ];
            p.conditions.should.eql(e);
            gql.parse('(created_at:<\'2016-03-04\'+!created_at:[\'2016-03-01\',\'2016-03-02\']),featured:false').should.eql(p);
        });
    });

    // -----------------------------------------------------------------------------------------------------------------
    // logical grouping --
    // -----------------------------------------------------------------------------------------------------------------

    describe('basic and and or', function () {
        it('should support and queries', function () {
            var query = gql.parse('name:sample+featured:false');
            query.should.eql(gql.parse([{name: 'sample'}, {featured: false}]));
            query.conditions.should.eql([{where: ['name', 'sample']}, {where: ['featured', false]}]);
        });

        it('should support or queries', function () {
            var query = gql.parse('name:sample,featured:false');
            query.should.eql(gql.parse([{name: 'sample'}, {$or: {featured: false}}]));
            query.conditions.should.eql([{where: ['name', 'sample']}, {or: {where: ['featured', false]}}]);
        });
    });

    describe('grouped clauses', function () {
        describe('should support or queries', function () {
            it('containing a nested and', function (done) {
                var query = gql.parse('name:sample,(!name:sample+created_at:<=\'2016-03-03\')');
                query.filters.should.eql([
                    {name: 'sample'},
                    {
                        $or: [
                            // no nested array because the outer array had only one element and was therefore reduced
                            {$not: {name: 'sample'}},
                            {created_at: {$lte: '2016-03-03'}}
                        ]
                    }
                ]);
                query.applyTo(knex('posts'))
                    .select()
                    .then(function (result) {
                        result.length.should.eql(3);
                        done();
                    });
            });

            it('containing a nested or', function (done) {
                var query = gql.parse('name:sample,(created_at:\'2016-03-03\',created_at:\'2016-03-04\')');
                query.filters.should.eql([
                    {name: 'sample'},
                    {
                        $or: [
                            // no nested array because the outer array had only one element and was therefore reduced
                            {created_at: '2016-03-03'},
                            {$or: {created_at: '2016-03-04'}}
                        ]
                    }
                ]);
                query.applyTo(knex('posts'))
                    .select()
                    .then(function (result) {
                        result.length.should.eql(3);
                        done();
                    });
            });

            it('containing a nested clause containing a single statement', function (done) {
                var query = gql.parse('name:sample,(created_at:<=\'2016-03-03\')');
                query.filters.should.eql([
                    {name: 'sample'},
                    {$or: {created_at: {$lte: '2016-03-03'}}} // no nested array because the outer array had only one element and was therefore reduced
                ]);
                query.applyTo(knex('posts'))
                    .select()
                    .then(function (result) {
                        result.length.should.eql(3);
                        done();
                    });
            });
        });

        describe('should support and queries', function () {
            it('containing a nested and', function (done) {
                var query = gql.parse('name:sample+(!name:sample+created_at:<=\'2016-03-03\')');
                query.filters.should.eql([
                    {name: 'sample'},
                    [
                        // no nested array because the outer array had only one element and was therefore reduced
                        {$not: {name: 'sample'}},
                        {created_at: {$lte: '2016-03-03'}}
                    ]
                ]);
                query.applyTo(knex('posts'))
                    .select()
                    .then(function (result) {
                        result.length.should.eql(0);
                        done();
                    });
            });

            it('containing a nested clause containing a single element', function (done) {
                var query = gql.parse('name:sample+(created_at:<=\'2016-03-03\')');
                query.filters.should.eql([
                    {name: 'sample'},
                    // no nested array because the outer array had only one element and was therefore reduced
                    {created_at: {$lte: '2016-03-03'}}
                ]);

                query.applyTo(knex('posts'), query)
                    .select()
                    .then(function (result) {
                        result.length.should.eql(1);
                        done();
                    });
            });
        });

        it('should support nested and queries', function (done) {
            var query = gql.parse('name:sample,(!name:sample+created_at:<=\'2016-03-03\'),(created_at:>\'2016-03-03\')');
            query.filters.should.eql([
                {name: 'sample'},
                {
                    $or: [
                        // no nested array because the outer array had only one element and was therefore reduced
                        {$not: {name: 'sample'}},
                        {created_at: {$lte: '2016-03-03'}}
                    ]
                },
                {$or: {created_at: {$gt: '2016-03-03'}}}
            ]);
            query.applyTo(knex('posts'))
                .select()
                .then(function (result) {
                    result.length.should.eql(4);
                    done();
                });
        });

        it('should support nested or queries', function (done) {
            var query = gql.parse('name:sample,(!name:sample+created_at:<=\'2016-03-03\'),(!name:sample+(created_at:\'2016-03-03\',created_at:\'2016-03-04\'))');
            query.filters.should.eql([
                {name: 'sample'},
                {$or: [{$not: {name: 'sample'}}, {created_at: {$lte: '2016-03-03'}}]},
                {$or: [{$not: {name: 'sample'}}, [{created_at: '2016-03-03'}, {$or: {created_at: '2016-03-04'}}]]}
            ]);
            query.applyTo(knex('posts'))
                .select()
                .then(function (result) {
                    result.length.should.eql(4);
                    done();
                });
        });
    });

    describe('relations', function () {
        it('should extract simple relations', function () {
            gql.parse('title:Hello').relations().should.eql([]);
        });

        it('should extract complex relations', function () {
            gql.parse('title:Hello,!(famous:true+happy:[\'yes\',\'no\',\'maybe\'])+comments.id:5+tags.foo.bar:baz+tags.faz: balls')
                .relations().should.eql(['comments', 'tags']);
        });
    });
});

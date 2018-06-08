const should = require('should'); // eslint-disable-line no-unused-vars
const gql = require('../lib/gql');
const mingo = require('mingo');
// A simpler format of JSON useful for testing most behaviours
const simpleJSON = require('./fixtures/simple');
// A more advanced format, useful for testing joins, aggregates and other advanced behaviours
const advancedJSON = require('./fixtures/advanced');

/**
 * The purpose of this file is to prove that GQL
 * is not just transformed to mongo queries correctly
 * but that this can be used in real world settings to match JSON
 */

const makeQuery = (gqlString) => {
    const filter = gql.parse(gqlString);
    return new mingo.Query(filter);
};

describe('Integration with Mingo', function () {
    describe('Simple Expressions', function () {
        it('should match based on simple id', function () {
            const query = makeQuery('id:3');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });

        it('should match based on string', function () {
            const query = makeQuery('title:\'Second post\'');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(false);
        });
    });

    describe('Comparison Query Operators', function () {
        it('can match not equals', function () {
            const query = makeQuery('id:-2');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });

        it('can match not equals', function () {
            const query = makeQuery('id:-2');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });

        it('can match gt', function () {
            const query = makeQuery('id:>2');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });

        it('can match lt', function () {
            const query = makeQuery('id:<2');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(false);
        });

        it('can match gte', function () {
            const query = makeQuery('id:>=2');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });

        it('can match lte', function () {
            const query = makeQuery('id:<=2');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(false);
        });

        it('can match simple in (single value)', function () {
            const query = makeQuery('id:[2]');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(false);
        });

        it('can match simple in (multiple values)', function () {
            const query = makeQuery('id:[1,3]');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });

        it('can match simple NOT in (single value)', function () {
            const query = makeQuery('id:-[2]');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });

        it('can match simple NOT in (multiple values)', function () {
            const query = makeQuery('id:-[1,3]');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(false);
        });

        it('can match array in (single value)', function () {
            const query = makeQuery('tags:[video]');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(true);
            query.test(simpleJSON.posts[3]).should.eql(false);
            query.test(simpleJSON.posts[4]).should.eql(false);
        });

        it('can match array in (multiple values)', function () {
            const query = makeQuery('tags:[video, audio]');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(true);
            query.test(simpleJSON.posts[3]).should.eql(true);
            query.test(simpleJSON.posts[4]).should.eql(false);
        });

        it('can match array NOT in (single value)', function () {
            const query = makeQuery('tags:-[video]');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(false);
            query.test(simpleJSON.posts[3]).should.eql(true);
            query.test(simpleJSON.posts[4]).should.eql(true);
        });

        it('can match array NOT in (multiple values)', function () {
            const query = makeQuery('tags:-[video, audio]');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(false);
            query.test(simpleJSON.posts[3]).should.eql(false);
            query.test(simpleJSON.posts[4]).should.eql(true);
        });
    });

    describe('Logical Query Operators', function () {
        it('$and (different properties)', function () {
            const query = makeQuery('featured:false+status:published');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(false);
        });

        it('$and (same properties)', function () {
            const query = makeQuery('featured:false+featured:true');

            query.test(simpleJSON.posts[0]).should.eql(false);
            query.test(simpleJSON.posts[1]).should.eql(false);
            query.test(simpleJSON.posts[2]).should.eql(false);
        });

        it('$or (different properties)', function () {
            const query = makeQuery('featured:false,status:published');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });

        it('$or (same properties)', function () {
            const query = makeQuery('featured:true,featured:false');

            query.test(simpleJSON.posts[0]).should.eql(true);
            query.test(simpleJSON.posts[1]).should.eql(true);
            query.test(simpleJSON.posts[2]).should.eql(true);
        });
    });

    describe('Logical Groups', function () {
        describe('$or', function () {
            it('ungrouped version', function () {
                const query = makeQuery('author:-joe,tags:[photo],image:-null,featured:true');

                query.test(simpleJSON.posts[0]).should.eql(true); // tag photo
                query.test(simpleJSON.posts[1]).should.eql(true); // image not null
                query.test(simpleJSON.posts[2]).should.eql(true); // featured true
                query.test(simpleJSON.posts[3]).should.eql(true); // author not joe
                query.test(simpleJSON.posts[4]).should.eql(false);
            });

            it('RIGHT grouped version', function () {
                const query = makeQuery('author:-joe,(tags:[photo],image:-null,featured:true)');

                query.test(simpleJSON.posts[0]).should.eql(true);
                query.test(simpleJSON.posts[1]).should.eql(true);
                query.test(simpleJSON.posts[2]).should.eql(true);
                query.test(simpleJSON.posts[3]).should.eql(true);
                query.test(simpleJSON.posts[4]).should.eql(false);
            });

            it('LEFT grouped version', function () {
                const query = makeQuery('(tags:[photo],image:-null,featured:true),author:-joe');

                query.test(simpleJSON.posts[0]).should.eql(true);
                query.test(simpleJSON.posts[1]).should.eql(true);
                query.test(simpleJSON.posts[2]).should.eql(true);
                query.test(simpleJSON.posts[3]).should.eql(true);
                query.test(simpleJSON.posts[4]).should.eql(false);
            });
        });

        describe('$and', function () {
            it('ungrouped version', function () {
                const query = makeQuery('author:-joe+tags:[photo],image:-null,featured:true');

                query.test(simpleJSON.posts[0]).should.eql(false);
                query.test(simpleJSON.posts[1]).should.eql(true);
                query.test(simpleJSON.posts[2]).should.eql(true);
                query.test(simpleJSON.posts[3]).should.eql(true);
                query.test(simpleJSON.posts[4]).should.eql(false);
            });

            it('RIGHT grouped version', function () {
                const query = makeQuery('author:-joe+(tags:[photo],image:-null,featured:true)');

                query.test(simpleJSON.posts[0]).should.eql(false);
                query.test(simpleJSON.posts[1]).should.eql(false);
                query.test(simpleJSON.posts[2]).should.eql(true);
                query.test(simpleJSON.posts[3]).should.eql(true);
                query.test(simpleJSON.posts[4]).should.eql(false);
            });

            it('LEFT grouped version', function () {
                const query = makeQuery('(tags:[photo],image:-null,featured:true)+author:-joe');

                query.test(simpleJSON.posts[0]).should.eql(false);
                query.test(simpleJSON.posts[1]).should.eql(false);
                query.test(simpleJSON.posts[2]).should.eql(true);
                query.test(simpleJSON.posts[3]).should.eql(true);
                query.test(simpleJSON.posts[4]).should.eql(false);
            });
        });
    });

    describe('Joins', function () {
        describe('IN with array of objects', function () {
            it('can match array in (single value)', function () {
                const query = makeQuery('tags.slug:[video]');

                query.test(advancedJSON.posts[0]).should.eql(false);
                query.test(advancedJSON.posts[1]).should.eql(true);
                query.test(advancedJSON.posts[2]).should.eql(true);
                query.test(advancedJSON.posts[3]).should.eql(false);
                query.test(advancedJSON.posts[4]).should.eql(false);
            });

            it('can match array in (multiple values)', function () {
                const query = makeQuery('tags.slug:[video, audio]');

                query.test(advancedJSON.posts[0]).should.eql(false);
                query.test(advancedJSON.posts[1]).should.eql(true);
                query.test(advancedJSON.posts[2]).should.eql(true);
                query.test(advancedJSON.posts[3]).should.eql(true);
                query.test(advancedJSON.posts[4]).should.eql(false);
            });

            it('can match array NOT in (single value)', function () {
                const query = makeQuery('tags.slug:-[video]');

                query.test(advancedJSON.posts[0]).should.eql(true);
                query.test(advancedJSON.posts[1]).should.eql(false);
                query.test(advancedJSON.posts[2]).should.eql(false);
                query.test(advancedJSON.posts[3]).should.eql(true);
                query.test(advancedJSON.posts[4]).should.eql(true);
            });

            it('can match array NOT in (multiple values)', function () {
                const query = makeQuery('tags.slug:-[video, audio]');

                query.test(advancedJSON.posts[0]).should.eql(true);
                query.test(advancedJSON.posts[1]).should.eql(false);
                query.test(advancedJSON.posts[2]).should.eql(false);
                query.test(advancedJSON.posts[3]).should.eql(false);
                query.test(advancedJSON.posts[4]).should.eql(true);
            });
        });
    });
});

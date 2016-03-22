/* globals describe, it */
/* jshint unused:false */
var should = require('should'),
    gql = require('../src/gql');

describe('Parser', function () {
    var parserError = /^Query Error: unexpected character in filter at char/;

    describe('Operators', function () {
        it('can parse standard equals', function () {
            gql.parse('count:5').filters.should.eql(
                {count: 5}
            );

            gql.parse('tag:getting-started').filters.should.eql(
                {tag: 'getting-started'}
            );

            gql.parse('author:\'Joe Bloggs\'').filters.should.eql(
                {author: 'Joe Bloggs'}
            );
        });

        it('can parse not equals', function () {
            gql.parse('!count:5').filters.should.eql(
                {$not: {count: 5}}
            );

            gql.parse('!tag:getting-started').filters.should.eql(
                {$not: {tag: 'getting-started'}}
            );

            gql.parse('!author:\'Joe Bloggs\'').filters.should.eql(
                {$not: {author: 'Joe Bloggs'}}
            );
        });

        it('can parse greater than', function () {
            gql.parse('count:>5').filters.should.eql(
                {count: {$gt: 5}}
            );

            gql.parse('tag:>getting-started').filters.should.eql(
                {tag: {$gt: 'getting-started'}}
            );

            gql.parse('author:>\'Joe Bloggs\'').filters.should.eql(
                {author: {$gt: 'Joe Bloggs'}}
            );
        });

        it('can parse less than', function () {
            gql.parse('count:<5').filters.should.eql(
                {count: {$lt: 5}}
            );

            gql.parse('tag:<getting-started').filters.should.eql(
                {tag: {$lt: 'getting-started'}}
            );

            gql.parse('author:<\'Joe Bloggs\'').filters.should.eql(
                {author: {$lt: 'Joe Bloggs'}}
            );
        });

        it('can parse greater than or equals', function () {
            gql.parse('count:>=5').filters.should.eql(
                {count: {$gte: 5}}
            );

            gql.parse('tag:>=getting-started').filters.should.eql(
                {tag: {$gte: 'getting-started'}}
            );

            gql.parse('author:>=\'Joe Bloggs\'').filters.should.eql(
                {author: {$gte: 'Joe Bloggs'}}
            );
        });

        it('can parse less than or equals', function () {
            gql.parse('count:<=5').filters.should.eql(
                {count: {$lte: 5}}
            );

            gql.parse('tag:<=getting-started').filters.should.eql(
                {tag: {$lte: 'getting-started'}}
            );

            gql.parse('author:<=\'Joe Bloggs\'').filters.should.eql(
                {author: {$lte: 'Joe Bloggs'}}
            );
        });

        it('can parse IN with single value', function () {
            gql.parse('count:[5]').filters.should.eql(
                {count: 5}
            );

            gql.parse('tag:[getting-started]').filters.should.eql(
                {tag: 'getting-started'}
            );

            gql.parse('author:[\'Joe Bloggs\']').filters.should.eql(
                {author: 'Joe Bloggs'}
            );
        });

        it('can parse NOT IN with single value', function () {
            gql.parse('!count:[5]').filters.should.eql(
                {$not: {count: 5}}
            );

            gql.parse('!tag:[getting-started]').filters.should.eql(
                {$not: {tag: 'getting-started'}}
            );

            gql.parse('!author:[\'Joe Bloggs\']').filters.should.eql(
                {$not: {author: 'Joe Bloggs'}}
            );
        });

        it('can parse IN with multiple values', function () {
            gql.parse('count:[5, 8, 12]').filters.should.eql(
                {count: [5, 8, 12]}
            );

            gql.parse('tag:[getting-started, ghost, really-long-1]').filters.should.eql(
                {tag: ['getting-started', 'ghost', 'really-long-1']}
            );

            gql.parse('tag:[getting-started, ghost, really-long-1]').filters.should.eql(
                {tag: ['getting-started', 'ghost', 'really-long-1']}
            );

            gql.parse('author:[\'Joe Bloggs\', \'John O\\\'Nolan\', \'Hello World\']').filters.should.eql(
                {author: ['Joe Bloggs', 'John O\'Nolan', 'Hello World']}
            );
        });

        it('can parse NOT IN with single value', function () {
            gql.parse('!count:[5, 8, 12]').filters.should.eql(
                {$not: {count: [5, 8, 12]}}
            );

            gql.parse('!tag:[getting-started, ghost, really-long-1]').filters.should.eql(
                {$not: {tag: ['getting-started', 'ghost', 'really-long-1']}}
            );

            gql.parse('!author:[\'Joe Bloggs\', \'John O\\\'Nolan\', \'Hello World\']').filters.should.eql(
                {$not: {author: ['Joe Bloggs', 'John O\'Nolan', 'Hello World']}}
            );
        });
    });

    describe('Not conditions', function () {
        it('can parse NOT true', function () {
            gql.parse('!featured:true').filters.should.eql(
                {$not: {featured: true}}
            );
        });
    });

    describe('Values', function () {
        it('can parse null', function () {
            gql.parse('image:null').filters.should.eql(
                {image: null}
            );
        });

        it('can parse NOT null', function () {
            gql.parse('!image:null').filters.should.eql(
                {$not: {image: null}}
            );
        });

        it('can parse true', function () {
            gql.parse('featured:true').filters.should.eql(
                {featured: true}
            );
        });

        it('can parse false', function () {
            gql.parse('featured:false').filters.should.eql(
                {featured: false}
            );
        });

        it('can parse NOT false', function () {
            gql.parse('!featured:false').filters.should.eql(
                {$not: {featured: false}}
            );
        });

        it('can parse a Number', function () {
            gql.parse('count:5').filters.should.eql(
                {count: 5}
            );
        });

        it('can parse NOT a Number', function () {
            gql.parse('!count:5').filters.should.eql(
                {$not: {count: 5}}
            );
        });

        it('can parse a value with an exclamation point', function () {
            var q = gql.parse('word:\'Hello world!\'');
            q.filters.should.eql({word: 'Hello world!'});
            q.should.eql(gql.parse({word: 'Hello world!'}));
        });
    });

    describe('simple expressions', function () {
        it('should parse simple id & value combos', function () {
            gql.parse('id:3').filters.should.eql(
                {id: 3}
            );

            gql.parse('slug:getting-started').filters.should.eql(
                {slug: 'getting-started'}
            );
        });
    });

    describe('complex examples', function () {
        it('many expressions', function () {
            var one, oneTest, two, twoTest;
            one = gql.parse('tag:photo+featured:true,tag.id:>5');
            oneTest = [
                {tag: 'photo'},
                {featured: true},
                {$or: {'tag.id': {$gt: 5}}}
            ];
            one.filters.should.eql(oneTest);

            two = gql.parse('tag:photo+!image:null,tags.id:>5');
            twoTest = [
                {tag: 'photo'},
                {$not: {image: null}},
                {$or: {'tags.id': {$gt: 5}}}
            ];
            two.filters.should.eql(twoTest);
        });

        it('grouped expressions', function () {
            var one, oneTest, two, twoTest, three, threeTest, four, fourTest, five, fiveTest;
            one = gql.parse('!author:joe+(tag:photo,!image:null,featured:true)');
            oneTest = [
                {$not: {author: 'joe'}},
                [
                    {tag: 'photo'},
                    {$or: {$not: {image: null}}},
                    {$or: {featured: true}}
                ]
            ];

            // console.log(JSON.stringify(one));
            // console.log(JSON.stringify(oneTest));
            one.filters.should.eql(oneTest);

            two = gql.parse('(tag:photo,!image:null,featured:true)+!author:joe');
            twoTest = [
                [
                    {tag: 'photo'},
                    {$or: {$not: {image: null}}},
                    {$or: {featured: true}}
                ],
                {$not: {author: 'joe'}}
            ];
            // console.log(JSON.stringify(two));
            // console.log(JSON.stringify(twoTest));
            two.filters.should.eql(twoTest);

            three = gql.parse('!author:joe,(tag:photo,!image:null,featured:true)');
            threeTest = [
                {$not: {author: 'joe'}},
                {$or: [
                    {tag: 'photo'},
                    {$or: {$not: {image: null}}},
                    {$or: {featured: true}}
                ]}
            ];
            // console.log(JSON.stringify(three));
            // console.log(JSON.stringify(threeTest));
            three.filters.should.eql(threeTest);

            four = gql.parse('(tag:photo,!image:null,featured:false),!author:joe');
            fourTest = [
                    [
                        {tag: 'photo'},
                        {$or: {$not: {image: null}}},
                        {$or: {featured: false}}
                    ],
                {$or: {$not: {author: 'joe'}}}
                ];
            // console.log(JSON.stringify(four));
            // console.log(JSON.stringify(fourTest));
            four.filters.should.eql(fourTest);

            five = gql.parse('name:sample,(!name:sample+created_at:<=\'2016-03-03\'),(!name:sample+(created_at:\'2016-03-03\',created_at:\'2016-03-04\'))');
            fiveTest = [
                {name: 'sample'},
                {$or: [
                    {$not: {name: 'sample'}},
                    {created_at: {$lte: '2016-03-03'}}
                ]},
                {$or: [
                    {$not: {name: 'sample'}},
                    [
                        {created_at: '2016-03-03'},
                        {$or: {created_at: '2016-03-04'}}
                    ]
                ]}
            ];
            five.filters.should.eql(fiveTest);
        });

        it('in expressions', function () {
            gql.parse('!author:joe+tag:[photo,video]').filters.should.eql(
                [{$not: {author: 'joe'}}, {tag:['photo','video']}]
            );

            gql.parse('!author:joe+!tag:[photo,video,audio]').filters.should.eql(
                [{$not: {author: 'joe'}}, {$not: {tag: ['photo','video','audio']}}]
            );

            gql.parse('!author:joe+tag:[photo,video,magic,\'audio\']+posts.id:>5+posts.id:<100').filters.should.eql(
                [
                    {$not: {author: 'joe'}},
                    {tag: ['photo','video','magic','audio']},
                    {'posts.id': {$gt: 5}},
                    {'posts.id': {$lt: 100}}
                ]
            );
        });
    });

    describe('whitespace rules', function () {
        it('will ignore whitespace in expressions', function () {
            gql.parse('!posts.id: 5')
                .filters.should.eql(gql.parse('!posts.id:5').filters);
            gql.parse('!author: joe + tag: [photo, video]')
                .filters.should.eql(gql.parse('!author:joe+tag:[photo,video]').filters);
        });

        it('will ignore whitespace in Strings', function () {
            gql.parse('author:\'Hello World\'').filters.should.eql(gql.parse('author:\'Hello World\'').filters);
        });
    });

    describe('invalid expressions', function () {
        it('CANNOT parse property - operator - value in wrong order', function () {
            (function () {
                gql.parse('\'My Tag\':tag');
            }).should.throw(parserError);
            (function () {
                gql.parse('5>:tag');
            }).should.throw(parserError);
        });

        it('CANNOT parse combination without filter expression', function () {
            (function () {
                gql.parse('count:3+');
            }).should.throw(parserError);
            (function () {
                gql.parse(',count:3');
            }).should.throw(parserError);
        });

        it('CANNOT parse incomplete group', function () {
            (function () {
                gql.parse('id:5,(count:3');
            }).should.throw(parserError);
            (function () {
                gql.parse('count:3)');
            }).should.throw(parserError);
            (function () {
                gql.parse('id:5(count:3)');
            }).should.throw(parserError);
        });

        it('CANNOT parse invalid IN expression', function () {
            (function () {
                gql.parse('id:[test+ing]');
            }).should.throw(parserError);
            (function () {
                gql.parse('id:[test');
            }).should.throw(parserError);
            (function () {
                gql.parse('id:test,ing]');
            }).should.throw(parserError);
        });
    });
});

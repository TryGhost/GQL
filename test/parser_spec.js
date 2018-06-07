var should = require('should'), // eslint-disable-line no-unused-vars
    gql = require('../lib/gql');

describe.only('Parser', function () {
    var parserError = /^Query Error: unexpected character in filter at char/;

    describe('Simple Expressions', function () {
        it('should parse simple id & value combos', function () {
            gql.parse('id:3').should.eql({id: 3});

            gql.parse('slug:getting-started').should.eql({slug: 'getting-started'});
        });
    });

    describe('Comparison Query Operators', function () {
        it('can parse standard equals', function () {
            gql.parse('count:5').should.eql({count: 5});

            gql.parse('tag:getting-started').should.eql({tag: 'getting-started'});

            gql.parse('author:\'Joe Bloggs\'').should.eql({author: 'Joe Bloggs'});

            gql.parse('author:123-test').should.eql({author: '123-test'});
        });

        it('can parse not equals', function () {
            gql.parse('count:-5').should.eql({count: {$ne: 5}});

            gql.parse('tag:-getting-started').should.eql({tag: {$ne: 'getting-started'}});

            gql.parse('author:-\'Joe Bloggs\'').should.eql({author: {$ne: 'Joe Bloggs'}});
        });

        it('can parse greater than', function () {
            gql.parse('count:>5').should.eql({count: {$gt: 5}});

            gql.parse('tag:>getting-started').should.eql({tag: {$gt: 'getting-started'}});

            gql.parse('author:>\'Joe Bloggs\'').should.eql({author: {$gt: 'Joe Bloggs'}});
        });

        it('can parse less than', function () {
            gql.parse('count:<5').should.eql({count: {$lt: 5}});

            gql.parse('tag:<getting-started').should.eql({tag: {$lt: 'getting-started'}});

            gql.parse('author:<\'Joe Bloggs\'').should.eql({author: {$lt: 'Joe Bloggs'}});
        });

        it('can parse greater than or equals', function () {
            gql.parse('count:>=5').should.eql({count: {$gte: 5}});

            gql.parse('tag:>=getting-started').should.eql({tag: {$gte: 'getting-started'}});

            gql.parse('author:>=\'Joe Bloggs\'').should.eql({author: {$gte: 'Joe Bloggs'}});
        });

        it('can parse less than or equals', function () {
            gql.parse('count:<=5').should.eql({count: {$lte: 5}});

            gql.parse('tag:<=getting-started').should.eql({tag: {$lte: 'getting-started'}});

            gql.parse('author:<=\'Joe Bloggs\'').should.eql({author: {$lte: 'Joe Bloggs'}});
        });

        it('can parse IN with single value', function () {
            gql.parse('count:[5]').should.eql({count: {$in: [5]}});

            gql.parse('tag:[getting-started]').should.eql({tag: {$in: ['getting-started']}});

            gql.parse('author:[\'Joe Bloggs\']').should.eql({author: {$in: ['Joe Bloggs']}});
        });

        it('can parse NOT IN with single value', function () {
            gql.parse('count:-[5]').should.eql({count: {$nin: [5]}});

            gql.parse('tag:-[getting-started]').should.eql({tag: {$nin: ['getting-started']}});

            gql.parse('author:-[\'Joe Bloggs\']').should.eql({author: {$nin: ['Joe Bloggs']}});
        });

        it('can parse IN with multiple values', function () {
            gql.parse('count:[5, 8, 12]').should.eql({count: {$in: [5, 8, 12]}});

            gql.parse('tag:[getting-started, ghost, really-long-1]')
                .should.eql({tag: {$in: ['getting-started', 'ghost', 'really-long-1']}});

            gql.parse('author:[\'Joe Bloggs\', \'John O\\\'Nolan\', \'Hello World\']')
                .should.eql({author: {$in: ['Joe Bloggs', 'John O\'Nolan', 'Hello World']}});
        });

        it('can parse NOT IN with single value', function () {
            gql.parse('count:-[5, 8, 12]').should.eql({count: {$nin: [5, 8, 12]}});

            gql.parse('tag:-[getting-started, ghost, really-long-1]')
                .should.eql({tag: {$nin: ['getting-started', 'ghost', 'really-long-1']}});

            gql.parse('author:-[\'Joe Bloggs\', \'John O\\\'Nolan\', \'Hello World\']')
                .should.eql({author: {$nin: ['Joe Bloggs', 'John O\'Nolan', 'Hello World']}});
        });
    });

    describe('Values', function () {
        it('can parse null', function () {
            gql.parse('image:null').should.eql({image: null});
        });

        it('can parse NOT null', function () {
            gql.parse('image:-null').should.eql({image: {$ne: null}});
        });

        it('can parse true', function () {
            gql.parse('featured:true').should.eql({featured: true});
        });

        it('can parse NOT true', function () {
            gql.parse('featured:-true').should.eql({featured: {$ne: true}});
        });

        it('can parse false', function () {
            gql.parse('featured:false').should.eql({featured: false});
        });

        it('can parse NOT false', function () {
            gql.parse('featured:-false').should.eql({featured: {$ne: false}});
        });

        it('can parse a Number', function () {
            gql.parse('count:5').should.eql({count: 5});
        });

        it('can parse NOT a Number', function () {
            gql.parse('count:-5').should.eql({count: {$ne: 5}});
        });
    });

    describe('Logical Query Operators', function () {
        // @TODO support implicit and?
        it('$and', function () {
            gql.parse('page:false+status:published')
                .should.eql({$and: [{page: false}, {status: 'published'}]});
        });

        // @TODO or with same property is in?
        it('$or', function () {
            gql.parse('page:true,featured:true')
                .should.eql({$or: [{page: true}, {featured: true}]});

            gql.parse('page:true,page:false')
                .should.eql({$or: [{page: true}, {page: false}]});
        });
    });

    describe('complex examples', function () {
        it('Many expressions', function () {
            gql.parse('tag:photo+featured:true,tag.count:>5').should.eql({
                $or: [
                    {$and: [{tag: 'photo'}, {featured: true}]},
                    {'tag.count': {$gt: 5}}
                ]
            });

            gql.parse('tag:photo+image:-null,tag.count:>5').should.eql({
                $or: [
                    {$and: [{tag: 'photo'}, {image: {$ne: null}}]},
                    {'tag.count': {$gt: 5}}
                ]
            });
        });

        it('RIGHT grouped expressions', function () {
            gql.parse('author:-joe+tag:photo,image:-null,featured:true').should.eql(
                {
                    $or: [
                        {
                            $and: [
                                {author: {$ne: 'joe'}},
                                {tag: 'photo'}
                            ]
                        },
                        {image: {$ne: null}},
                        {featured: true}
                    ]
                }
            );

            gql.parse('author:-joe+(tag:photo,image:-null,featured:true)').should.eql(
                {
                    $and: [
                        {author: {$ne: 'joe'}},
                        {
                            $or: [
                                {tag: 'photo'},
                                {image: {$ne: null}},
                                {featured: true}
                            ]
                        }
                    ]
                }
            );

            gql.parse('(tag:photo,image:-null,featured:true)+author:-joe').should.eql(
                {
                    $and: [
                        {
                            $or: [
                                {tag: 'photo'},
                                {image: {$ne: null}},
                                {featured: true}
                            ]
                        },
                        {author: {$ne: 'joe'}}
                    ]
                }
            );

            gql.parse('author:-joe,(tag:photo,image:-null,featured:true)').should.eql(
                {
                    $or: [
                        {author: {$ne: 'joe'}},
                        {
                            $or: [
                                {tag: 'photo'},
                                {image: {$ne: null}},
                                {featured: true}
                            ]
                        }
                    ]
                }
            );

            gql.parse(
                'name:sample,(name:-sample+created_at:<=\'2016-03-03\'),(name:-sample+(created_at:\'2016-03-03\',created_at:\'2016-03-04\'))'
            ).should.eql(
                {$or: [
                    {name: 'sample'},
                    {$and: [
                        {name: {$ne: 'sample'}},
                        {created_at: {$lte: '2016-03-03'}}
                    ]},
                    {$and: [
                        {name: {$ne: 'sample'}},
                        {$or: [
                            {created_at: '2016-03-03'},
                            {created_at: '2016-03-04'}
                        ]}
                    ]}
                ]}
            );
        });

        it.skip('LEFT grouped expressions', function () {
            gql.parse('(tag:photo,image:-null,featured:false),author:-joe').should.eql(
                {$or: [
                    {$or: [
                        {tag: 'photo'},
                        {image: {$ne: null}},
                        {featured: true}
                    ]},
                    {author: {$ne: 'joe'}}
                ]}
            );

            gql.parse(
                '(name:-sample,(created_at:\'2016-03-03\',created_at:\'2016-03-04\')),(name:-sample+created_at:<=\'2016-03-03\'),name:sample'
            ).should.eql(
                {$or: [
                    {$and: [
                        {name: {$ne: 'sample'}},
                        {$or: [
                            {created_at: '2016-03-03'},
                            {created_at: '2016-03-04'}
                        ]}
                    ]},
                    {$and: [
                        {name: {$ne: 'sample'}},
                        {created_at: {$lte: '2016-03-03'}}
                    ]},
                    {name: 'sample'}
                ]}
            );
        });

        it('in expressions', function () {
            gql.parse('author:-joe+tag:[photo,video]').should.eql(
                {$and: [
                    {author: {$ne: 'joe'}},
                    {tag: {$in: ['photo', 'video']}}
                ]}
            );

            gql.parse('author:-joe+tag:-[photo,video,audio]').should.eql(
                {$and: [
                    {author: {$ne: 'joe'}},
                    {tag: {$nin: ['photo', 'video', 'audio']}}
                ]}
            );

            gql.parse('author:-joe+tag:[photo,video,magic,\'audio\']+post.count:>5+post.count:<100').should.eql(
                {$and: [
                    {author: {$ne: 'joe'}},
                    {tag: {$in: ['photo', 'video', 'magic', 'audio']}},
                    {'post.count': {$gt: 5}},
                    {'post.count': {$lt: 100}}
                ]}
            );
        });
    });

    describe('whitespace rules', function () {
        it('will ignore whitespace in expressions', function () {
            gql.parse('count: -5').should.eql(gql.parse('count:-5'));
            gql.parse('author: -joe + tag: [photo, video]').should.eql(gql.parse('author:-joe+tag:[photo,video]'));
        });

        it('will not ignore whitespace in Strings', function () {
            gql.parse('author:\'Hello World\'').should.not.eql(gql.parse('author:\'HelloWorld\''));
        });
    });

    describe('invalid expressions', function () {
        it('CANNOT parse characters outside of a STRING value', function () {
            (function () {
                gql.parse('tag:\'My Tag\'-');
            }).should.throw(parserError);
        });

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

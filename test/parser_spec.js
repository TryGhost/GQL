/* globals describe, it */
/* jshint unused:false */
var should = require('should'),
    gql = require('../src/gql');

describe.skip('Parser', function () {
    var parserError = /^Query Error: unexpected character in filter at char/;

    describe('Operators', function () {
        it('can parse standard equals', function () {
            gql.parse('count:5').should.eql(
                { count: 5 }
            );

            gql.parse('tag:getting-started').should.eql(
                { tag: 'getting-started' }
            );

            gql.parse('author:\'Joe Bloggs\'').should.eql(
                { author: 'Joe Bloggs' }
            );
        });

        it('can parse not equals', function () {
            gql.parse('count:-5').should.eql(
                { count: { '$ne': 5 } }
            );

            gql.parse('tag:-getting-started').should.eql(
                { tag: { $ne: 'getting-started' } }
            );

            gql.parse('author:-\'Joe Bloggs\'').should.eql(
                { author: { $ne: 'Joe Bloggs' } }
            );
        });

        it('can parse greater than', function () {
            gql.parse('count:>5').should.eql();

            gql.parse('tag:>getting-started').should.eql();

            gql.parse('author:>\'Joe Bloggs\'').should.eql();
        });

        it('can parse less than', function () {
            gql.parse('count:<5').should.eql();

            gql.parse('tag:<getting-started').should.eql();

            gql.parse('author:<\'Joe Bloggs\'').should.eql();
        });

        it('can parse greater than or equals', function () {
            gql.parse('count:>=5').should.eql();

            gql.parse('tag:>=getting-started').should.eql();

            gql.parse('author:>=\'Joe Bloggs\'').should.eql();
        });

        it('can parse less than or equals', function () {
            gql.parse('count:<=5').should.eql();

            gql.parse('tag:<=getting-started').should.eql();

            gql.parse('author:<=\'Joe Bloggs\'').should.eql();
        });

        it('can parse IN with single value', function () {
            gql.parse('count:[5]').should.eql();

            gql.parse('tag:[getting-started]').should.eql();

            gql.parse('author:[\'Joe Bloggs\']').should.eql();
        });

        it('can parse NOT IN with single value', function () {
            gql.parse('count:-[5]').should.eql();

            gql.parse('tag:-[getting-started]').should.eql();

            gql.parse('author:-[\'Joe Bloggs\']').should.eql();
        });

        it('can parse IN with multiple values', function () {
            gql.parse('count:[5, 8, 12]').should.eql();

            gql.parse('tag:[getting-started, ghost, really-long-1]').should.eql();

            gql.parse('author:[\'Joe Bloggs\', \'John O\\\'Nolan\', \'Hello World\']').should.eql();
        });

        it('can parse NOT IN with single value', function () {
            gql.parse('count:-[5, 8, 12]').should.eql();

            gql.parse('tag:-[getting-started, ghost, really-long-1]').should.eql();

            gql.parse('author:-[\'Joe Bloggs\', \'John O\\\'Nolan\', \'Hello World\']').should.eql();
        });
    });

    describe('Values', function () {
        it('can parse null', function () {
            gql.parse('image:').should.eql();
        });

        it('can parse NOT null', function () {
            gql.parse('image').should.eql();
        });

        it('can parse true', function () {
            gql.parse('featured:true').should.eql();
        });

        it('can parse NOT true', function () {
            gql.parse('featured:-true').should.eql();
        });

        it('can parse false', function () {
            gql.parse('featured:false').should.eql();
        });

        it('can parse NOT false', function () {
            gql.parse('featured:-false').should.eql();
        });

        it('can parse a Number', function () {
            gql.parse('count:5').should.eql();
        });

        it('can parse NOT a Number', function () {
            gql.parse('count:-5').should.eql();
        });
    });

    describe('simple expressions', function () {
        it('should parse simple id & value combos', function () {
            gql.parse('id:3').should.eql();

            gql.parse('slug:getting-started').should.eql();
        });
    });

    describe('complex examples', function () {
        it('many expressions', function () {
            gql.parse('tag:photo+featured:true,tag.count:>5').should.eql();

            gql.parse('tag:photo+image:-null,tag.count:>5').should.eql();
        });

        it('grouped expressions', function () {
            gql.parse('author:-joe+(tag:photo,image:-null,featured:true)').should.eql();

            gql.parse('(tag:photo,image:-null,featured:true)+author:-joe').should.eql();

            gql.parse('author:-joe,(tag:photo,image:-null,featured:true)').should.eql();

            gql.parse('(tag:photo,image:-null,featured:false),author:-joe').should.eql();
        });

        it('in expressions', function () {
            gql.parse('author:-joe+tag:[photo,video]').should.eql();

            gql.parse('author:-joe+tag:-[photo,video,audio]').should.eql();

            gql.parse('author:-joe+tag:[photo,video,magic,\'audio\']+post.count:>5+post.count:<100').should.eql();
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
            (function () { gql.parse('tag:\'My Tag\'-');}).should.throw(parserError);
        });

        it('CANNOT parse property - operator - value in wrong order', function () {
            (function () { gql.parse('\'My Tag\':tag');}).should.throw(parserError);
            (function () { gql.parse('5>:tag');}).should.throw(parserError);
        });

        it('CANNOT parse combination without filter expression', function () {
            (function () { gql.parse('count:3+');}).should.throw(parserError);
            (function () { gql.parse(',count:3');}).should.throw(parserError);
        });

        it('CANNOT parse incomplete group', function () {
            (function () { gql.parse('id:5,(count:3');}).should.throw(parserError);
            (function () { gql.parse('count:3)');}).should.throw(parserError);
            (function () { gql.parse('id:5(count:3)');}).should.throw(parserError);
        });

        it('CANNOT parse invalid IN expression', function () {
            (function () { gql.parse('id:[test+ing]');}).should.throw(parserError);
            (function () { gql.parse('id:[test');}).should.throw(parserError);
            (function () { gql.parse('id:test,ing]');}).should.throw(parserError);
        });
    });
});

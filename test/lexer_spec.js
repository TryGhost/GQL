var gql = require('../lib/gql');

describe('Lexer', function () {
    var lexicalError = /^Query Error: unrecognized text/;

    describe('Symbols', function () {
        it('can recognise -', function () {
            gql.lex('-').should.eql([{token: 'NOT', matched: '-'}]);
        });
        it('can recognise +', function () {
            gql.lex('+').should.eql([{token: 'AND', matched: '+'}]);
        });
        it('can recognise ,', function () {
            gql.lex(',').should.eql([{token: 'OR', matched: ','}]);
        });
        it('can recognise [', function () {
            gql.lex('[').should.eql([{token: 'LBRACKET', matched: '['}]);
        });
        it('can recognise ]', function () {
            gql.lex(']').should.eql([{token: 'RBRACKET', matched: ']'}]);
        });
        it('can recognise (', function () {
            gql.lex('(').should.eql([{token: 'LPAREN', matched: '('}]);
        });
        it('can recognise )', function () {
            gql.lex(')').should.eql([{token: 'RPAREN', matched: ')'}]);
        });
        it('can recognise >', function () {
            gql.lex('>').should.eql([{token: 'GT', matched: '>'}]);
        });
        it('can recognise <', function () {
            gql.lex('<').should.eql([{token: 'LT', matched: '<'}]);
        });
        it('can recognise >=', function () {
            gql.lex('>=').should.eql([{token: 'GTE', matched: '>='}]);
        });
        it('can recognise <=', function () {
            gql.lex('<=').should.eql([{token: 'LTE', matched: '<='}]);
        });
        it('cannot recognise :', function () {
            (function () {gql.lex(':');}).should.throw(lexicalError);
        });
        it('cannot recognise =', function () {
            (function () {gql.lex('=');}).should.throw(lexicalError);
        });
        it('cannot recognise "', function () {
            (function () {gql.lex('"');}).should.throw(lexicalError);
        });
        it('cannot recognise \'', function () {
            (function () {gql.lex('\'');}).should.throw(lexicalError);
        });
    });

    describe('VALUES', function () {
        it('can recognise null', function () {
            gql.lex('null').should.eql([{token: 'NULL', matched: 'null'}]);
        });

        it('can recognise true', function () {
            gql.lex('true').should.eql([{token: 'TRUE', matched: 'true'}]);
        });

        it('can recognise false', function () {
            gql.lex('false').should.eql([{token: 'FALSE', matched: 'false'}]);
        });

        it('can recognise a LITERAL', function () {
            gql.lex('six').should.eql([{token: 'LITERAL', matched: 'six'}]);
        });

        it('can recognise a STRING', function () {
            gql.lex('\'six\'').should.eql([{token: 'STRING', matched: '\'six\''}]);
        });

        it('can recognise a NUMBER', function () {
            gql.lex('6').should.eql([{token: 'NUMBER', matched: '6'}]);
        });

        it('does not confuse values in LITERALs', function () {
            gql.lex('strueth').should.eql([{token: 'LITERAL', matched: 'strueth'}]);
            gql.lex('trueth').should.eql([{token: 'LITERAL', matched: 'trueth'}]);
            gql.lex('true_thing').should.eql([{token: 'LITERAL', matched: 'true_thing'}]);
            // gql.lex("true-thing").should.eql([{token: "LITERAL", matched: "true-thing"}]);
        });

        it('does not confuse values in STRINGs', function () {
            gql.lex('\'strueth\'').should.eql([{token: 'STRING', matched: '\'strueth\''}]);
            gql.lex('\'trueth\'').should.eql([{token: 'STRING', matched: '\'trueth\''}]);
            gql.lex('\'true_thing\'').should.eql([{token: 'STRING', matched: '\'true_thing\''}]);
            gql.lex('\'true-thing\'').should.eql([{token: 'STRING', matched: '\'true-thing\''}]);
        });
    });

    describe('LITERAL values', function () {
        it('should match literals', function () {
            gql.lex('myvalue').should.eql([
                {token: 'LITERAL', matched: 'myvalue'}
            ]);
            gql.lex('my value').should.eql([
                {token: 'LITERAL', matched: 'my'},
                {token: 'LITERAL', matched: 'value'}
            ]);
            gql.lex('my-value').should.eql([
                {token: 'LITERAL', matched: 'my-value'}
            ]);
            gql.lex('my&value!').should.eql([
                {token: 'LITERAL', matched: 'my&value!'}
            ]);
            gql.lex('my&valu\\\'e!').should.eql([
                {token: 'LITERAL', matched: 'my&valu\\\'e!'}
            ]);
            (function () {gql.lex('my&valu\'e!');}).should.throw(lexicalError);
        });

        it('should separate NOT at beginning of literal', function () {
            gql.lex('-photo').should.eql([
                {token: 'NOT', matched: '-'},
                {token: 'LITERAL', matched: 'photo'}
            ]);

            gql.lex('-photo-graph').should.eql([
                {token: 'NOT', matched: '-'},
                {token: 'LITERAL', matched: 'photo-graph'}
            ]);
        });

        it('should NOT permit special chars inside a literal', function () {
            (function () { gql.lex('t+st');}).should.throw(lexicalError);
            (function () { gql.lex('t,st');}).should.throw(lexicalError);
            (function () { gql.lex('t(st');}).should.throw(lexicalError);
            (function () { gql.lex('t)st');}).should.throw(lexicalError);
            (function () { gql.lex('t>st');}).should.throw(lexicalError);
            (function () { gql.lex('t<st');}).should.throw(lexicalError);
            (function () { gql.lex('t=st');}).should.throw(lexicalError);
            (function () { gql.lex('t[st');}).should.throw(lexicalError);
            (function () { gql.lex('t]st');}).should.throw(lexicalError);
            (function () { gql.lex('t\'st');}).should.throw(lexicalError);
            (function () { gql.lex('t"st');}).should.throw(lexicalError);
        });

        it('should not match special chars at the start of a literal', function () {
            gql.lex('+test').should.eql([
                {token: 'AND', matched: '+'},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex(',test').should.eql([
                {token: 'OR', matched: ','},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex('(test').should.eql([
                {token: 'LPAREN', matched: '('},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex(')test').should.eql([
                {token: 'RPAREN', matched: ')'},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex('>test').should.eql([
                {token: 'GT', matched: '>'},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex('<test').should.eql([
                {token: 'LT', matched: '<'},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex('[test').should.eql([
                {token: 'LBRACKET', matched: '['},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex(']test').should.eql([
                {token: 'RBRACKET', matched: ']'},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex('>=test').should.eql([
                {token: 'GTE', matched: '>='},
                {token: 'LITERAL', matched: 'test'}
            ]);
            gql.lex('<=test').should.eql([
                {token: 'LTE', matched: '<='},
                {token: 'LITERAL', matched: 'test'}
            ]);

            (function () { gql.lex('=test');}).should.throw(lexicalError);
            (function () { gql.lex('"test');}).should.throw(lexicalError);
            (function () { gql.lex('\'test');}).should.throw(lexicalError);
        });

        it('should not match special chars at the end of a literal', function () {
            gql.lex('test+').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'AND', matched: '+'}
            ]);
            gql.lex('test,').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'OR', matched: ','}
            ]);
            gql.lex('test(').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'LPAREN', matched: '('}
            ]);
            gql.lex('test)').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'RPAREN', matched: ')'}
            ]);
            gql.lex('test>').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'GT', matched: '>'}
            ]);
            gql.lex('test<').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'LT', matched: '<'}
            ]);
            gql.lex('test[').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'LBRACKET', matched: '['}
            ]);
            gql.lex('test]').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'RBRACKET', matched: ']'}
            ]);
            gql.lex('test>=').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'GTE', matched: '>='}
            ]);
            gql.lex('test<=').should.eql([
                {token: 'LITERAL', matched: 'test'},
                {token: 'LTE', matched: '<='}
            ]);
            (function () { gql.lex('test=');}).should.throw(lexicalError);
            (function () { gql.lex('test"');}).should.throw(lexicalError);
            (function () { gql.lex('test\'');}).should.throw(lexicalError);
        });

        it('should permit escaped special chars inside a literal', function () {
            gql.lex('t\\+st').should.eql([{token: 'LITERAL', matched: 't\\+st'}]);
            gql.lex('t\\,st').should.eql([{token: 'LITERAL', matched: 't\\,st'}]);
            gql.lex('t\\(st').should.eql([{token: 'LITERAL', matched: 't\\(st'}]);
            gql.lex('t\\)st').should.eql([{token: 'LITERAL', matched: 't\\)st'}]);
            gql.lex('t\\>st').should.eql([{token: 'LITERAL', matched: 't\\>st'}]);
            gql.lex('t\\<st').should.eql([{token: 'LITERAL', matched: 't\\<st'}]);
            gql.lex('t\\=st').should.eql([{token: 'LITERAL', matched: 't\\=st'}]);
            gql.lex('t\\[st').should.eql([{token: 'LITERAL', matched: 't\\[st'}]);
            gql.lex('t\\]st').should.eql([{token: 'LITERAL', matched: 't\\]st'}]);
            gql.lex('t\\\'st').should.eql([{token: 'LITERAL', matched: 't\\\'st'}]);
            gql.lex('t\\"st').should.eql([{token: 'LITERAL', matched: 't\\"st'}]);
        });
    });

    describe('LITERAL vs PROP', function () {
        it('should match colon in string as PROP before, literal after', function () {
            gql.lex(':test').should.eql([
                {token: 'LITERAL', matched: ':test'}
            ]);

            gql.lex('te:st').should.eql([
                {token: 'PROP', matched: 'te:'},
                {token: 'LITERAL', matched: 'st'}
            ]);

            gql.lex('test:').should.eql([
                {token: 'PROP', matched: 'test:'}
            ]);
        });

        it('should only match colon-at-end as PROP if PROP is valPROP', function () {
            gql.lex('te!:st').should.eql([
                {token: 'LITERAL', matched: 'te!:st'}
            ]);

            gql.lex('post-count:6').should.eql([
                {token: 'LITERAL', matched: 'post-count:6'}
            ]);

            gql.lex('post_count:6').should.eql([
                {token: 'PROP', matched: 'post_count:'},
                {token: 'NUMBER', matched: '6'}
            ]);
        });
    });

    describe('STRING values', function () {
        it('can recognise simple STRING', function () {
            gql.lex('\'magic\'').should.eql([{token: 'STRING', matched: '\'magic\''}]);
            gql.lex('\'magic mystery\'').should.eql([{token: 'STRING', matched: '\'magic mystery\''}]);
            gql.lex('\'magic 123\'').should.eql([{token: 'STRING', matched: '\'magic 123\''}]);
        });

        it('can recognise multiple STRING values', function () {
            gql.lex('\'magic\'\'mystery\'').should.eql([
                {token: 'STRING', matched: '\'magic\''},
                {token: 'STRING', matched: '\'mystery\''}
            ]);
            gql.lex('\'magic\' \'mystery\'').should.eql([
                {token: 'STRING', matched: '\'magic\''},
                {token: 'STRING', matched: '\'mystery\''}
            ]);
            gql.lex('\'magic\',\'mystery\'').should.eql([
                {token: 'STRING', matched: '\'magic\''},
                {token: 'OR', matched: ','},
                {token: 'STRING', matched: '\'mystery\''}
            ]);
            gql.lex('[\'magic\',\'mystery\']').should.eql([
                {token: 'LBRACKET', matched: '['},
                {token: 'STRING', matched: '\'magic\''},
                {token: 'OR', matched: ','},
                {token: 'STRING', matched: '\'mystery\''},
                {token: 'RBRACKET', matched: ']'}
            ]);
        });

        it('can recognise STRING with special characters', function () {
            gql.lex('\'magic+\'').should.eql([{token: 'STRING', matched: '\'magic+\''}]);
            gql.lex('\'magic,\'').should.eql([{token: 'STRING', matched: '\'magic,\''}]);
            gql.lex('\'magic-\'').should.eql([{token: 'STRING', matched: '\'magic-\''}]);
            gql.lex('\'magic>\'').should.eql([{token: 'STRING', matched: '\'magic>\''}]);
            gql.lex('\'magic<\'').should.eql([{token: 'STRING', matched: '\'magic<\''}]);
        });

        it('should permit special chars inside a STRING, not including quotes', function () {
            gql.lex('\'t+st\'').should.eql([{token: 'STRING', matched: '\'t+st\''}]);
            gql.lex('\'t,st\'').should.eql([{token: 'STRING', matched: '\'t,st\''}]);
            gql.lex('\'t(st\'').should.eql([{token: 'STRING', matched: '\'t(st\''}]);
            gql.lex('\'t)st\'').should.eql([{token: 'STRING', matched: '\'t)st\''}]);
            gql.lex('\'t>st\'').should.eql([{token: 'STRING', matched: '\'t>st\''}]);
            gql.lex('\'t<st\'').should.eql([{token: 'STRING', matched: '\'t<st\''}]);
            gql.lex('\'t=st\'').should.eql([{token: 'STRING', matched: '\'t=st\''}]);
            gql.lex('\'t[st\'').should.eql([{token: 'STRING', matched: '\'t[st\''}]);
            gql.lex('\'t]st\'').should.eql([{token: 'STRING', matched: '\'t]st\''}]);
        });

        it('should NOT permit quotes inside a STRING', function () {
            (function () { gql.lex('\'t\'st\'');}).should.throw(lexicalError);
            (function () { gql.lex('\'t"st\'');}).should.throw(lexicalError);
        });

        it('should permit escaped quotes inside a String', function () {
            gql.lex('\'t\\\'st\'').should.eql([{token: 'STRING', matched: '\'t\\\'st\''}]);
            gql.lex('\'t\\"st\'').should.eql([{token: 'STRING', matched: '\'t\\"st\''}]);
        });
    });

    describe('single & double QUOTE marks', function () {
        it('CANNOT match an UNescaped double quote in a LITERAL', function () {
            (function () {gql.lex('thing"amabob');}).should.throw(lexicalError);
        });
        it('CANNOT match an UNescaped single quote in a LITERAL', function () {
            (function () {gql.lex('thing\'amabob');}).should.throw(lexicalError);
        });
        it('CANNOT match an UNescaped double quote in a STRING', function () {
            (function () {gql.lex('\'thing"amabob\'');}).should.throw(lexicalError);
        });
        it('CANNOT match an UNescaped single quote in a STRING', function () {
            (function () {gql.lex('\'thing\'amabob\'');}).should.throw(lexicalError);
        });
        it('CAN match an escaped double quote in a LITERAL', function () {
            gql.lex('thing\\"amabob').should.eql([{token: 'LITERAL', matched: 'thing\\"amabob'}]);
        });
        it('CAN match an escaped single quote in a LITERAL', function () {
            gql.lex('thing\\\'amabob').should.eql([{token: 'LITERAL', matched: 'thing\\\'amabob'}]);
        });
        it('CAN match an escaped double quote in a STRING', function () {
            gql.lex('\'thing\\"amabob\'').should.eql([{token: 'STRING', matched: '\'thing\\"amabob\''}]);
        });
        it('CAN match an escaped single quote in a STRING', function () {
            gql.lex('\'thing\\\'amabob\'').should.eql([{token: 'STRING', matched: '\'thing\\\'amabob\''}]);
        });
    });

    describe('Filter expressions', function () {
        it('should separate NOT at beginning of literal', function () {
            gql.lex('tag:-photo').should.eql([
                {token: 'PROP', matched: 'tag:'},
                {token: 'NOT', matched: '-'},
                {token: 'LITERAL', matched: 'photo'}
            ]);

            gql.lex('tag:-photo-graph').should.eql([
                {token: 'PROP', matched: 'tag:'},
                {token: 'NOT', matched: '-'},
                {token: 'LITERAL', matched: 'photo-graph'}
            ]);

            gql.lex('tags:[-getting-started]').should.eql([
                {token: 'PROP', matched: 'tags:'},
                {token: 'LBRACKET', matched: '['},
                {token: 'NOT', matched: '-'},
                {token: 'LITERAL', matched: 'getting-started'},
                {token: 'RBRACKET', matched: ']'}
            ]);
        });

        it('should permit NOT inside a literal', function () {
            gql.lex('tags:getting-started').should.eql([
                {token: 'PROP', matched: 'tags:'},
                {token: 'LITERAL', matched: 'getting-started'}
            ]);

            gql.lex('tags:[getting-started]').should.eql([
                {token: 'PROP', matched: 'tags:'},
                {token: 'LBRACKET', matched: '['},
                {token: 'LITERAL', matched: 'getting-started'},
                {token: 'RBRACKET', matched: ']'}
            ]);

            gql.lex('tags:-[getting-started]').should.eql([
                {token: 'PROP', matched: 'tags:'},
                {token: 'NOT', matched: '-'},
                {token: 'LBRACKET', matched: '['},
                {token: 'LITERAL', matched: 'getting-started'},
                {token: 'RBRACKET', matched: ']'}
            ]);

            gql.lex('id:-1+tags:[getting-started]').should.eql([
                {token: 'PROP', matched: 'id:'},
                {token: 'NOT', matched: '-'},
                {token: 'NUMBER', matched: '1'},
                {token: 'AND', matched: '+'},
                {token: 'PROP', matched: 'tags:'},
                {token: 'LBRACKET', matched: '['},
                {token: 'LITERAL', matched: 'getting-started'},
                {token: 'RBRACKET', matched: ']'}
            ]);
        });
    });

    describe('complex examples', function () {
        it('many expressions', function () {
            gql.lex('tag:photo+featured:true,tag.count:>5').should.eql([
                {token: 'PROP', matched: 'tag:'},
                {token: 'LITERAL', matched: 'photo'},
                {token: 'AND', matched: '+'},
                {token: 'PROP', matched: 'featured:'},
                {token: 'TRUE', matched: 'true'},
                {token: 'OR', matched: ','},
                {token: 'PROP', matched: 'tag.count:'},
                {token: 'GT', matched: '>'},
                {token: 'NUMBER', matched: '5'}
            ]);

            // gql.lex("tag:photo+image:-null,tag.count:>5").should.eql();
        });

        it('grouped expressions', function () {
            // gql.lex("author:-joe+(tag:photo,image:-null,featured:true)").should.eql();
        });

        it('in expressions', function () {
            gql.lex('author:-joe+tag:[photo,video]').should.eql([
                {token: 'PROP', matched: 'author:'},
                {token: 'NOT', matched: '-'},
                {token: 'LITERAL', matched: 'joe'},
                {token: 'AND', matched: '+'},
                {token: 'PROP', matched: 'tag:'},
                {token: 'LBRACKET', matched: '['},
                {token: 'LITERAL', matched: 'photo'},
                {token: 'OR', matched: ','},
                {token: 'LITERAL', matched: 'video'},
                {token: 'RBRACKET', matched: ']'}
            ]);

            // gql.lex("author:-joe+tag:-[photo,video]").should.eql();

            // gql.lex("author:-joe+tag:[photo,video]+post.count:>5+post.count:<100").should.eql();
        });
    });
});

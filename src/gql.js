var Knector = require('./knector'),
    parser = require('../dist/parser').parser,
    gql;

gql = function (knex) {
    this.knex = knex;
};

gql.prototype.lex = function (input) {
    parser.lexer.setInput(input);
    var lexed = parser.lexer.lex(),
        tokens = [];

    while (lexed !== parser.lexer.EOF) {
        tokens.push({token: parser.terminals_[lexed], matched: parser.lexer.match});
        lexed = parser.lexer.lex();
    }

    return tokens;
};

// returns a filter object
gql.prototype.parse = function (input) {
    return parser.parse(input);
};

gql.prototype.findAll = function (collection) {
    return new Knector(collection, this.knex(collection));
};

module.exports = gql;

//var parser = require('../dist/parser').parser;
//parser.yy = require('./scope');
//
//exports.lex = function (input) {
//    parser.lexer.setInput(input);
//    var lexed = parser.lexer.lex(),
//        tokens = [];
//
//    while (lexed !== parser.lexer.EOF) {
//        tokens.push({token: parser.terminals_[lexed], matched: parser.lexer.match});
//        lexed = parser.lexer.lex();
//    }
//
//    return tokens;
//};
//
//// returns the JSON object
//exports.parse = function (input, resourceType, aliases) {
//    return parser.parse(input, resourceType, aliases);
//};

var knector = require('./knector');
var parser  = require('./parser');

var gql = function(knex) {
    this.knex = knex;
};

// returns a filter object
gql.prototype.parse = function(query) {
    return parser.parse(query);
};

gql.prototype.findAll = function(collection) {
    return new knector(this.knex(collection));
};

module.exports = gql;

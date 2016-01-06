var parser = require('../dist/parser').parser;
parser.yy = require('./scope');

exports.lex = function (input) {
    parser.lexer.setInput(input);
    var lexed = parser.lexer.lex(),
        tokens = [];

    while (lexed !== parser.lexer.EOF) {
        tokens.push({token: parser.terminals_[lexed], matched: parser.lexer.match});
        lexed = parser.lexer.lex();
    }

    return tokens;
};

// returns the JSON object
exports.parse = function (input, resourceType, aliases) {
    return parser.parse(input, resourceType, aliases);
};

exports.knexify = require('./knexify');
exports.json    = require('./lodash-stmt');

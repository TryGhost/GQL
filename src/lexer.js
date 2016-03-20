var parser = require('../dist/parser').parser;

lex = function (input) {
    parser.lexer.setInput(input);
    var lexed = parser.lexer.lex(),
        tokens = [];

    while (lexed !== parser.lexer.EOF) {
        tokens.push({token: parser.terminals_[lexed], matched: parser.lexer.match});
        lexed = parser.lexer.lex();
    }

    return tokens;
};

module.exports = {lex: lex};

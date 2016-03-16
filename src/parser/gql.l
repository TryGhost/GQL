/* lexical grammar */

%lex

%options case-insensitive

badcharsincnot               [^\+\,\(\)\>\<=\[\]!]
badcharsnonot                [^\+\,\(\)\>\<=\[\]]
escapable                    [\+\,\(\)\[\]]

%%

\s+                                                         /* skip whitespace */
'NULL'                                                      return 'NULL';
'TRUE'                                                      return 'TRUE';
'FALSE'                                                     return 'FALSE';
[!][a-zA-Z_][a-zA-Z0-9_\.\$]*[:]                            return 'NOTPROP';
[a-zA-Z_][a-zA-Z0-9_\.\$]*[:]                               return 'PROP';
[-]?[0-9]+("."[0-9]+)?\b                                    return 'NUMBER';
'['                                                         return 'LBRACKET';
']'                                                         return 'RBRACKET';
{badcharsincnot}(\\{escapable}|{badcharsnonot})+            return 'LITERAL';
'('                                                         return 'LPAREN';
')'                                                         return 'RPAREN';
','                                                         return 'OR';
'+'                                                         return 'AND';
'>='                                                        return 'GTE';
'<='                                                        return 'LTE';
'!'                                                         return 'NOT';
'>'                                                         return 'GT';
'<'                                                         return 'LT';
'~'                                                         return 'LIKE';

%%

lexer.parseError = function(errStr, object) {
    var lines = errStr.split("\n"),
        caretPos,
        char;

    caretPos = lines[2].indexOf("^");
    char = lines[1].charAt(caretPos);
    lines[0] = "Query Error: unrecognized text \"" + char + "\" in filter at char " + (caretPos + 1);

    throw Error(lines.join("\n"));
}

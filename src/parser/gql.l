/* lexical grammar */

%lex

%options case-insensitive

comparison               [\>\<=~]
logical                  [\,\+\)]
notlogical               [^\,\+\)]

%%

\s+                                                         /* skip whitespace */
'NULL'                                                      return 'NULL';
[!][a-zA-Z_\$][a-zA-Z0-9_\.\$]*[:]                          return 'NOTPROP';
[a-zA-Z_\$][a-zA-Z0-9_\.\$]*[:]                             return 'PROP';
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
['](\\[']|[^'])+?[']                                        return 'STRING';
[\[](\\\]|[^\]])*[\]]                                       return 'IN';
{comparison}?(\\{logical}|{notlogical})+                    return 'LITERAL';

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

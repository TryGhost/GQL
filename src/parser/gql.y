%parse-param options

%start expressions

%{

 parser.parseError = function(errStr, object) {
     var lines = errStr.split("\n");
     lines[0] = "Query Error: unexpected character in filter at char " + (object.loc.first_column + 1);
     throw new Error(lines.join("\n"));
 };

 unescape = function (value) {
    var re = new RegExp('\\\\([\'"])', 'g');
    return value.replace(re, '$1');
 };

 isArray = function(o) {
    return Array.isArray(o);
 };

 andMerge = function(a, b) {
    var c;
    if(isArray(a)) {
        a.push(b);
        c = a;
    } else {
        c = [];
        c.push(a);
        c.push(b);
    }
    return c;
 }

 orMerge = function(a, b) {
    var c, d;

    if(isArray(a)) {
      a.push({$or: b});
      c = a;
    } else {
      c = {};
      c['$or'] = b;
    }
    return c;
 }

 setNot = function(a, b) {
    a.$not[Object.keys(a.$not)[0]]=b;
    return a;
 }

 setProp = function(p) {
    var o = {}, v = null;

    if(p.match(/:$/)) {
      p = p.replace(/:$/, '');
    } else {
      v = {$ne: null};
    }
    o[p] = v;
    return o;
 }

%}

%% /* language grammar */

expressions
    : expression { return $1; }
    ;

expression
    : andCondition { $$ = $1; }
    | expression OR andCondition { $$ = orMerge($1, $3); }
    ;

andCondition
    : filterExpr { $$ = $1 }
    | andCondition AND filterExpr { $$ = andMerge($1, $3); }
    ;

filterExpr
    : LPAREN expression RPAREN { var _e = []; _e.push($2); $$ = _e; }
    | notPropExpr valueExpr { $$ = setNot($1, $2); }
    | propExpr valueExpr { $1[Object.keys($1)[0]] = $2; $$ = $1; }
    ;

notPropExpr
    : NOTPROP { $1 = $1.replace(/^!/, '').replace(/:$/, ''); var _p = {}; _p[$1]=undefined; $$ = {'$not': _p}; }
    ;

propExpr
    : PROP { $$ = setProp($1); }
    ;

valueExpr
    : LBRACKET inExpr RBRACKET { $$=$2; }
    | OP VALUE { $$={}; $$[$1]= $2; }
    | VALUE { $$ = $1; }
    ;

inExpr
    : inExpr OR VALUE { if(isArray($1)) { $1.push($3); } else { var a = []; a.push($1); a.push($3); $1 = a }; $$ = $1 ; }
    | VALUE { $$ = $1; }
    ;

VALUE
    : NULL { $$ = null }
    | TRUE { $$ = true }
    | FALSE { $$ = false }
    | NUMBER { $$ = parseInt(yytext); }
    | LITERAL { $$ = $1; }
    | STRING  { $1 = $1.replace(/^'|'$/g, ''); $$ = unescape($1); }
    ;

OP
    : NOT { $$ = "$ne"; }
    | GT { $$ = "$gt"; }
    | LT { $$ = "$lt"; }
    | GTE { $$ = "$gte"; }
    | LTE { $$ = "$lte"; }
    | LIKE { $$ = "$like"; }
    ;

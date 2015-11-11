/**
 * # Lodash Statement
 *
 * A set of lodash-like statements, heavily dependent on lodash,
 * for operating on the JSON statement objects returned from GQL
 */

var _ = require('lodash'),
    
    matchStatement,
    eachStatement,
    findStatement,
    mergeStatements,
    printStatements;

/**
 * ## Match Statement
 *
 * Determine if a statement matches a given object
 *
 * E.g.
 * matchStatement({prop: 'page', op: '=', value: false}, {prop: 'page'}) => true
 * matchStatement({prop: 'page', op: '=', value: false}, {value: true}) => false
 * matchStatement({prop: 'tag.slug', op: 'IN', value: ['a', 'b']}, {prop: /^tag/, op: 'IN'}) => true
 *
 * @param {Object} statement - a single statement from a GQL JSON object
 * @param {Object} match - a set of key, value pairs to match against
 * @returns {boolean} does match
 */
matchStatement = function matchStatement(statement, match) {
    return _.every(match, function (value, key) {
        if (_.isRegExp(value)) {
            return _.has(statement, key) && value.test(statement[key]);
        } else {
            return _.has(statement, key) && value === statement[key];
        }
    })
};

/**
 * ## Each Statement
 *
 * Call a function on every statement
 *
 * E.g. eachStatement([..statements], function (statement, index) { statement.prop = statement.prop.toLowerCase(); });
 *
 * @param {Array} statements - an array of statements from a GQL JSON object
 * @param {Function} func - function to call for each individual statement
 * @param {Function} [groupFunc] - optionally provide a function to call for groups instead of automatic recursion
 */    
eachStatement = function eachStatement(statements, func, groupFunc) {
    _.each(statements, function (statement, index) {
        if (_.has(statement, 'group')) {
            if (groupFunc) {
                groupFunc(statement, index);
            } else {
                eachStatement(statement.group, func, groupFunc);
            }
        } else {
            func(statement, index);
        }
    });
};

/**
 * ## Find Statement
 *
 * Recursively find if any statement in the array matches the given match object
 *
 * E.g. returns true:
 * ```
 * findStatement([
 *   {op: "=", value: "photo", prop: "tag"},
 *   {op: "=", value: "video", prop: "tag", func: "or"}
 * ], {value: "video"});
 * ```
 *
 * @param {Array} statements - an array of statements from a GQL JSON object
 * @param {Object} match - an object full of key-value pairs to match against
 * @param {string|Array} [keys] - only match on these keys
 * @returns {boolean}
 */
findStatement = function findStatement(statements, match, keys) {
    return _.any(statements, function (statement) {
        if (_.has(statement, 'group')) {
            return findStatement(statement.group, match, keys);
        } else {
            return matchStatement(statement, keys ? _.pick(match, keys) : match);
        }
    });
};

/**
 * ## Merge Statements
 *
 * Take multiple statements, or statement objects and combines them into a valid statement object, using 'and'
 *
 * E.g.
 * ```
 * mergeStatements(
 *   {statements: [
 *     {op: "=", value: "photo", prop: "tag"},
 *     {op: "=", value: "video", prop: "tag", func: "or"}
 *   ]},
 *   {prop: 'page', op: '=', value: false}
 * );
 * ```
 *
 * Returns:
 * ```
 * {statements: [
 *     {op: "=", value: "photo", prop: "tag"},
 *     {op: "=", value: "video", prop: "tag", func: "or"}
 *     {op: "=", value: false, prop: "page", func "and"}
 *   ]},
 * ```
 *
 * @param {...Object} statements
 * @returns {{statements: *}}
 */
mergeStatements = function mergeStatements(/* statements */) {
    var statementsArray = _.reduce(arguments, function (array, arg) {
        if (!arg) { return array; }

        if (_.has(arg, 'statements')) {
            if (array.length !== 0 && !_.isEmpty(arg.statements)) {
                arg.statements[0].func = 'and';
            }
            array = array.concat(arg.statements);
        } else {
            if (array.length !== 0) { arg.func = 'and'; }
            array.push(arg);
        }

        return array;
    }, []);

    return {statements: statementsArray};
};

/**
 * ## Print statements
 *
 * Recursively print out a statement object, including statements inside of groups
 * Used for debugging, because console.log only prints a few levels deep
 *
 * @param {Array} statements - an array of statements from a GQL JSON object
 * @param {integer} indent - indent size to start with
 */
printStatements = function printStatements(statements, indent) {
    indent = indent || 0;
    function print(indent /* strs */) {
        var strs = [_.fill(Array(indent), ' ').join('')].concat(Array.prototype.slice.call(arguments, 1));
        console.log.apply(this, strs);
    }
    eachStatement(statements, function single(statement) {
        print(indent, statement);
    }, function group(statement) {
        print(indent, 'group', statement.func);
        printStatements(statement.group, indent + 1);
    });
};

module.exports = {
    matchStatement: matchStatement,
    eachStatement: eachStatement,
    findStatement: findStatement,
    mergeStatements: mergeStatements,
    printStatements: printStatements
};
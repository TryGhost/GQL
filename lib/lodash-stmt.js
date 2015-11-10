/**
 * # Lodash Statement
 *
 * A set of lodash-like statements, heavily dependent on lodash,
 * for operating on the JSON statement objects returned from GQL
 */

var _ = require('lodash'),
    
    matchStatement,
    eachStatement,
    findStatement;

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

module.exports = {
    matchStatement: matchStatement,
    eachStatement: eachStatement,
    findStatement: findStatement
};
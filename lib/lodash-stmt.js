/**
 * # Lodash Statement
 *
 * A set of lodash-like statements, heavily dependent on lodash,
 * for operating on the JSON statement objects returned from GQL
 */

var _ = require('lodash');

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
var eachStatement = function eachStatement(statements, func, groupFunc) {
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

module.exports = {
    eachStatement: eachStatement
};
/**
 * Utility function to implement additional 'check' patterns to aid in
 * paramters and data validation
 */

/**
 * Check if argument is a function
 * @returns {Boolean}   true is `f` is a JS function
 */
isFunction = Match.Where(function (f) {
    return _.isFunction(f);
});
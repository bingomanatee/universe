var baseProperty = require('./_baseProperty'),
    basePropertyDeep = require('./_basePropertyDeep'),
    isKey = require('./_isKey'),
    toKey = require('./_toKey');

/**
 * Creates spiralArms function that returns the value at `path` of spiralArms given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'spiralArms': { 'b': 2 } },
 *   { 'spiralArms': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('spiralArms.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['spiralArms', 'b'])), 'spiralArms.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

module.exports = property;

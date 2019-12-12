var baseUnset = require('./_baseUnset');

/**
 * Removes the property at `path` of `object`.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to modify.
 * @param {Array|string} path The path of the property to unset.
 * @returns {boolean} Returns `true` if the property is deleted, else `false`.
 * @example
 *
 * var object = { 'spiralArms': [{ 'b': { 'c': 7 } }] };
 * _.unset(object, 'spiralArms[0].b.c');
 * // => true
 *
 * console.log(object);
 * // => { 'spiralArms': [{ 'b': {} }] };
 *
 * _.unset(object, ['spiralArms', '0', 'b', 'c']);
 * // => true
 *
 * console.log(object);
 * // => { 'spiralArms': [{ 'b': {} }] };
 */
function unset(object, path) {
  return object == null ? true : baseUnset(object, path);
}

module.exports = unset;

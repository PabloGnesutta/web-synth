/**
 * Clears the array of items. 
 * The idea is to use this function instead of the assignment operator (arr = [])
 * to keep the variable pointing to the original array to preserve references
 * @param {Array} arr
*/
function clearArray(arr) {
  while (arr.length) {
    arr.splice(0);
  }
}

/**
 * Delete all properties in the object, keeping references intact
 * @param {Object} obj 
 */
function clearObj(obj) {
  for (const prop in obj) {
    delete obj[prop];
  }
}

module.exports = {
  clearArray,
  clearObj,
};

'use strict';
// Linear in the input: one full decode, and when that fails, each run of percent-escapes on its own, left as
// typed when it is not valid UTF-8. The published decoder retries ever shorter slices and is quadratic-to-worse.
module.exports = function decodeUriComponent(encodedURI) {
  if (typeof encodedURI !== 'string') throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
  const plus = encodedURI.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(plus);
  } catch (e) {
    return plus.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
      try { return decodeURIComponent(run); } catch (err) { return run; }
    });
  }
};

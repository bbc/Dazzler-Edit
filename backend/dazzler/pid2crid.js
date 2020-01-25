const Big = require("big-integer");

const pidchars = "0123456789bcdfghjklmnpqrstvwxyz";
const pidbase = pidchars.length;

function crid(pid) {
  var n = Big(0);
  for (var i = 1; i < pid.length; i++) {
    const c = pid.charAt(i);
    const p = pidchars.indexOf(c);
    n = n.times(pidbase).plus(p);
  }
  return `crid://bbc.co.uk/${pid.substring(0, 1)}/${n}`;
}
module.exports.crid = crid;
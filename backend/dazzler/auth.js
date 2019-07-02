const fs = require('fs');

function auth(email) {
  const auth = fs.readFileSync('auth.txt');
  return auth.includes(','+email+',');;
}

module.exports = auth

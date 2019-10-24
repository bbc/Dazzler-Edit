const fs = require("fs");

function auth(email) {
  if(process.env.AUTHORISED_USERS){
    const auth = fs.readFileSync("/usr/lib/dazzler/auth.txt");
    return auth.includes("," + email + ",");
  }else{
  const auth = fs.readFileSync("auth.txt");
  return auth.includes("," + email + ",");
}
}

module.exports = auth;

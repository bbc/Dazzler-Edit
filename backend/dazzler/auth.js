const fs = require("fs");

function auth(email) {
  if(process.env.AUTHORISED_USERS){
    const auth = ","+process.env.AUTHORISED_USERS.trim()+",";
    return auth.includes(`,${email.trim()},`);
  }else{
  return true; // allow saving in the local environment
}
}

module.exports = auth;

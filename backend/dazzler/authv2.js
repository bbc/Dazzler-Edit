function isAuthorised(email) {
  if (process.env.AUTHORISED_USERS) {
    const auth = "," + process.env.AUTHORISED_USERS.trim() + ",";
    console.log("auth", auth, email);
    return auth.toLowerCase().includes(`,${email.trim().toLowerCase()},`);
  } else {
    return true; // allow saving in the local environment
  }
}

function parseSSLsubject(req) {
  var subject = req.header("sslclientcertsubject");
  var fields = subject.split(",");
  var data = {};
  for (var i = 0; i < fields.length; i++) {
    var [key, val] = fields[i].split("=");
    data[key] = val;
  }
  return data;
}

const user = function (req, res) {
  if (req.header("bbc-pp-oidc-id-token-email")) {
    console.log(req.headers);
  } else {
    console.log("Nothing to log");
  }

  res.json({
    name: "Null",
    auth: true,
  });
};

module.exports = {
  isAuthorised,
  user,
  parseSSLsubject,
};

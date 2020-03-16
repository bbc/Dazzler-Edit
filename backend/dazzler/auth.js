function isAuthorised(email) {
  if (process.env.AUTHORISED_USERS) {
    const auth = "," + process.env.AUTHORISED_USERS.trim() + ",";
    console.log('auth', auth, email);
    return auth.includes(`,${email.trim()},`);
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
  if (req.header("sslclientcertsubject")) {
    const subject = parseSSLsubject(req);
    let r = {
      email: subject.emailAddress,
      auth: isAuthorised(subject.emailAddress)
    };
    if (subject.hasOwnProperty("CN")) {
      r.name = subject.CN;
    }
    res.json(r);
  } else {
    res.json({
      name: "anonymous",
      auth: true
    });
  }
}

module.exports = {
  isAuthorised,
  user,
  parseSSLsubject
};

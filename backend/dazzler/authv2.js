function isAuthorised(email) {
  if (process.env.AUTHORISED_USERS) {
    const auth = "," + process.env.AUTHORISED_USERS.trim() + ",";
    console.log("auth", auth, email);
    return auth.toLowerCase().includes(`,${email.trim().toLowerCase()},`);
  } else {
    return true; // allow saving in the local environment
  }
}

const user = function (req, res) {
  if (req.header("bbc-pp-oidc-id-token-email")) {
    let emailAddress = req.header("bbc-pp-oidc-id-token-email");
    let r = {
      email: emailAddress,
      auth: isAuthorised(emailAddress),
    };
    console.log("headers are ", req.headers);
    console.log("------------------");
  } else {
    res.json({
      name: "Anonymous",
      auth: true,
    });
  }
};

module.exports = {
  isAuthorised,
  user,
};

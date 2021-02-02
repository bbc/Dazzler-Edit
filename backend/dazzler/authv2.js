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
    res.json({
      name: email,
      auth: true,
      email: email,
    });
    console.log("headers are ", req.headers);

    console.log("------------------");
    res.json(r);
  } else {
    res.json({
      name: "Anonymous",
      auth: false,
    });
  }
};

module.exports = {
  isAuthorised,
  user,
};

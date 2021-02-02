function isAuthorised(email) {
  if (process.env.AUTHORISED_USERS) {
    const auth = "," + process.env.AUTHORISED_USERS.trim() + ",";
    console.log("auth", auth, email);
    return auth.toLowerCase().includes(`,${email.trim().toLowerCase()},`);
  } else {
    return true; // allow saving in the local environment
  }
}
function getName(email) {
  try {
    if (email) {
      let name = email.split("@")[0];
      let formattedName = name.replace(".", " ");
      return formattedName;
    }
  } catch (error) {
    console.log(error);
    return "";
  }
}

const user = function (req, res) {
  if (req.header("bbc-pp-oidc-id-token-email")) {
    console.log("headers --", req.headers);
    let emailAddress = req.header("bbc-pp-oidc-id-token-email");
    res.json({
      name: getName(email),
      auth: isAuthorised(emailAddress),
      email: email,
    });
    console.log("headers --", done);
  } else {
    res.json({
      name: "false",
      auth: false,
    });
  }
};

module.exports = {
  isAuthorised,
  user,
};

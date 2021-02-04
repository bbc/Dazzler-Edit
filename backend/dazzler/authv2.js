function isAuthorised(email) {
  if (process.env.AUTHORISED_USERS) {
    const auth = "," + process.env.AUTHORISED_USERS.trim() + ",";
    console.log("auth", auth, email);
    return auth.toLowerCase().includes(`,${email.trim().toLowerCase()},`);
  } else {
    return true; // allow saving in the local environment
  }
}

function formatName(firstName, lastName) {
  let fName = firstName[0].toUpperCase() + firstName.slice(1);
  let lName = lastName[0].toUpperCase() + lastName.slice(1);
  let formattedName = fName + " " + lName;
  return formattedName;
}
function getName(email) {
  try {
    if (email) {
      let name = email.split("@")[0];
      let firstName = name.split(".")[0];
      let lastName = name.split(".")[1];
      let formattedName = formatName(firstName, lastName);
      return formattedName;
    }
  } catch (error) {
    console.log(error);
    return "";
  }
}

const user = function (req, res) {
  if (req.header("bbc-pp-oidc-id-token-email")) {
    let email = req.header("bbc-pp-oidc-id-token-email");
    res.json({
      name: getName(email),
      auth: isAuthorised(email),
      email: email,
    });
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

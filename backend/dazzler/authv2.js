function isAuthorised(req, config) {
  let email = 'dazzler'; // for testing purposes
  if (req.header("bbc-pp-oidc-id-token-email")) {
    email = req.header("bbc-pp-oidc-id-token-email");
  }
  let groups = [];
  if (req.header("bbc-pp-user-groups")) {
    const ppg = req.header("bbc-pp-user-groups");
    console.log(ppg);
    groups = JSON.parse(ppg).map((group) => group.id);
    const sid = req.query.sid || config.default_sid;
    console.log(sid, email, groups);
    console.log(config[sid].edit_group);
    if (groups.includes(config[sid].edit_group)) {
      return email;
    }
  }
  if (process.env.AUTHORISED_USERS) {
    const auth = "," + process.env.AUTHORISED_USERS.trim() + ",";
    if(auth.toLowerCase().includes(`,${email.trim().toLowerCase()},`)) {
      return email;
    }
    return undefined;
  } else {
    return undefined;
  }
}

function formatName(firstName, lastName) {
  try {
    let fName = firstName[0].toUpperCase() + firstName.slice(1);
    let lName = lastName[0].toUpperCase() + lastName.slice(1);
    let formattedName = fName + " " + lName;
    return formattedName;
  } catch (error) {
    console.log(error);
    return "";
  }
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

module.exports = {
  isAuthorised,
  getName,
};

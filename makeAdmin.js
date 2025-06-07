// makeAdmin.js
const admin = require("firebase-admin");

// Replace with the path to your service account JSON
const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function grantAdmin(email) {
  // Look up the user by email
  const user = await admin.auth().getUserByEmail(email);
  // Set a custom claim of “admin: true”
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`✅ ${email} is now an admin (uid: ${user.uid})`);
}

grantAdmin("ergishasani2020@gmail.com").catch(console.error);

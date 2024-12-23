
const string = new TextEncoder().encode(process.env.DB_PASSWORD);
const binString = String.fromCodePoint(...string);
password = atob(binString);

use miracon;
db.createUser({
  user: process.env.DB_USERNAME,
  pwd: password,
  roles: [{
    role: "readWrite",
    db: "miracon"
  }]
})
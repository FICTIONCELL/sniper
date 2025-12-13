const bcrypt = require('bcryptjs');
const password = '127.0.0.1';
const hash = bcrypt.hashSync(password, 10);
console.log('HASH:' + hash);

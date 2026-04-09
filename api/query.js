var d = require('./db');
var rows = d.db.prepare('SELECT id, nome, email FROM usuarios').all();
console.log(JSON.stringify(rows, null, 2));

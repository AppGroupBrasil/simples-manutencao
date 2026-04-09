var d = require('./db');
d.db.prepare("UPDATE usuarios SET email = 'eddnpt@gmail.com', login = 'eddnpt@gmail.com', nome = 'eddnpt@gmail.com' WHERE id = 'mnglsu7rsw1'").run();
var rows = d.db.prepare('SELECT id, nome, email FROM usuarios').all();
console.log(JSON.stringify(rows, null, 2));

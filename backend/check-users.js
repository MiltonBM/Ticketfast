const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando usuarios...');
console.log('========================');

db.all("SELECT id, username, password, full_name, role FROM users", (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        return;
    }
    
    if (rows.length === 0) {
        console.log('⚠️ No hay usuarios registrados.');
    } else {
        console.log(✅  usuarios encontrados:);
        rows.forEach(u => {
            console.log(   👤  -  ());
            console.log(      Contraseña: );
        });
    }
    db.close();
});

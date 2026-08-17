const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data/tickets.db');
const schemaPath = path.join(__dirname, 'src/database/schema.sql');

console.log('🔄 Recreando base de datos...');
console.log('============================');

if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️ Base de datos anterior eliminada');
}

const schema = fs.readFileSync(schemaPath, 'utf8');
const db = new sqlite3.Database(dbPath);

db.exec(schema, (err) => {
    if (err) {
        console.error('❌ Error al crear base de datos:', err.message);
    } else {
        console.log('✅ Base de datos creada exitosamente');
        console.log('🔑 Usuario: admin');
        console.log('🔑 Contraseña: Admin123!');
    }
    db.close();
});

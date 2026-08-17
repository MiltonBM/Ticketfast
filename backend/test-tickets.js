const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando estructura de tickets...');
console.log('============================================');

// Verificar columnas
db.all("PRAGMA table_info(tickets)", (err, columns) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    console.log('📋 Columnas de la tabla tickets:');
    columns.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
    });
    
    // Verificar tickets existentes
    db.all("SELECT id, ticket_number, status, user_name FROM tickets LIMIT 5", (err, rows) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.close();
            return;
        }
        
        console.log(`\n📊 ${rows.length} tickets encontrados:`);
        rows.forEach(t => {
            console.log(`   #${t.ticket_number} - ${t.status} - ${t.user_name}`);
        });
        
        db.close();
    });
});

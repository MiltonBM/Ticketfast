const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Técnicos registrados:');
console.log('========================');

db.all(`
    SELECT tp.*, u.full_name, u.username, u.email 
    FROM technician_profiles tp
    JOIN users u ON tp.user_id = u.id
    WHERE tp.is_active = 1
`, (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        return;
    }
    
    if (rows.length === 0) {
        console.log('⚠️ No hay técnicos registrados.');
        console.log('📝 Ve a Usuarios → Técnicos y crea uno.');
    } else {
        console.log(`✅ ${rows.length} técnicos encontrados:`);
        rows.forEach(t => {
            console.log(`   👨‍🔧 ${t.full_name} (${t.username})`);
            console.log(`      Especialidad: ${t.specialty || 'N/A'}`);
            console.log(`      ID: ${t.id}`);
        });
    }
    db.close();
});

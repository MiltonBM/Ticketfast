const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando equipos y asignaciones...');
console.log('============================================');

// Verificar todos los equipos
db.all(`
    SELECT h.id, h.serial_number, h.brand, h.model, h.assigned_to_user, u.full_name as user_name
    FROM hardware h
    LEFT JOIN users u ON h.assigned_to_user = u.id
    ORDER BY h.id
`, (err, rows) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    console.log(`📊 ${rows.length} equipos encontrados:`);
    rows.forEach(h => {
        console.log(`   ID: ${h.id} - Serial: ${h.serial_number || 'N/A'} - ${h.brand || ''} ${h.model || ''}`);
        console.log(`      Asignado a: ${h.user_name || 'No asignado'} (User ID: ${h.assigned_to_user || 'N/A'})`);
    });
    
    // Verificar duplicados por serial
    db.all(`
        SELECT serial_number, COUNT(*) as count
        FROM hardware
        WHERE serial_number IS NOT NULL
        GROUP BY serial_number
        HAVING COUNT(*) > 1
    `, (err, duplicates) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.close();
            return;
        }
        
        if (duplicates.length > 0) {
            console.log('\n⚠️ Seriales duplicados encontrados:');
            duplicates.forEach(d => {
                console.log(`   ${d.serial_number} - ${d.count} veces`);
            });
        } else {
            console.log('\n✅ No hay seriales duplicados');
        }
        db.close();
    });
});

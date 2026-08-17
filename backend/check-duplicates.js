const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando equipos duplicados...');
console.log('============================================');

// Verificar equipos con el mismo serial
db.all(`
    SELECT serial_number, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM hardware 
    WHERE serial_number IS NOT NULL AND serial_number != ''
    GROUP BY serial_number 
    HAVING COUNT(*) > 1
`, (err, duplicates) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    if (duplicates.length > 0) {
        console.log('⚠️ Seriales duplicados encontrados:');
        duplicates.forEach(d => {
            console.log(`   ${d.serial_number} - ${d.count} veces (IDs: ${d.ids})`);
        });
    } else {
        console.log('✅ No hay seriales duplicados');
    }
    
    // Verificar equipos asignados a Carlos (ID 3)
    db.all(`
        SELECT h.id, h.serial_number, h.brand, h.model, h.assigned_to_user, u.full_name
        FROM hardware h
        LEFT JOIN users u ON h.assigned_to_user = u.id
        WHERE h.assigned_to_user = 3 OR h.assigned_to_user IS NULL
        ORDER BY h.assigned_to_user DESC
    `, (err, rows) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.close();
            return;
        }
        
        console.log('\n📊 Equipos (asignados y disponibles):');
        rows.forEach(h => {
            console.log(`   ID: ${h.id} - Serial: ${h.serial_number} - ${h.brand || ''} ${h.model || ''}`);
            console.log(`      Asignado a: ${h.full_name || 'No asignado'}`);
        });
        db.close();
    });
});

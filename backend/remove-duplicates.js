const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Eliminando equipos duplicados...');
console.log('============================================');

// Encontrar y eliminar duplicados (mantener el primero)
db.all(`
    SELECT serial_number, MIN(id) as keep_id, COUNT(*) as count
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
    
    if (duplicates.length === 0) {
        console.log('✅ No hay duplicados para eliminar');
        db.close();
        return;
    }
    
    duplicates.forEach(d => {
        console.log(`\n📦 Eliminando duplicados de: ${d.serial_number}`);
        db.run(`
            DELETE FROM hardware 
            WHERE serial_number = ? AND id != ?
        `, [d.serial_number, d.keep_id], function(err) {
            if (err) {
                console.error(`❌ Error eliminando ${d.serial_number}:`, err.message);
            } else {
                console.log(`✅ ${this.changes} duplicados eliminados de ${d.serial_number}`);
            }
        });
    });
    
    setTimeout(() => {
        db.close();
        console.log('\n✅ Proceso completado. Reinicia el backend.');
    }, 1000);
});

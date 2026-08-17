const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Limpiando asignaciones duplicadas...');
console.log('============================================');

// Desasignar equipos que están asignados a usuarios que no existen o están inactivos
db.run(`
    UPDATE hardware 
    SET assigned_to_user = NULL, assignment_type = NULL, assignment_date = NULL
    WHERE assigned_to_user IS NOT NULL 
    AND assigned_to_user NOT IN (SELECT id FROM users WHERE is_active = 1)
`, function(err) {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    console.log(`✅ ${this.changes} equipos desasignados (usuarios inactivos)`);
    
    // Verificar si hay equipos asignados a usuarios que no existen
    db.all(`
        SELECT h.id, h.serial_number, h.assigned_to_user, u.id as user_exists
        FROM hardware h
        LEFT JOIN users u ON h.assigned_to_user = u.id
        WHERE h.assigned_to_user IS NOT NULL AND u.id IS NULL
    `, (err, rows) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.close();
            return;
        }
        
        if (rows.length > 0) {
            console.log(`\n⚠️ ${rows.length} equipos asignados a usuarios que no existen:`);
            rows.forEach(r => {
                console.log(`   ${r.serial_number} - User ID: ${r.assigned_to_user}`);
            });
        } else {
            console.log('\n✅ No hay equipos asignados a usuarios inexistentes');
        }
        db.close();
    });
});

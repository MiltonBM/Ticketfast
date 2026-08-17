const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando técnicos en la base de datos...');
console.log('============================================');

// Verificar tabla technician_profiles
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='technician_profiles'", (err, tables) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    if (tables.length === 0) {
        console.log('⚠️ La tabla technician_profiles no existe.');
        console.log('📝 Ejecuta el script de recreación de base de datos.');
        db.close();
        return;
    }
    
    // Obtener técnicos
    db.all(`
        SELECT tp.*, u.full_name, u.username, u.email, u.role
        FROM technician_profiles tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.is_active = 1
    `, (err, rows) => {
        if (err) {
            console.error('❌ Error:', err.message);
            db.close();
            return;
        }
        
        if (rows.length === 0) {
            console.log('⚠️ No hay técnicos registrados.');
            console.log('📝 Ve a Usuarios → Técnicos y crea uno.');
        } else {
            console.log(`✅ ${rows.length} técnicos encontrados:`);
            rows.forEach(t => {
                console.log(`   👨‍🔧 ${t.full_name} (${t.username})`);
                console.log(`      ID: ${t.id}, User ID: ${t.user_id}`);
                console.log(`      Especialidad: ${t.specialty || 'N/A'}`);
                console.log(`      Rol en users: ${t.role}`);
            });
        }
        db.close();
    });
});

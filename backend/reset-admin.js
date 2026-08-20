const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/tickets.db');
const db = new sqlite3.Database(dbPath);

console.log('🔑 Reseteando contraseña del admin...');
console.log('====================================');

// Verificar si el admin existe
db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    if (!row) {
        console.log('⚠️ El usuario admin no existe. Creándolo...');
        db.run(
            INSERT INTO users (username, password, full_name, email, role, is_active, can_report_lab_tickets) 
            VALUES ('admin', 'Admin123!', 'Administrador del Sistema', 'admin@ticketfast.com', 'admin', 1, 1)
        , function(err) {
            if (err) {
                console.error('❌ Error al crear admin:', err.message);
            } else {
                console.log('✅ Usuario admin creado con ID:', this.lastID);
                console.log('🔑 Contraseña: Admin123!');
            }
            db.close();
        });
    } else {
        db.run("UPDATE users SET password = 'Admin123!' WHERE username = 'admin'", function(err) {
            if (err) {
                console.error('❌ Error al actualizar:', err.message);
            } else {
                console.log(✅ Contraseña actualizada. Filas afectadas: );
                console.log('🔑 Contraseña: Admin123!');
            }
            db.close();
        });
    }
});
import express from "express";
import { query, run } from "../database/database.js";
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangeEmail } from "../services/emailService.js";
import crypto from 'crypto';

const router = express.Router();

// Obtener todos los usuarios
router.get("/", async (req, res) => {
    try {
        const users = await query(`
            SELECT id, username, full_name, email, department, phone, role, is_active, 
                   can_report_lab_tickets, created_at 
            FROM users 
            WHERE role != 'admin'
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener usuarios con permisos de laboratorio
router.get("/lab-reporters", async (req, res) => {
    try {
        const users = await query(`
            SELECT id, username, full_name, email, department, phone
            FROM users 
            WHERE can_report_lab_tickets = 1 AND is_active = 1
            ORDER BY full_name
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener equipos de un usuario
router.get("/:id/equipment", async (req, res) => {
    try {
        const hardware = await query(`
            SELECT h.*, 
                   l.name as lab_name,
                   u.full_name as assigned_user_name
            FROM hardware h
            LEFT JOIN laboratories l ON h.assigned_to_lab = l.id
            LEFT JOIN users u ON h.assigned_to_user = u.id
            WHERE h.assigned_to_user = ? OR h.assigned_to_lab IN (
                SELECT assigned_to_lab FROM hardware WHERE assigned_to_user = ?
            )
            ORDER BY h.device_type, h.brand, h.model
        `, [req.params.id, req.params.id]);
        res.json(hardware);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un usuario por ID
router.get("/:id", async (req, res) => {
    try {
        const users = await query(`
            SELECT id, username, full_name, email, department, phone, role, is_active, can_report_lab_tickets, created_at 
            FROM users 
            WHERE id = ?
        `, [req.params.id]);
        if (users.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Registrar nuevo usuario (self-registration)
router.post("/register", async (req, res) => {
    try {
        const { username, password, full_name, email, department, phone } = req.body;
        
        if (!username || !password || !full_name || !email) {
            return res.status(400).json({ error: "Todos los campos son requeridos" });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        }
        
        const existing = await query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "El usuario o email ya está registrado" });
        }

        const result = await run(
            `INSERT INTO users (username, password, full_name, email, department, phone, role, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, password, full_name, email, department, phone, 'usuario', 1]
        );

        try {
            await sendWelcomeEmail(email, full_name, username, password);
        } catch (emailError) {
            console.error('Error enviando email de bienvenida:', emailError);
        }

        const newUser = await query(`
            SELECT id, username, full_name, email, department, phone, role, is_active, can_report_lab_tickets, created_at 
            FROM users 
            WHERE id = ?
        `, [result.id]);
        
        res.status(201).json({ 
            message: "Usuario registrado exitosamente. Revisa tu correo para las credenciales.",
            user: newUser[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear usuario por administrador
router.post("/", async (req, res) => {
    try {
        const { username, password, full_name, email, department, phone, role, can_report_lab_tickets, created_by } = req.body;
        
        const existing = await query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "El usuario o email ya existe" });
        }

        const result = await run(
            `INSERT INTO users (username, password, full_name, email, department, phone, role, can_report_lab_tickets, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, password, full_name, email, department, phone, role || 'usuario', can_report_lab_tickets || 0, created_by || 1]
        );

        try {
            await sendWelcomeEmail(email, full_name, username, password);
        } catch (emailError) {
            console.error('Error enviando email de bienvenida:', emailError);
        }

        const newUser = await query(`
            SELECT id, username, full_name, email, department, phone, role, is_active, can_report_lab_tickets, created_at 
            FROM users 
            WHERE id = ?
        `, [result.id]);
        
        res.status(201).json(newUser[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar usuario
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, full_name, email, department, phone, role, is_active, can_report_lab_tickets } = req.body;
        
        const existing = await query("SELECT * FROM users WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        let queryStr = `
            UPDATE users SET 
                username = ?, full_name = ?, email = ?, department = ?, 
                phone = ?, role = ?, is_active = ?, can_report_lab_tickets = ?, updated_at = CURRENT_TIMESTAMP
        `;
        let params = [username, full_name, email, department, phone, role, is_active, can_report_lab_tickets || 0];
        
        if (password && password.length > 0) {
            queryStr = `
                UPDATE users SET 
                    username = ?, password = ?, full_name = ?, email = ?, 
                    department = ?, phone = ?, role = ?, is_active = ?, can_report_lab_tickets = ?, updated_at = CURRENT_TIMESTAMP
            `;
            params = [username, password, full_name, email, department, phone, role, is_active, can_report_lab_tickets || 0];
        }
        
        queryStr += " WHERE id = ?";
        params.push(id);

        await run(queryStr, params);

        const updatedUser = await query(`
            SELECT id, username, full_name, email, department, phone, role, is_active, can_report_lab_tickets, created_at 
            FROM users 
            WHERE id = ?
        `, [id]);
        
        res.json(updatedUser[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar usuario
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await query("SELECT role FROM users WHERE id = ?", [id]);
        if (user.length > 0 && user[0].role === 'admin') {
            return res.status(403).json({ error: "No se puede eliminar al administrador" });
        }

        const result = await run("DELETE FROM users WHERE id = ?", [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login de usuario
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const users = await query(
            "SELECT id, username, password, full_name, email, role, is_active, can_report_lab_tickets FROM users WHERE username = ? AND is_active = 1",
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }
        
        const user = users[0];
        
        if (user.password !== password) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }
        
        res.json({
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            can_report_lab_tickets: user.can_report_lab_tickets
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Solicitar recuperación de contraseña
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        
        const users = await query("SELECT id, username, full_name, email FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(404).json({ error: "No existe una cuenta con este email" });
        }
        
        const user = users[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000);
        
        await run(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
            [resetToken, expiresAt.toISOString(), user.id]
        );
        
        try {
            await sendPasswordResetEmail(email, resetToken, user.full_name);
            res.json({ message: "Email de recuperación enviado. Revisa tu bandeja de entrada." });
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
            res.status(500).json({ error: "Error al enviar el email de recuperación" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restablecer contraseña con token
router.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token y nueva contraseña son requeridos" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        }
        
        const users = await query(
            "SELECT id, reset_token, reset_token_expires FROM users WHERE reset_token = ?",
            [token]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ error: "Token inválido" });
        }
        
        const user = users[0];
        const expiresAt = new Date(user.reset_token_expires);
        
        if (expiresAt < new Date()) {
            return res.status(400).json({ error: "El token ha expirado. Solicita uno nuevo." });
        }
        
        await run(
            "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
            [newPassword, user.id]
        );
        
        res.json({ message: "Contraseña restablecida exitosamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cambiar contraseña (usuario logueado)
router.post("/change-password", async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        
        const users = await query("SELECT id, password FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        const user = users[0];
        if (user.password !== currentPassword) {
            return res.status(401).json({ error: "Contraseña actual incorrecta" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
        }
        
        await run("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [newPassword, userId]);
        
        res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Solicitar cambio de contraseña (usuario)
router.post("/request-password-change", async (req, res) => {
    try {
        const { userId } = req.body;
        
        // Generar nueva contraseña aleatoria
        const newPassword = Math.random().toString(36).slice(-8) + 
                           Math.random().toString(36).toUpperCase().slice(-2) + 
                           '!';
        
        // Obtener usuario
        const users = await query("SELECT id, full_name, email FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        const user = users[0];
        
        // Actualizar contraseña
        await run("UPDATE users SET password = ? WHERE id = ?", [newPassword, userId]);
        
        // Enviar correo con la nueva contraseña
        try {
            await sendPasswordChangeEmail(user.email, user.full_name, newPassword);
            res.json({ 
                message: "Nueva contraseña enviada a tu correo electrónico"
            });
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
            res.status(500).json({ error: "Error al enviar el correo" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;



import express from "express";
import { query, run } from "../database/database.js";

const router = express.Router();

// Obtener todos los técnicos
router.get("/", async (req, res) => {
    try {
        const technicians = await query(`
            SELECT tp.*, u.username, u.full_name, u.email, u.department, u.phone
            FROM technician_profiles tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.is_active = 1
            ORDER BY u.full_name
        `);
        res.json(technicians);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un técnico por ID
router.get("/:id", async (req, res) => {
    try {
        const technicians = await query(`
            SELECT tp.*, u.username, u.full_name, u.email, u.department, u.phone
            FROM technician_profiles tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.id = ?
        `, [req.params.id]);
        if (technicians.length === 0) {
            return res.status(404).json({ error: "Técnico no encontrado" });
        }
        res.json(technicians[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear perfil de técnico
router.post("/", async (req, res) => {
    try {
        const { user_id, specialty, certifications, experience_years } = req.body;
        
        // Verificar si el usuario ya es técnico
        const existing = await query("SELECT * FROM technician_profiles WHERE user_id = ?", [user_id]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "Este usuario ya tiene perfil de técnico" });
        }
        
        const result = await run(
            `INSERT INTO technician_profiles (user_id, specialty, certifications, experience_years, is_active)
             VALUES (?, ?, ?, ?, 1)`,
            [user_id, specialty, certifications, experience_years || 0]
        );
        
        const newTechnician = await query(`
            SELECT tp.*, u.username, u.full_name, u.email, u.department, u.phone
            FROM technician_profiles tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.id = ?
        `, [result.id]);
        
        // Actualizar rol del usuario a 'tecnico'
        await run("UPDATE users SET role = 'tecnico' WHERE id = ?", [user_id]);
        
        res.status(201).json(newTechnician[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar perfil de técnico
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { specialty, certifications, experience_years, is_active } = req.body;
        
        await run(
            `UPDATE technician_profiles SET 
                specialty = ?,
                certifications = ?,
                experience_years = ?,
                is_active = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [specialty, certifications, experience_years, is_active, id]
        );
        
        const updatedTechnician = await query(`
            SELECT tp.*, u.username, u.full_name, u.email, u.department, u.phone
            FROM technician_profiles tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.id = ?
        `, [id]);
        
        res.json(updatedTechnician[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar perfil de técnico (desactivar)
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener el user_id antes de desactivar
        const tech = await query("SELECT user_id FROM technician_profiles WHERE id = ?", [id]);
        if (tech.length > 0) {
            // Cambiar rol del usuario a 'usuario'
            await run("UPDATE users SET role = 'usuario' WHERE id = ?", [tech[0].user_id]);
        }
        
        await run("UPDATE technician_profiles SET is_active = 0 WHERE id = ?", [id]);
        res.json({ message: "Perfil de técnico desactivado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

import express from "express";
import { query, run } from "../database/database.js";

const router = express.Router();

// Obtener todos los departamentos
router.get("/", async (req, res) => {
    try {
        const departments = await query("SELECT * FROM departments ORDER BY name");
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear departamento
router.post("/", async (req, res) => {
    try {
        const { code, name } = req.body;
        if (!code || !name) {
            return res.status(400).json({ error: "Código y nombre son obligatorios" });
        }
        const result = await run(
            "INSERT INTO departments (code, name) VALUES (?, ?)",
            [code, name]
        );
        const newDept = await query("SELECT * FROM departments WHERE id = ?", [result.id]);
        res.status(201).json(newDept[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Editar departamento
router.put("/:id", async (req, res) => {
    try {
        const { code, name } = req.body;
        await run(
            "UPDATE departments SET code = ?, name = ? WHERE id = ?",
            [code, name, req.params.id]
        );
        const updated = await query("SELECT * FROM departments WHERE id = ?", [req.params.id]);
        if (updated.length === 0) {
            return res.status(404).json({ error: "Departamento no encontrado" });
        }
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar departamento
router.delete("/:id", async (req, res) => {
    try {
        await run("DELETE FROM departments WHERE id = ?", [req.params.id]);
        res.json({ message: "Departamento eliminado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
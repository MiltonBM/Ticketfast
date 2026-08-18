import express from "express";
import { query, run } from "../database/database.js";

const router = express.Router();

// Obtener todos los equipos
router.get("/", async (req, res) => {
    try {
        const hardware = await query(`
            SELECT h.*, 
                   u.full_name as assigned_user_name,
                   l.name as assigned_lab_name
            FROM hardware h
            LEFT JOIN users u ON h.assigned_to_user = u.id
            LEFT JOIN laboratories l ON h.assigned_to_lab = l.id
            ORDER BY h.created_at DESC
        `);
        res.json(hardware);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener equipos por tipo
router.get("/type/:type", async (req, res) => {
    try {
        const hardware = await query(
            `SELECT h.*, 
                    u.full_name as assigned_user_name,
                    l.name as assigned_lab_name
             FROM hardware h
             LEFT JOIN users u ON h.assigned_to_user = u.id
             LEFT JOIN laboratories l ON h.assigned_to_lab = l.id
             WHERE h.device_type = ?
             ORDER BY h.created_at DESC`,
            [req.params.type]
        );
        res.json(hardware);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener laboratorios
router.get("/laboratories", async (req, res) => {
    try {
        const labs = await query("SELECT * FROM laboratories ORDER BY name");
        res.json(labs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear laboratorio
router.post("/laboratories", async (req, res) => {
    try {
        const { name, description, location } = req.body;
        const result = await run(
            "INSERT INTO laboratories (name, description, location) VALUES (?, ?, ?)",
            [name, description, location]
        );
        const newLab = await query("SELECT * FROM laboratories WHERE id = ?", [result.id]);
        res.status(201).json(newLab[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un equipo por ID
router.get("/:id", async (req, res) => {
    try {
        const hardware = await query(
            `SELECT h.*, 
                    u.full_name as assigned_user_name,
                    l.name as assigned_lab_name
             FROM hardware h
             LEFT JOIN users u ON h.assigned_to_user = u.id
             LEFT JOIN laboratories l ON h.assigned_to_lab = l.id
             WHERE h.id = ?`,
            [req.params.id]
        );
        if (hardware.length === 0) {
            return res.status(404).json({ error: "Equipo no encontrado" });
        }
        res.json(hardware[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear nuevo equipo
router.post("/", async (req, res) => {
    try {
        const data = req.body;
        const { serial_number, device_type } = data;

        // Verificar serial único
        const existing = await query("SELECT * FROM hardware WHERE serial_number = ?", [serial_number]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "Ya existe un equipo con este serial" });
        }

        // Determinar asignación
        let assigned_to_user = null;
        let assigned_to_lab = null;
        let assignment_type = null;

        if (data.assignment_type === 'user' && data.assigned_to_user) {
            assigned_to_user = data.assigned_to_user;
            assignment_type = 'user';
        } else if (data.assignment_type === 'laboratory' && data.assigned_to_lab) {
            assigned_to_lab = data.assigned_to_lab;
            assignment_type = 'laboratory';
        }

        // Construir query dinámica según tipo de equipo
        let fields = [];
        let values = [];
        let placeholders = [];

        // Campos base
        const baseFields = [
            'serial_number', 'inventory_code', 'device_type',
            'assigned_to_user', 'assigned_to_lab', 'assignment_type',
            'brand', 'model', 'status', 'purchase_date', 'warranty_until',
            'observations'
        ];

        // Campos específicos por tipo
        const pcFields = [
            'motherboard_brand', 'motherboard_model', 'motherboard_serial',
            'processor_brand', 'processor_family', 'processor_model',
            'processor_speed', 'processor_socket',
            'ram_brand', 'ram_family', 'ram_speed', 'ram_modules', 'ram_total_capacity',
            'hdd_brand', 'hdd_model', 'hdd_speed', 'hdd_capacity', 'hdd_type',
            'gpu_brand', 'gpu_memory', 'gpu_capacity', 'gpu_type',
            'screen_size', 'screen_resolution',
            'keyboard_type', 'mouse_type'
        ];

        const projectorFields = [
            'projector_lumens', 'projector_resolution', 'projector_contrast',
            'projector_lamp_hours', 'projector_lamp_life', 'projector_inputs',
            'projector_keystone', 'projector_speaker_power'
        ];

        const monitorFields = [
            'monitor_size', 'monitor_resolution', 'monitor_refresh_rate',
            'monitor_panel_type', 'monitor_ports', 'monitor_stand_type'
        ];

        const printerFields = [
            'printer_type', 'printer_technology', 'printer_max_resolution',
            'printer_speed_pages', 'printer_paper_size', 'printer_connectivity',
            'printer_toner_type'
        ];

        const networkFields = [
            'network_ports', 'network_speed', 'network_poe', 'network_managed',
            'network_vlan_support', 'network_wifi_standard', 'network_frequency',
            'network_max_speed'
        ];

        // Seleccionar campos según tipo
        let specificFields = [];
        switch (device_type) {
            case 'PC':
            case 'Laptop':
                specificFields = pcFields;
                break;
            case 'Videobeam':
            case 'Proyector':
                specificFields = projectorFields;
                break;
            case 'Monitor':
                specificFields = monitorFields;
                break;
            case 'Impresora':
                specificFields = printerFields;
                break;
            case 'Switch':
            case 'Router':
                specificFields = networkFields;
                break;
            default:
                specificFields = [];
        }

        const allFields = [...baseFields, ...specificFields];
        
        // Preparar valores
        for (const field of allFields) {
            fields.push(field);
            values.push(data[field] !== undefined ? data[field] : null);
            placeholders.push('?');
        }

        // Agregar fecha de asignación si hay asignación
        if (assignment_type) {
            fields.push('assignment_date');
            values.push(new Date().toISOString());
            placeholders.push('?');
        }

        const queryStr = `
            INSERT INTO hardware (${fields.join(', ')})
            VALUES (${placeholders.join(', ')})
        `;

        const result = await run(queryStr, values);

        const newHardware = await query(
            `SELECT h.*, 
                    u.full_name as assigned_user_name,
                    l.name as assigned_lab_name
             FROM hardware h
             LEFT JOIN users u ON h.assigned_to_user = u.id
             LEFT JOIN laboratories l ON h.assigned_to_lab = l.id
             WHERE h.id = ?`,
            [result.id]
        );
        
        res.status(201).json(newHardware[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar equipo
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Verificar si el equipo existe
        const existing = await query("SELECT * FROM hardware WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Equipo no encontrado" });
        }

        // Construir SET dinámico
        let setClause = [];
        let values = [];

        for (const [key, value] of Object.entries(data)) {
            if (key !== 'id' && key !== 'assigned_user_name' && key !== 'assigned_lab_name') {
                setClause.push(`${key} = ?`);
                values.push(value !== undefined ? value : null);
            }
        }

        setClause.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const queryStr = `
            UPDATE hardware 
            SET ${setClause.join(', ')}
            WHERE id = ?
        `;

        await run(queryStr, values);

        const updatedHardware = await query(
            `SELECT h.*, 
                    u.full_name as assigned_user_name,
                    l.name as assigned_lab_name
             FROM hardware h
             LEFT JOIN users u ON h.assigned_to_user = u.id
             LEFT JOIN laboratories l ON h.assigned_to_lab = l.id
             WHERE h.id = ?`,
            [id]
        );
        
        res.json(updatedHardware[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar equipo
router.delete("/:id", async (req, res) => {
    try {
        const result = await run("DELETE FROM hardware WHERE id = ?", [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Equipo no encontrado" });
        }
        res.json({ message: "Equipo eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
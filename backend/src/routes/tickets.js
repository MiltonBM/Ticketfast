import express from "express";
import { query, run } from "../database/database.js";
import { sendTicketEmail } from "../services/emailService.js";

const router = express.Router();

// Generar número de ticket personalizado
const generateTicketNumber = () => {
    const prefix = "TKT-";
    const timestamp = Date.now().toString().slice(-8);
    return prefix + timestamp;
};

// Obtener todos los tickets
router.get("/", async (req, res) => {
    try {
        const tickets = await query(`
            SELECT * FROM tickets 
            ORDER BY 
                CASE 
                    WHEN status = 'pending' THEN 1
                    WHEN status = 'assigned' THEN 2
                    WHEN status = 'in_progress' THEN 3
                    WHEN status = 'cancelled' THEN 4
                    WHEN status = 'completed' THEN 5
                END,
                created_at DESC
        `);
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener tickets de un usuario específico
router.get("/user/:userId", async (req, res) => {
    try {
        const tickets = await query(
            "SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC",
            [req.params.userId]
        );
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un ticket por ID
router.get("/:id", async (req, res) => {
    try {
        const tickets = await query("SELECT * FROM tickets WHERE id = ?", [req.params.id]);
        if (tickets.length === 0) {
            return res.status(404).json({ error: "Ticket no encontrado" });
        }
        res.json(tickets[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener lista de técnicos
router.get("/technicians", async (req, res) => {
    try {
        const technicians = await query("SELECT * FROM technicians WHERE is_active = 1 ORDER BY name");
        res.json(technicians);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear nuevo ticket
router.post("/", async (req, res) => {
    try {
        const ticketData = req.body;
        const ticketNumber = generateTicketNumber();
        
        const result = await run(
            `INSERT INTO tickets (
                ticket_number, user_id, user_name, user_department, user_department_id,
                user_phone, user_email, computer_model, computer_serial,
                computer_os, failure_description, failure_classification, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ticketNumber,
                ticketData.user_id || null,
                ticketData.user_name,
                ticketData.user_department,
                ticketData.user_department_id || "",
                ticketData.user_phone || "",
                ticketData.user_email || "",
                ticketData.computer_model,
                ticketData.computer_serial || "",
                ticketData.computer_os || "",
                ticketData.failure_description,
                ticketData.failure_classification || "",
                "pending"
            ]
        );

        const newTicket = await query("SELECT * FROM tickets WHERE id = ?", [result.id]);
        
        try {
            await sendTicketEmail(newTicket[0]);
        } catch (emailError) {
            console.error('Error enviando email:', emailError);
        }

        res.status(201).json(newTicket[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar ticket
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = updates.user_id;
        
        const existing = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Ticket no encontrado" });
        }
        
        const ticket = existing[0];
        
        if (userId && ticket.user_id !== userId) {
            return res.status(403).json({ error: "No tienes permiso para editar este ticket" });
        }
        
        if (ticket.status === 'cancelled' || ticket.status === 'completed') {
            return res.status(400).json({ error: "Este ticket ya ha sido cerrado" });
        }

        const result = await run(
            `UPDATE tickets SET 
                user_name = ?, user_department = ?, user_department_id = ?,
                user_phone = ?, user_email = ?, computer_model = ?,
                computer_serial = ?, computer_os = ?,
                failure_description = ?, failure_classification = ?,
                status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status != 'cancelled' AND status != 'completed'`,
            [
                updates.user_name,
                updates.user_department,
                updates.user_department_id || "",
                updates.user_phone || "",
                updates.user_email || "",
                updates.computer_model,
                updates.computer_serial || "",
                updates.computer_os || "",
                updates.failure_description,
                updates.failure_classification || "",
                updates.status || "pending",
                updates.assigned_to || "",
                id
            ]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: "Ticket no encontrado o ya está cerrado" });
        }

        const updatedTicket = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        res.json(updatedTicket[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Asignar técnico a ticket
router.put("/:id/assign-technician", async (req, res) => {
    try {
        const { id } = req.params;
        const { technician_name } = req.body;
        
        await run(
            "UPDATE tickets SET technician_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [technician_name, id]
        );
        
        const updatedTicket = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        res.json(updatedTicket[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Solicitar cancelación de ticket
router.post("/:id/request-cancellation", async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, reason } = req.body;
        
        const existing = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Ticket no encontrado" });
        }
        
        const ticket = existing[0];
        
        if (ticket.user_id !== user_id) {
            return res.status(403).json({ error: "No tienes permiso para solicitar la cancelación de este ticket" });
        }
        
        if (ticket.status === 'cancelled' || ticket.status === 'completed') {
            return res.status(400).json({ error: "Este ticket ya ha sido cerrado" });
        }

        await run(
            `UPDATE tickets SET 
                cancellation_requested = 1,
                cancellation_reason = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [reason || "El usuario ya no necesita atención", id]
        );

        const updatedTicket = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        res.json({ 
            message: "Solicitud de cancelación enviada al administrador",
            ticket: updatedTicket[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancelar ticket (admin)
router.post("/:id/cancel", async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_comment } = req.body;
        
        const existing = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Ticket no encontrado" });
        }
        
        const ticket = existing[0];
        
        if (ticket.status === 'completed') {
            return res.status(400).json({ error: "Este ticket ya ha sido completado" });
        }

        await run(
            `UPDATE tickets SET 
                status = 'cancelled',
                admin_comment = ?,
                closed_by_admin = 1,
                closed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [admin_comment || "Cancelado por administrador", id]
        );

        const updatedTicket = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        res.json({ 
            message: "Ticket cancelado exitosamente",
            ticket: updatedTicket[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Completar ticket (admin)
router.post("/:id/complete", async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_comment } = req.body;
        
        const existing = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: "Ticket no encontrado" });
        }

        await run(
            `UPDATE tickets SET 
                status = 'completed',
                admin_comment = ?,
                closed_by_admin = 1,
                closed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [admin_comment || "Ticket completado", id]
        );

        const updatedTicket = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        res.json({ 
            message: "Ticket completado exitosamente",
            ticket: updatedTicket[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar ticket (solo admin)
router.delete("/:id", async (req, res) => {
    try {
        const result = await run("DELETE FROM tickets WHERE id = ?", [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Ticket no encontrado" });
        }
        res.json({ message: "Ticket eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Obtener tickets de un técnico específico
router.get("/technician/:technicianId", async (req, res) => {
    try {
        const tickets = await query(
            `SELECT * FROM tickets 
             WHERE assigned_technician_id = ? 
             AND status != 'completed' 
             AND status != 'cancelled'
             ORDER BY 
                 CASE 
                     WHEN status = 'pending' THEN 1
                     WHEN status = 'assigned' THEN 2
                     WHEN status = 'in_progress' THEN 3
                 END,
                 created_at DESC`,
            [req.params.technicianId]
        );
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Asignar ticket a un técnico
router.put("/:id/assign-technician", async (req, res) => {
    try {
        const { id } = req.params;
        const { technician_id, technician_name } = req.body;
        
        await run(
            `UPDATE tickets SET 
                assigned_technician_id = ?,
                assigned_to = ?,
                status = 'assigned',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [technician_id, technician_name, id]
        );
        
        const updatedTicket = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        res.json(updatedTicket[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar progreso del ticket (técnico)
router.put("/:id/update-progress", async (req, res) => {
    try {
        const { id } = req.params;
        const { progress_percentage, status, technician_comments } = req.body;
        
        await run(
            `UPDATE tickets SET 
                progress_percentage = ?,
                status = ?,
                technician_comments = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [progress_percentage, status, technician_comments, id]
        );
        
        const updatedTicket = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        res.json(updatedTicket[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Completar ticket (técnico)
router.put("/:id/complete-by-technician", async (req, res) => {
    try {
        const { id } = req.params;
        const { technician_comments } = req.body;
        
        await run(
            `UPDATE tickets SET 
                status = 'completed',
                progress_percentage = 100,
                technician_comments = ?,
                closed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [technician_comments, id]
        );
        
        const updatedTicket = await query("SELECT * FROM tickets WHERE id = ?", [id]);
        res.json(updatedTicket[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los técnicos disponibles
router.get("/technicians/list", async (req, res) => {
    try {
        const technicians = await query(`
            SELECT t.*, u.full_name as user_name 
            FROM technicians t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.is_active = 1
            ORDER BY t.name
        `);
        res.json(technicians);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Obtener tickets según el rol del usuario
router.get("/by-role/:role/:userId", async (req, res) => {
    try {
        const { role, userId } = req.params;
        let queryStr = "";
        let params = [];
        
        if (role === 'admin') {
            // Admin ve todos los tickets (excepto los que él eliminó)
            queryStr = `
                SELECT * FROM tickets 
                WHERE deleted_by_admin = 0
                ORDER BY 
                    CASE 
                        WHEN status = 'pending' THEN 1
                        WHEN status = 'assigned' THEN 2
                        WHEN status = 'in_progress' THEN 3
                        WHEN status = 'completed' THEN 4
                        WHEN status = 'archived' THEN 5
                    END,
                    created_at DESC
            `;
        } else if (role === 'tecnico') {
            // Técnico ve tickets asignados a él o no eliminados por él
            queryStr = `
                SELECT * FROM tickets 
                WHERE (assigned_to = ? OR assigned_to IS NULL)
                AND deleted_by_technician = 0
                ORDER BY 
                    CASE 
                        WHEN status = 'pending' THEN 1
                        WHEN status = 'assigned' THEN 2
                        WHEN status = 'in_progress' THEN 3
                        WHEN status = 'completed' THEN 4
                        WHEN status = 'archived' THEN 5
                    END,
                    created_at DESC
            `;
            params = [userId];
        } else {
            // Usuario ve sus propios tickets
            queryStr = `
                SELECT * FROM tickets 
                WHERE user_id = ?
                AND deleted_by_user = 0
                ORDER BY created_at DESC
            `;
            params = [userId];
        }
        
        const tickets = await query(queryStr, params);
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ocultar ticket para un rol específico (eliminar de su vista)
router.put("/:id/hide-for-role", async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        let field = "";
        if (role === 'admin') field = 'deleted_by_admin';
        else if (role === 'tecnico') field = 'deleted_by_technician';
        else field = 'deleted_by_user';
        
        await run(
            `UPDATE tickets SET ${field} = 1 WHERE id = ?`,
            [id]
        );
        
        // Registrar en auditoría
        await run(
            `INSERT INTO ticket_audit (ticket_id, action, user_id, user_role, details)
             VALUES (?, 'hidden', ?, ?, ?)`,
            [id, req.body.userId || null, role, `Ticket ocultado por ${role}`]
        );
        
        res.json({ message: "Ticket ocultado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restaurar ticket para un rol específico
router.put("/:id/restore-for-role", async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        let field = "";
        if (role === 'admin') field = 'deleted_by_admin';
        else if (role === 'tecnico') field = 'deleted_by_technician';
        else field = 'deleted_by_user';
        
        await run(
            `UPDATE tickets SET ${field} = 0 WHERE id = ?`,
            [id]
        );
        
        res.json({ message: "Ticket restaurado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar permanentemente (solo admin)
router.delete("/:id/permanent", async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que sea admin
        const { role } = req.body;
        if (role !== 'admin') {
            return res.status(403).json({ error: "Solo administradores pueden eliminar permanentemente" });
        }
        
        await run("DELETE FROM tickets WHERE id = ?", [id]);
        res.json({ message: "Ticket eliminado permanentemente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;





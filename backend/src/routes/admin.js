import express from "express";
import { query, run } from "../database/database.js";

const router = express.Router();

router.get("/settings", async (req, res) => {
    try {
        const settings = await query("SELECT * FROM settings WHERE id = 1");
        res.json(settings[0] || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/settings", async (req, res) => {
    try {
        const { email_recipient, email_subject, company_name } = req.body;
        
        await run(
            "UPDATE settings SET email_recipient = ?, email_subject = ?, company_name = ? WHERE id = 1",
            [email_recipient, email_subject, company_name]
        );

        const settings = await query("SELECT * FROM settings WHERE id = 1");
        res.json(settings[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
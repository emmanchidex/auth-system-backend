const pool = require('../config/db');

// CREATE
exports.createSeverity = async (req, res) => {
    console.log("🔵 CREATE SEVERITY HIT");
    console.log("Body:", req.body);

    try {
        const { name, score, description } = req.body;

        const result = await pool.query(
            `INSERT INTO severity_levels (name, score, description)
             VALUES ($1,$2,$3) RETURNING *`,
            [name, score, description]
        );

        console.log("✅ CREATED:", result.rows[0]);

        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("❌ CREATE SEVERITY ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// GET ALL
exports.getSeverities = async (req, res) => {
    console.log("🔵 GET ALL SEVERITIES HIT");

    try {
        const result = await pool.query(
            "SELECT * FROM severity_levels ORDER BY id DESC"
        );

        console.log("📦 FOUND:", result.rows.length);
        console.log("DATA:", result.rows);

        res.json(result.rows);

    } catch (err) {
        console.error("❌ GET SEVERITIES ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// UPDATE
exports.updateSeverity = async (req, res) => {
    console.log("🔵 UPDATE SEVERITY HIT");
    console.log("Params:", req.params);
    console.log("Body:", req.body);

    try {
        const { id } = req.params;
        const { name, score, description } = req.body;

        const result = await pool.query(
            `UPDATE severity_levels
             SET name=$1, score=$2, description=$3
             WHERE id=$4 RETURNING *`,
            [name, score, description, id]
        );

        if (!result.rows.length) {
            console.log("⚠️ NOT FOUND");
            return res.status(404).json({ message: "Not found" });
        }

        console.log("✅ UPDATED:", result.rows[0]);

        res.json(result.rows[0]);

    } catch (err) {
        console.error("❌ UPDATE SEVERITY ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// DELETE
exports.deleteSeverity = async (req, res) => {
    console.log("🔵 DELETE SEVERITY HIT");
    console.log("Params:", req.params);

    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM severity_levels WHERE id=$1 RETURNING *",
            [id]
        );

        if (!result.rows.length) {
            console.log("⚠️ NOT FOUND");
            return res.status(404).json({ message: "Not found" });
        }

        console.log("🗑️ DELETED:", result.rows[0]);

        res.json({ success: true });

    } catch (err) {
        console.error("❌ DELETE SEVERITY ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};
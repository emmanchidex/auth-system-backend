const pool = require('../config/db');

// CREATE
exports.createIncidentType = async (req, res) => {
    console.log("=== CREATE INCIDENT TYPE START ===");
    console.log("Body received:", req.body);

    try {
        const { name, description } = req.body;

        console.log("Inserting into DB:", { name, description });

        const result = await pool.query(
            `INSERT INTO incident_types (name, description)
             VALUES ($1,$2) RETURNING *`,
            [name, description]
        );

        console.log("DB Insert result:", result.rows[0]);
        console.log("=== CREATE INCIDENT TYPE END SUCCESS ===");

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("!!! CREATE INCIDENT TYPE ERROR !!!");
        console.error(error);
        res.status(500).json({
            message: "Failed to create incident type",
            error: error.message
        });
    }
};

// GET ALL
exports.getIncidentTypes = async (req, res) => {
    console.log("=== GET ALL INCIDENT TYPES START ===");

    try {
        const result = await pool.query(
            "SELECT * FROM incident_types ORDER BY id DESC"
        );

        console.log("Rows fetched:", result.rows.length);
        console.log("Data:", result.rows);
        console.log("=== GET ALL INCIDENT TYPES END SUCCESS ===");

        res.json(result.rows);
    } catch (error) {
        console.error("!!! GET ALL INCIDENT TYPES ERROR !!!");
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch incident types",
            error: error.message
        });
    }
};

// UPDATE
exports.updateIncidentType = async (req, res) => {
    console.log("=== UPDATE INCIDENT TYPE START ===");
    console.log("Params:", req.params);
    console.log("Body:", req.body);

    try {
        const { id } = req.params;
        const { name, description } = req.body;

        console.log("Updating ID:", id);

        const result = await pool.query(
            `UPDATE incident_types
             SET name=$1, description=$2
             WHERE id=$3 RETURNING *`,
            [name, description, id]
        );

        console.log("Update result:", result.rows[0]);

        if (!result.rows.length) {
            console.log("No record found to update");
            return res.status(404).json({ message: "Not found" });
        }

        console.log("=== UPDATE INCIDENT TYPE END SUCCESS ===");

        res.json(result.rows[0]);
    } catch (error) {
        console.error("!!! UPDATE INCIDENT TYPE ERROR !!!");
        console.error(error);

        res.status(500).json({
            message: "Failed to update incident type",
            error: error.message
        });
    }
};

// DELETE
exports.deleteIncidentType = async (req, res) => {
    console.log("=== DELETE INCIDENT TYPE START ===");
    console.log("Params:", req.params);

    try {
        const { id } = req.params;

        console.log("Deleting ID:", id);

        await pool.query("DELETE FROM incident_types WHERE id=$1", [id]);

        console.log("Delete completed for ID:", id);
        console.log("=== DELETE INCIDENT TYPE END SUCCESS ===");

        res.json({ success: true });
    } catch (error) {
        console.error("!!! DELETE INCIDENT TYPE ERROR !!!");
        console.error(error);

        res.status(500).json({
            message: "Failed to delete incident type",
            error: error.message
        });
    }
};
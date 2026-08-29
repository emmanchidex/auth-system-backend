const pool = require('../config/db');

// ========================
// CREATE
// ========================
exports.createBranch = async (req, res) => {
    console.log("\n==============================");
    console.log("🔵 CREATE BRANCH HIT");
    console.log("Body:", req.body);
    console.log("==============================");

    try {
        const { name, latitude, longitude } = req.body;

        if (!name || name.trim() === "") {
            console.log("❌ VALIDATION FAILED: Name missing");
            return res.status(400).json({
                success: false,
                message: "Name required"
            });
        }

        console.log("➡️ INSERTING INTO DB:", {
            name: name.trim(),
            latitude,
            longitude
        });

        const result = await pool.query(
            `INSERT INTO branches (name, latitude, longitude)
             VALUES ($1,$2,$3)
             RETURNING *`,
            [name.trim(), latitude ?? null, longitude ?? null]
        );

        console.log("✅ INSERT SUCCESS:", result.rows[0]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error("❌ CREATE BRANCH ERROR:", err);

        if (err.code === "23505") {
            console.log("⚠️ DUPLICATE ENTRY");
            return res.status(400).json({
                success: false,
                message: "Branch already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create branch",
            error: err.message
        });
    }
};

// ========================
// GET ALL
// ========================
exports.getBranches = async (req, res) => {
    console.log("\n==============================");
    console.log("🔵 GET ALL BRANCHES HIT");
    console.log("Query Params:", req.query);
    console.log("==============================");

    try {
        const result = await pool.query(
            "SELECT * FROM branches ORDER BY id DESC"
        );

        console.log("📦 ROW COUNT:", result.rows.length);
        console.log("📦 DATA:", result.rows);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error("❌ GET BRANCHES ERROR:", err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch branches",
            error: err.message
        });
    }
};

// ========================
// UPDATE
// ========================
exports.updateBranch = async (req, res) => {
    console.log("\n==============================");
    console.log("🔵 UPDATE BRANCH HIT");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log("==============================");

    try {
        const { id } = req.params;
        const { name, latitude, longitude } = req.body;

        console.log("➡️ UPDATING ID:", id);

        const result = await pool.query(
            `UPDATE branches
             SET name = COALESCE($1, name),
                 latitude = COALESCE($2, latitude),
                 longitude = COALESCE($3, longitude),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [name ?? null, latitude ?? null, longitude ?? null, id]
        );

        if (!result.rows.length) {
            console.log("⚠️ NOT FOUND");
            return res.status(404).json({
                success: false,
                message: "Branch not found"
            });
        }

        console.log("✅ UPDATE SUCCESS:", result.rows[0]);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error("❌ UPDATE BRANCH ERROR:", err);

        res.status(500).json({
            success: false,
            message: "Failed to update branch",
            error: err.message
        });
    }
};

// ========================
// DELETE
// ========================
exports.deleteBranch = async (req, res) => {
    console.log("\n==============================");
    console.log("🔵 DELETE BRANCH HIT");
    console.log("Params:", req.params);
    console.log("==============================");

    try {
        const { id } = req.params;

        console.log("➡️ DELETING ID:", id);

        const result = await pool.query(
            "DELETE FROM branches WHERE id=$1 RETURNING *",
            [id]
        );

        if (!result.rows.length) {
            console.log("⚠️ NOT FOUND");
            return res.status(404).json({
                success: false,
                message: "Branch not found"
            });
        }

        console.log("🗑️ DELETE SUCCESS:", result.rows[0]);

        res.json({
            success: true,
            message: "Branch deleted"
        });

    } catch (err) {
        console.error("❌ DELETE BRANCH ERROR:", err);

        res.status(500).json({
            success: false,
            message: "Failed to delete branch",
            error: err.message
        });
    }
};
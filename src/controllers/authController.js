const pool = require('../config/db');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/tokenGenerator');

console.log("AUTH CONTROLLER LOADED");

// ========================
// ADMIN LOGIN
// ========================
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM admins WHERE email=$1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                valid: false,
                message: "Invalid credentials"
            });
        }

        const admin = result.rows[0];
        const valid = await bcrypt.compare(password, admin.password_hash);

        if (!valid) {
            return res.status(401).json({
                valid: false,
                message: "Invalid credentials"
            });
        }

        return res.json({
            valid: true,
            message: "Login successful",
            admin: {
                id: admin.id,
                email: admin.email
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            valid: false,
            message: "Internal server error"
        });
    }
};


// ========================
// CREATE STUDENT
// ========================
exports.createStudent = async (req, res) => {

    console.log("🟢 CREATE STUDENT CONTROLLER HIT");

    try {
        console.log("🔵 STEP 0: Entered try block");

        const { registration_number } = req.body;

        console.log("🔵 STEP 1: Request body received:", req.body);
        console.log("🔵 STEP 2: registration_number =", registration_number);

        if (!registration_number) {
            console.log("❌ STEP 3: Missing registration_number");

            return res.status(400).json({
                success: false,
                message: "Registration number is required"
            });
        }

        console.log("🟡 STEP 4: Checking if student already exists...");

        const existing = await pool.query(
            "SELECT * FROM students WHERE registration_number = $1",
            [registration_number]
        );

        console.log("🟡 STEP 5: Existing query completed");
        console.log("🟡 STEP 6: existing.rows =", existing.rows);

        // ========================
        // ✅ IF STUDENT EXISTS
        // ========================
        if (existing.rows.length > 0) {
            console.log("🟡 STEP 7: Student already exists");

            const student = existing.rows[0];

            return res.status(200).json({
                success: true,
                status: "EXISTING",
                message: "Student already existing",
                student: {
                    registration_number: student.registration_number,
                    access_token: student.access_token
                }
            });
        }

        // ========================
        // ✅ IF NEW STUDENT
        // ========================
        console.log("🟢 STEP 8: Generating token...");

        const token = generateToken();
        console.log("🔑 STEP 9: GENERATED TOKEN:", token);

        console.log("🟣 STEP 10: Inserting student into database...");

        const result = await pool.query(
            `INSERT INTO students (registration_number, access_token)
             VALUES ($1, $2)
             RETURNING *`,
            [registration_number, token]
        );

        console.log("🟣 STEP 11: Insert completed");
        console.log("🟣 STEP 12: DB result:", result.rows);

        const student = result.rows[0];

        console.log("🟢 STEP 13: Preparing response");

        return res.status(201).json({
            success: true,
            status: "NEW",
            message: "New student created",
            student: {
                registration_number: student.registration_number,
                access_token: student.access_token
            }
        });

    } catch (err) {
        console.error("🔥 ERROR CAUGHT IN createStudent:");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


exports.getStudents = async (req, res) => {
    try {
        console.log("🔥 GET STUDENTS HIT");

        const result = await pool.query(
            "SELECT id, registration_number, access_token, created_at FROM students ORDER BY id DESC"
        );

        return res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        console.error("🔥 ERROR GETTING STUDENTS:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        console.log("🔥 DELETE STUDENT HIT → id =", id);

        const result = await pool.query(
            "DELETE FROM students WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        return res.json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (err) {
        console.error("🔥 DELETE ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
exports.createSecurity = async (req, res) => {
    console.log("🔥 CREATE SECURITY HIT");
    console.log("BODY RECEIVED:", req.body);

    try {
        const { security_number, branch_id } = req.body;

        console.log("➡️ security_number =", security_number);
        console.log("➡️ branch_id =", branch_id);

        if (!security_number || !branch_id) {
            console.log("❌ Missing fields");

            return res.status(400).json({
                success: false,
                message: "security_number and branch_id are required"
            });
        }

        console.log("🔍 Checking existing security...");

        const existing = await pool.query(
            "SELECT * FROM security WHERE security_number = $1",
            [security_number]
        );

        console.log("📦 Existing rows:", existing.rows);

        if (existing.rows.length > 0) {
            const security = existing.rows[0];

            console.log("⚠️ Security already exists:", security);

            return res.status(200).json({
                success: true,
                status: "EXISTING",
                message: "Security already exists",
                security: {
                    security_id: security.id,
                    security_number: security.security_number,
                    branch_id: security.branch_id,
                    access_token: security.access_token,
                    created_at: security.created_at
                }
            });
        }

        console.log("🆕 Creating new security...");

        const token = generateToken();
        console.log("🔑 Generated token:", token);

        const result = await pool.query(
            `INSERT INTO security (security_number, branch_id, access_token)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [security_number, branch_id, token]
        );

        console.log("💾 Insert result:", result.rows);

        const security = result.rows[0];

        console.log("✅ New security created:", security);

        return res.status(201).json({
            success: true,
            status: "NEW",
            message: "Security created successfully",
            security: {
                security_id: security.id,
                security_number: security.security_number,
                branch_id: security.branch_id,
                access_token: security.access_token,
                created_at: security.created_at
            }
        });

    } catch (err) {
        console.log("🔥 CREATE SECURITY ERROR");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.toggleSecurityStatus = async (req, res) => {
    console.log("🔥 TOGGLE SECURITY HIT");
    console.log("PARAMS:", req.params);

    try {
        const { id } = req.params;

        console.log("➡️ ID received:", id);

        const current = await pool.query(
            "SELECT status FROM security WHERE id = $1",
            [id]
        );

        console.log("📦 Current row:", current.rows);

        if (current.rows.length === 0) {
            console.log("❌ Security NOT FOUND");

            return res.status(404).json({
                success: false,
                message: "Security not found"
            });
        }

        const newStatus =
            current.rows[0].status === "available"
                ? "unavailable"
                : "available";

        console.log("🔄 New status will be:", newStatus);

        const result = await pool.query(
            "UPDATE security SET status = $1 WHERE id = $2 RETURNING *",
            [newStatus, id]
        );

        console.log("💾 Updated row:", result.rows[0]);

        return res.status(200).json({
            success: true,
            security: result.rows[0]
        });

    } catch (err) {
        console.log("🔥 TOGGLE ERROR");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.getAllSecurity = async (req, res) => {
    console.log("🔥 GET ALL SECURITY HIT");

    try {
        const result = await pool.query(
            "SELECT * FROM security ORDER BY created_at DESC"
        );

        console.log("📦 RAW DB ROWS:", result.rows);

        const formatted = result.rows.map(s => ({
            security_id: s.id,              // 🔥 FIX IS HERE
            security_number: s.security_number,
            branch_id: s.branch_id,
            access_token: s.access_token,
            status: s.status,
            created_at: s.created_at
        }));

        console.log("📦 FORMATTED RESPONSE:", formatted);
        console.log("📊 COUNT:", formatted.length);

        return res.status(200).json({
            success: true,
            data: formatted
        });

    } catch (err) {
        console.log("🔥 GET ALL ERROR");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

exports.deleteSecurity = async (req, res) => {
    console.log("🔥 DELETE SECURITY HIT");
    console.log("PARAMS:", req.params);

    try {
        const { id } = req.params;

        console.log("➡️ ID received:", id);

        const result = await pool.query(
            "DELETE FROM security WHERE id = $1 RETURNING *",
            [id]
        );

        console.log("📦 Deleted row:", result.rows);

        if (result.rows.length === 0) {
            console.log("❌ SECURITY NOT FOUND");

            return res.status(404).json({
                success: false,
                message: "Security not found"
            });
        }

        console.log("✅ DELETE SUCCESS");

        return res.status(200).json({
            success: true,
            message: "Security deleted successfully"
        });

    } catch (err) {
        console.log("🔥 DELETE ERROR");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// ========================
// STUDENT LOGIN
// ========================
exports.studentLogin = async (req, res) => {
    try {
        const { registration_number, access_token } = req.body;

        const result = await pool.query(
            `SELECT * FROM students 
             WHERE registration_number=$1 AND access_token=$2`,
            [registration_number, access_token]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        return res.json({
            success: true,
            message: "Student login successful"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// ========================
// SECURITY LOGIN
// ========================
exports.securityLogin = async (req, res) => {
    console.log("🔥 SECURITY LOGIN CONTROLLER HIT");
    console.log("📦 RAW BODY:", req.body);

    try {
        const {
            security_number,
            branch,
            branch_id,
            access_token
        } = req.body;

        const finalBranchId = branch_id ?? branch;

        console.log("➡️ security_number:", security_number);
        console.log("➡️ branch:", branch);
        console.log("➡️ branch_id:", branch_id);
        console.log("➡️ FINAL branch_id USED:", finalBranchId);
        console.log("➡️ access_token:", access_token);

        const result = await pool.query(
            `SELECT * FROM security 
             WHERE security_number = $1 
             AND branch_id = $2 
             AND access_token = $3`,
            [
                security_number,
                Number(finalBranchId), // 🔥 IMPORTANT
                access_token.trim()
            ]
        );

        console.log("📦 QUERY RESULT ROWS:", result.rows);

        if (result.rows.length === 0) {
            console.log("❌ NO MATCH FOUND");
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        console.log("✅ LOGIN SUCCESS");

        return res.json({
            success: true,
            message: "Security login successful"
        });

    } catch (err) {
        console.log("🔥 LOGIN ERROR");
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// ========================
// TEST DB
// ========================
exports.testDb = async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "DB is working",
            time: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "DB error"
        });
    }
};
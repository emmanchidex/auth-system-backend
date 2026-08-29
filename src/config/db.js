// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
    user: "postgres.xpvmfnamehcqbnpeewgl",
    host: "aws-0-eu-central-1.pooler.supabase.com",
    database: "postgres",
    password: "Abaalert4190",
    port: 5432,
     ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;
/*
// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "alert_system",
    password: "123456",
    port: 5432,
});

module.exports = pool;
*/
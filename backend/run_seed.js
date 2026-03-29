require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seed() {
    try {
        console.log("Connecting to MySQL to automatically insert the Expected Assignment Data...");
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Bhawika@123',
            database: process.env.DB_NAME || 'taskverse',
            multipleStatements: true // Allows running an entire .sql file at once
        });

        const scriptPath = path.join(__dirname, 'seed.sql');
        const script = fs.readFileSync(scriptPath).toString();

        await connection.query(script);
        console.log("✅ Expected Result perfectly seeded into the 'taskverse' database!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}
seed();

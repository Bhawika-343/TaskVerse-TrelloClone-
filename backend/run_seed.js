const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seed() {
    try {
        console.log("Connecting to MySQL to automatically insert the Expected Assignment Data...");
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Bhawika@123',
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

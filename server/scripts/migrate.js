const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    user: 'postgres',
    password: 'password', // Default, should effectively be loaded from env or handled better if complex
    host: 'localhost',
    port: 5432,
    database: 'postgres', // Connect to default DB first
};

// Parse DATABASE_URL if available to get credentials
if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    dbConfig.user = url.username;
    dbConfig.password = url.password;
    dbConfig.host = url.hostname;
    dbConfig.port = url.port;
    // We ignore database name from URL initially to connect to 'postgres'
}

async function migrate() {
    // 1. Create Database if not exists
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'hospital_db'");
        if (res.rowCount === 0) {
            console.log("Creating database hospital_db...");
            await client.query("CREATE DATABASE hospital_db");
        } else {
            console.log("Database hospital_db already exists.");
        }
    } catch (err) {
        console.error("Error checking/creating database:", err);
        process.exit(1);
    } finally {
        await client.end();
    }

    // 2. Run Schema
    const targetDbConfig = { ...dbConfig, database: 'hospital_db' };
    const targetClient = new Client(targetDbConfig);

    try {
        await targetClient.connect();
        console.log("Connected to hospital_db.");

        const schemaPath = path.join(__dirname, '../db_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Executing schema...");
        await targetClient.query(schemaSql);
        console.log("Schema executed successfully.");
    } catch (err) {
        console.error("Error executing schema:", err);
    } finally {
        await targetClient.end();
    }
}

migrate();

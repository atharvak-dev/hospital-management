// Migration script to add missing foreign key indexes
// Run with: node migrations/run_add_fk_indexes.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id)',
    'CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id)',
    'CREATE INDEX IF NOT EXISTS idx_prescription_items_medicine ON prescription_items(medicine_id)',
    'CREATE INDEX IF NOT EXISTS idx_test_reports_patient ON test_reports(patient_id)',
    'CREATE INDEX IF NOT EXISTS idx_test_reports_visit ON test_reports(visit_id)',
    'CREATE INDEX IF NOT EXISTS idx_test_recommendations_visit ON test_recommendations(visit_id)',
    'CREATE INDEX IF NOT EXISTS idx_patient_family_members_family ON patient_family_members(family_id)',
    'CREATE INDEX IF NOT EXISTS idx_patient_family_members_patient ON patient_family_members(patient_id)',
    'CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_appointment_queue_appointment ON appointment_queue(appointment_id)'
];

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting index migration...\n');

        for (const sql of indexes) {
            const indexName = sql.match(/idx_\w+/)[0];
            try {
                await client.query(sql);
                console.log(`✅ Created: ${indexName}`);
            } catch (err) {
                console.log(`⚠️  ${indexName}: ${err.message}`);
            }
        }

        // Verify indexes
        console.log('\n📋 Verifying indexes...');
        const result = await client.query(`
            SELECT indexname, tablename 
            FROM pg_indexes 
            WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname
        `);

        console.log(`\n✅ Total indexes: ${result.rows.length}`);
        console.log('\n🎉 Migration completed successfully!');

    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});

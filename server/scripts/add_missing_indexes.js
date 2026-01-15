const pool = require('../config/db');

const addMissingIndexes = async () => {
    const client = await pool.pool.connect();
    try {
        console.log('Starting index creation...');

        const indexes = [
            // Critical for Invoice deletion/updates
            `CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)`,

            // Critical for Prescription queries and deletes
            `CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id)`,

            // Critical for Test Reports and Patient history
            `CREATE INDEX IF NOT EXISTS idx_test_reports_patient_id ON test_reports(patient_id)`,
            `CREATE INDEX IF NOT EXISTS idx_test_reports_visit_id ON test_reports(visit_id)`,

            // Visit related child tables
            `CREATE INDEX IF NOT EXISTS idx_test_reqs_visit_id ON test_recommendations(visit_id)`,

            // Family linking performance
            `CREATE INDEX IF NOT EXISTS idx_fam_members_family_id ON patient_family_members(family_id)`,
            `CREATE INDEX IF NOT EXISTS idx_fam_members_patient_id ON patient_family_members(patient_id)`,

            // Activity Logs (often queried by user or record)
            `CREATE INDEX IF NOT EXISTS idx_activity_logs_record_id ON activity_logs(record_id)`
        ];

        for (const query of indexes) {
            await client.query(query);
            console.log(`Executed: ${query}`);
        }

        console.log('All indexes added successfully.');
    } catch (err) {
        console.error('Error adding indexes:', err);
    } finally {
        client.release();
        process.exit(); // Exit script
    }
};

addMissingIndexes();

-- Migration: Add missing foreign key indexes
-- Run this on your existing database to apply the new indexes
-- These indexes are critical for production performance

-- Invoice Items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Prescription Items
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_medicine ON prescription_items(medicine_id);

-- Test Reports
CREATE INDEX IF NOT EXISTS idx_test_reports_patient ON test_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_visit ON test_reports(visit_id);

-- Test Recommendations
CREATE INDEX IF NOT EXISTS idx_test_recommendations_visit ON test_recommendations(visit_id);

-- Patient Family Members
CREATE INDEX IF NOT EXISTS idx_patient_family_members_family ON patient_family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_patient_family_members_patient ON patient_family_members(patient_id);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);

-- Appointment Queue
CREATE INDEX IF NOT EXISTS idx_appointment_queue_appointment ON appointment_queue(appointment_id);

-- Verify indexes were created
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

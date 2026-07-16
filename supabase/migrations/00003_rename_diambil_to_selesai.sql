-- Migration: Rename 'Diambil' status to 'Selesai'
-- Date: 2026-07-16

-- Update applications
UPDATE applications 
SET status = 'Selesai', updated_at = NOW() 
WHERE status = 'Diambil';

-- Update status history
UPDATE status_history 
SET status = 'Selesai' 
WHERE status = 'Diambil';

-- Update notes text
UPDATE status_history 
SET notes = REPLACE(REPLACE(notes, 'diambil oleh pemohon', 'selesai diproses'), 'diambil', 'selesai') 
WHERE notes ILIKE '%diambil%';

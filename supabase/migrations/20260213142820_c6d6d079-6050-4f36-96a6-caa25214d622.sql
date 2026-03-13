
-- Add latitude/longitude to lectures for location-based attendance
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.lectures ADD COLUMN IF NOT EXISTS longitude double precision;

-- Add device_fingerprint to attendance_records for device-based duplicate prevention
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS device_fingerprint text;

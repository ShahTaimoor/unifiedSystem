-- Migration 075: Add social media and contact visibility fields to settings
ALTER TABLE settings
ADD COLUMN whatsapp_number VARCHAR(100),
ADD COLUMN facebook_link VARCHAR(1000),
ADD COLUMN instagram_link VARCHAR(1000),
ADD COLUMN tiktok_link VARCHAR(1000),
ADD COLUMN map_location TEXT,
ADD COLUMN show_whatsapp BOOLEAN DEFAULT TRUE,
ADD COLUMN show_facebook BOOLEAN DEFAULT TRUE,
ADD COLUMN show_instagram BOOLEAN DEFAULT TRUE,
ADD COLUMN show_tiktok BOOLEAN DEFAULT TRUE,
ADD COLUMN show_map_location BOOLEAN DEFAULT TRUE,
ADD COLUMN show_contact_info BOOLEAN DEFAULT TRUE;

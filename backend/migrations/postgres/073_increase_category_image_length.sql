-- Migration 073: Increase category image length to support Cloudinary URLs
ALTER TABLE categories ALTER COLUMN image TYPE TEXT;

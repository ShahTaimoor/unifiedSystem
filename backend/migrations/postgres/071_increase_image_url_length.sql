-- Migration 071: Increase image_url length to support Cloudinary URLs
ALTER TABLE products ALTER COLUMN image_url TYPE TEXT;
ALTER TABLE product_variants ALTER COLUMN image_url TYPE TEXT;

-- Migration: Add city column to customers table
-- This allows storefront customers to save their city for shipping

ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(255);

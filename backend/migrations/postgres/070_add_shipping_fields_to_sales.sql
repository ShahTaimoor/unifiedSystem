-- Migration to add shipping fields to sales_orders and sales tables
-- Created at 2026-05-07

-- Add columns to sales_orders
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(50);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);

-- Add columns to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);

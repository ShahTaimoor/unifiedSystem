-- Migration: Allow NULL created_by in sales_orders for storefront orders
-- Storefront customer orders are self-placed and have no admin user as creator

ALTER TABLE sales_orders ALTER COLUMN created_by DROP NOT NULL;

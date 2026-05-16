-- Migration 074: Add shipping_name to sales_orders
-- Stores the customer's display name at the time of ecommerce order placement
-- so the "Bill To" section on prints always shows the correct name.

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS shipping_name TEXT;

COMMENT ON COLUMN sales_orders.shipping_name IS
  'Customer display name at order time (used for ecommerce orders where customer is auto-created)';

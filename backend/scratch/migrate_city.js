const { query } = require('../config/postgres');

async function migrate() {
  try {
    const sql = `
      UPDATE customers 
      SET city = COALESCE(
        city, 
        CASE 
          WHEN jsonb_typeof(address) = 'object' THEN address->>'city' 
          WHEN jsonb_typeof(address) = 'array' AND jsonb_array_length(address) > 0 THEN (address->0)->>'city' 
        END
      ) 
      WHERE city IS NULL
    `;
    await query(sql);
    console.log('Migration completed');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();

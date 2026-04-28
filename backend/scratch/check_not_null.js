const { query } = require('../config/postgres');

async function checkNotNull() {
  try {
    const result = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_orders' AND is_nullable = 'NO'");
    console.log('NOT NULL Columns:', result.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkNotNull();

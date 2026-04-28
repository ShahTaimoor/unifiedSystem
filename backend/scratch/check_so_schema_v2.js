const { query } = require('../config/postgres');

async function checkSchema() {
  try {
    const result = await query("SELECT column_name, ordinal_position FROM information_schema.columns WHERE table_name = 'sales_orders' ORDER BY ordinal_position");
    console.log('Columns:', JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSchema();

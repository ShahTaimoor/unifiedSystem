const { query } = require('../config/postgres');

async function checkSchema() {
  try {
    const result = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales_orders'");
    console.log('Columns:', JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSchema();

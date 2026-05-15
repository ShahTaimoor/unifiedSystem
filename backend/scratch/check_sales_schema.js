const { query } = require('../config/postgres');

async function checkSalesSchema() {
  try {
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales'
    `);
    console.log('Columns in sales:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error('Error checking sales schema:', error);
  } finally {
    process.exit();
  }
}

checkSalesSchema();

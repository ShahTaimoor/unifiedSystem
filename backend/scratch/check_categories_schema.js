const { query } = require('../config/postgres');

async function checkCategoriesSchema() {
  try {
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'categories'
    `);
    console.log('Columns in categories:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error('Error checking categories schema:', error);
  } finally {
    process.exit();
  }
}

checkCategoriesSchema();

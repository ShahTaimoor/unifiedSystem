const { query } = require('../config/postgres');

async function check() {
  try {
    const products = await query('SELECT id, name, image_url FROM products LIMIT 5');
    console.log('Products:', JSON.stringify(products.rows, null, 2));

    const categories = await query('SELECT id, name, image FROM categories LIMIT 5');
    console.log('Categories:', JSON.stringify(categories.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();

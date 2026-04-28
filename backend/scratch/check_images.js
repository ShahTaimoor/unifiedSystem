const { query } = require('../config/postgres');

async function check() {
  try {
    const products = await query('SELECT COUNT(*) FROM products WHERE image_url IS NOT NULL');
    console.log('Products with image_url:', products.rows[0].count);

    const categories = await query('SELECT COUNT(*) FROM categories WHERE image IS NOT NULL');
    console.log('Categories with image:', categories.rows[0].count);

    const sample = await query('SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL LIMIT 5');
    console.log('Sample products with images:', JSON.stringify(sample.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();

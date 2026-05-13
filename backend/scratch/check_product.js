const { query } = require('../config/postgres');

async function checkProduct() {
  try {
    const res = await query("SELECT id, name, image_url FROM products WHERE name ILIKE '%dark-blue T-shirt%'");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkProduct();

const { query } = require('../config/postgres');

async function fixEncodedUrls() {
  try {
    console.log('Fetching products with encoded URLs...');
    const res = await query("SELECT id, name, image_url FROM products WHERE image_url LIKE '%&#x2F;%'");
    console.log(`Found ${res.rows.length} products to fix.`);

    for (const row of res.rows) {
      const decodedUrl = row.image_url.replace(/&#x2F;/g, '/');
      console.log(`Fixing product ${row.name}: ${row.image_url} -> ${decodedUrl}`);
      await query("UPDATE products SET image_url = $1 WHERE id = $2", [decodedUrl, row.id]);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixEncodedUrls();

const { query } = require('../../config/postgres');

const DEFAULT_ID = 'company_settings';

class SettingsRepository {
  async getSettings() {
    const result = await query(
      'SELECT * FROM settings WHERE id = $1 LIMIT 1',
      [DEFAULT_ID]
    );
    let row = result.rows[0];
    if (!row) {
      const insert = await query(
        `INSERT INTO settings (id, company_name, contact_number, address, created_at, updated_at)
         VALUES ($1, 'Zaryab Traders New 2024', '+1 (555) 123-4567', '123 Business Street, City, State, ZIP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO NOTHING
         RETURNING *`,
        [DEFAULT_ID]
      );
      row = insert.rows[0];
      if (!row) {
        const retry = await query('SELECT * FROM settings WHERE id = $1 LIMIT 1', [DEFAULT_ID]);
        row = retry.rows[0];
      }
    }

    if (!row) return null;

    const cleanStrVal = (val) => {
      if (val === null || val === undefined || String(val).trim().toLowerCase() === 'null') return '';
      return String(val).trim();
    };

    // Transform snake_case to camelCase for frontend compatibility
    return {
      id: row.id,
      companyName: cleanStrVal(row.company_name),
      contactNumber: cleanStrVal(row.contact_number),
      address: cleanStrVal(row.address),
      logo: cleanStrVal(row.logo),
      email: cleanStrVal(row.email),
      website: cleanStrVal(row.website),
      taxId: cleanStrVal(row.tax_id),
      registrationNumber: cleanStrVal(row.registration_number),
      currency: cleanStrVal(row.currency),
      dateFormat: cleanStrVal(row.date_format),
      timeFormat: cleanStrVal(row.time_format),
      fiscalYearStart: cleanStrVal(row.fiscal_year_start),
      taxEnabled: row.tax_enabled === true,
      defaultTaxRate: row.default_tax_rate != null ? parseFloat(row.default_tax_rate) : 0,
      printSettings: typeof row.print_settings === 'string' ? JSON.parse(row.print_settings) : (row.print_settings || {}),
      orderSettings: typeof row.order_settings === 'string' ? JSON.parse(row.order_settings || '{}') : (row.order_settings || {}),
      whatsappNumber: cleanStrVal(row.whatsapp_number),
      facebookLink: cleanStrVal(row.facebook_link),
      instagramLink: cleanStrVal(row.instagram_link),
      tiktokLink: cleanStrVal(row.tiktok_link),
      mapLocation: cleanStrVal(row.map_location),
      showWhatsapp: row.show_whatsapp !== false,
      showFacebook: row.show_facebook !== false,
      showInstagram: row.show_instagram !== false,
      showTiktok: row.show_tiktok !== false,
      showMapLocation: row.show_map_location !== false,
      showContactInfo: row.show_contact_info !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async updateSettings(updates) {
    const settings = await this.getSettings();
    if (!settings) throw new Error('Settings not found');

    const map = {
      companyName: 'company_name',
      contactNumber: 'contact_number',
      address: 'address',
      logo: 'logo',
      email: 'email',
      website: 'website',
      taxId: 'tax_id',
      registrationNumber: 'registration_number',
      currency: 'currency',
      dateFormat: 'date_format',
      timeFormat: 'time_format',
      fiscalYearStart: 'fiscal_year_start',
      taxEnabled: 'tax_enabled',
      defaultTaxRate: 'default_tax_rate',
      printSettings: 'print_settings',
      orderSettings: 'order_settings',
      whatsappNumber: 'whatsapp_number',
      facebookLink: 'facebook_link',
      instagramLink: 'instagram_link',
      tiktokLink: 'tiktok_link',
      mapLocation: 'map_location',
      showWhatsapp: 'show_whatsapp',
      showFacebook: 'show_facebook',
      showInstagram: 'show_instagram',
      showTiktok: 'show_tiktok',
      showMapLocation: 'show_map_location',
      showContactInfo: 'show_contact_info'
    };
    const setClauses = [];
    const params = [];
    let paramCount = 1;
    for (const [k, col] of Object.entries(map)) {
      if (updates[k] !== undefined) {
        let val = updates[k];
        if (typeof val === 'string' && val.trim().toLowerCase() === 'null') {
          val = '';
        }
        setClauses.push(`${col} = $${paramCount++}`);
        params.push(typeof val === 'object' ? JSON.stringify(val) : val);
      }
    }
    if (setClauses.length === 0) return settings;
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    params.push(DEFAULT_ID);
    const result = await query(
      `UPDATE settings SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );
    
    // Return transformed settings
    return await this.getSettings();
  }
}

module.exports = new SettingsRepository();

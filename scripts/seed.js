#!/usr/bin/env node

require('dotenv').config();

const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    // Check if organization exists
    const orgCheck = await pool.query('SELECT id FROM organizations LIMIT 1');
    let orgId;

    if (orgCheck.rows.length === 0) {
      const orgResult = await pool.query(
        `INSERT INTO organizations (name, contact_info, industry, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING id`,
        ['Test Organization', JSON.stringify({ phone: '555-0000' }), 'Technology']
      );
      orgId = orgResult.rows[0].id;
      console.log(`✓ Created organization with ID ${orgId}`);
    } else {
      orgId = orgCheck.rows[0].id;
      console.log(`✓ Using existing organization with ID ${orgId}`);
    }

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123456', salt);
    const clientHash = await bcrypt.hash('testuser123', salt);
    const auditorHash = await bcrypt.hash('auditor123456', salt);

    // Create admin user
    const adminResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, organization_id, full_name, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, role`,
      ['admin@example.com', adminHash, 'admin', orgId, 'Admin User']
    );

    if (adminResult.rows.length > 0) {
      console.log(`✓ Created admin user: admin@example.com (password: admin123456)`);
    } else {
      console.log('✓ Admin user already exists');
    }

    // Create test client user
    const clientResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, organization_id, full_name, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, role`,
      ['testuser@example.com', clientHash, 'client', orgId, 'Test User']
    );

    if (clientResult.rows.length > 0) {
      console.log(`✓ Created client user: testuser@example.com (password: testuser123)`);
    } else {
      console.log('✓ Client user already exists');
    }

    // Create auditor user
    const auditorResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, organization_id, full_name, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, role`,
      ['auditor@example.com', auditorHash, 'auditor', orgId, 'Auditor User']
    );

    if (auditorResult.rows.length > 0) {
      console.log(`✓ Created auditor user: auditor@example.com (password: auditor123456)`);
    } else {
      console.log('✓ Auditor user already exists');
    }

    console.log('\n✓ Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();

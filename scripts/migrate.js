#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const runMigration = async () => {
  try {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    if (!schema.trim()) {
      throw new Error('schema.sql is empty');
    }

    console.log('Running migration...');
    console.log(`Reading schema from: ${schemaPath}`);

    await pool.query(schema);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

runMigration();

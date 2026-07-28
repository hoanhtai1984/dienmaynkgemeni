const { execSync } = require('child_process');
const path = require('path');
const mysql = require('mysql2/promise');
const { TEST_DB_NAME, TEST_DATABASE_URL, JWT_SECRET, CLIENT_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

// Runs once before the whole test run (in the main Jest process, before
// worker processes are forked - they inherit this process.env). Drops and
// recreates a dedicated dienmaynk_test database, migrates it, and seeds it,
// so every test run starts from the exact same known state regardless of
// what's in the dev database.
module.exports = async function globalSetup() {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.CLIENT_URL = CLIENT_URL;
  process.env.ADMIN_EMAIL = ADMIN_EMAIL;
  process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;

  const connection = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: '' });
  await connection.query(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
  await connection.query(`CREATE DATABASE \`${TEST_DB_NAME}\``);
  await connection.end();

  const cwd = path.join(__dirname, '..');
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };
  execSync('npx prisma migrate deploy', { cwd, env, stdio: 'inherit' });
  execSync('node prisma/seed.js', { cwd, env, stdio: 'inherit' });
};

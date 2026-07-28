const TEST_DB_NAME = 'dienmaynk_test';

// Shared by globalSetup (provisions the DB once, in the main Jest process)
// and setupEnv (re-asserts these same values in every test-file worker
// process before that file's own top-level requires run) - both need to
// agree on the exact same values.
module.exports = {
  TEST_DB_NAME,
  TEST_DATABASE_URL: `mysql://root:@localhost:3306/${TEST_DB_NAME}`,
  JWT_SECRET: 'test-secret-do-not-use-in-production',
  CLIENT_URL: 'http://localhost:5173',
  ADMIN_EMAIL: 'admin@test.local',
  ADMIN_PASSWORD: 'admintest123',
};

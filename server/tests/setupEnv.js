const { TEST_DATABASE_URL, JWT_SECRET, CLIENT_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = require('./testEnv');

// Runs before each test file's own top-level requires - must set these
// before any test file does `require('../src/app')`, since routes/
// controllers read process.env.JWT_SECRET etc. at call time, and Prisma's
// client reads process.env.DATABASE_URL when constructed.
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = JWT_SECRET;
process.env.CLIENT_URL = CLIENT_URL;
process.env.ADMIN_EMAIL = ADMIN_EMAIL;
process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;

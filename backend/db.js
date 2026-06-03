const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const originalQuery = pool.query.bind(pool);
pool.query = async (text, params) => {
  let pgText = text;
  if (params && params.length > 0) {
    let index = 1;
    pgText = text.replace(/\?/g, () => {
      const res = '\$' + index;
      index++;
      return res;
    });
  }

  pgText = pgText.replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP');

  try {
    const res = await originalQuery(pgText, params);
    return [res.rows, res.fields];
  } catch (err) {
    console.error('Database Query Error:', err.message);
    console.error('SQL:', pgText);
    console.error('Params:', params);
    throw err;
  }
};

module.exports = pool;
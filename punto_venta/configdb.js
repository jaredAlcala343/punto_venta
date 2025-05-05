import sql from 'mssql';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

let pool;

export async function getConnection() {
  if (pool) return pool;
  
  try {
    pool = await new sql.ConnectionPool(config).connect();
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}
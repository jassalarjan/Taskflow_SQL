import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbHost = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
const dbPort = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);
const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'taskflow';
const dbUser = process.env.MYSQL_USER || process.env.DB_USER || 'root';
const dbPass = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Connected to MySQL at ${dbHost}:${dbPort} (database: ${dbName})`);
  } catch (error) {
    console.error('MySQL connection error:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };
export default connectDB;

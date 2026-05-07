import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'taskflow_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+00:00'
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ MySQL connection established successfully');

    // Schema sync is opt-in so normal restarts do not keep altering tables.
    // Use SYNC_DB_ON_START=true when you explicitly want Sequelize to reconcile models.
    if (process.env.SYNC_DB_ON_START === 'true') {
      const shouldAlter = process.env.SYNC_DB_ALTER === 'true';
      await sequelize.sync({ alter: shouldAlter });
      console.log(`✓ Database models synced${shouldAlter ? ' with alter' : ''}`);
    }
  } catch (error) {
    console.error('✗ Unable to connect to MySQL database:', error.message);
    process.exit(1);
  }
};

export { sequelize, connectDB };

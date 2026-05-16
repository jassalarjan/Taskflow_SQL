import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB, { sequelize } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

async function run() {
  try {
    await connectDB();

    const fullName = process.env.ADMIN_FULL_NAME || 'Arjan Singh Jassal';
    const email = (process.env.ADMIN_EMAIL || 'jassalarjansingh@gmail.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'waheguru';

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log(`Admin user already exists: ${email}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name: fullName,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('Admin user created:', { id: user.id, email });
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();

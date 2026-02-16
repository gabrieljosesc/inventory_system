import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';

async function seed(): Promise<void> {
  await mongoose.connect(env.mongodbUri);

  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) {
    console.log('Seed user already exists.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const hash = await bcrypt.hash('admin123', 10);
  await User.create({
    email: 'admin@example.com',
    passwordHash: hash,
    name: 'Admin',
    role: 'admin',
  });
  console.log('Created user: admin@example.com / admin123');

  const categories = ['Dairy', 'Dry goods', 'Beverages', 'Produce', 'Meat'];
  for (const name of categories) {
    await Category.findOneAndUpdate({ name }, { name }, { upsert: true });
  }
  console.log('Created default categories:', categories.join(', '));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

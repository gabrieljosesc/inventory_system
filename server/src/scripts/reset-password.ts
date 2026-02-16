import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 10;

async function resetPassword(): Promise<void> {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  if (!email || !newPassword) {
    console.error('Usage: npm run reset-password -- <email> <new-password>');
    process.exit(1);
  }
  if (newPassword.length < 6) {
    console.error('Password must be at least 6 characters');
    process.exit(1);
  }

  await mongoose.connect(env.mongodbUri);
  const user = await User.findOne({ email });
  if (!user) {
    console.error('User not found:', email);
    await mongoose.disconnect();
    process.exit(1);
  }
  user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save();
  console.log('Password updated for', email);
  await mongoose.disconnect();
  process.exit(0);
}

resetPassword().catch((err) => {
  console.error(err);
  process.exit(1);
});

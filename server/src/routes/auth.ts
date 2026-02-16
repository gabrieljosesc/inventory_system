import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { validateBody } from '../middleware/validate.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const BCRYPT_ROUNDS = 10;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      env.jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role ?? 'staff' },
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/change-password',
  auth,
  validateBody(changePasswordSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
      const user = await User.findById(req.user!.userId);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }
      user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await user.save();
      res.json({ message: 'Password updated' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { User } from '../models/User.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
const BCRYPT_ROUNDS = 10;

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1).max(200),
  role: z.enum(['admin', 'staff']).optional(),
});

router.get('/', auth, requireAdmin, async (_req, res, next) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  auth,
  requireAdmin,
  validateBody(createUserSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const body = req.body as z.infer<typeof createUserSchema>;
      const existing = await User.findOne({ email: body.email });
      if (existing) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }
      const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
      const user = await User.create({
        email: body.email,
        passwordHash,
        name: body.name,
        role: body.role ?? 'staff',
      });
      res.status(201).json({
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

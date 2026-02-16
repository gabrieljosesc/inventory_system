import { Router } from 'express';
import authRoutes from './auth.js';
import categoriesRoutes from './categories.js';
import itemsRoutes from './items.js';
import movementsRoutes from './movements.js';
import usersRoutes from './users.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/items', itemsRoutes);
router.use('/movements', movementsRoutes);
router.use('/users', usersRoutes);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category.js';
import { Item } from '../models/Item.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
router.use(auth);

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});

const updateSchema = createSchema.partial();

router.get('/', async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(createSchema), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as z.infer<typeof createSchema>;
    const category = await Category.create(body);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).lean();
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof updateSchema>;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).lean();
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const hasItems = await Item.exists({ categoryId: req.params.id });
    if (hasItems) {
      res.status(400).json({
        error: 'Cannot delete category that has items. Move or delete the items first.',
        code: 'CATEGORY_IN_USE',
      });
      return;
    }
    await Category.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { Item } from '../models/Item.js';
import { auth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

const router = Router();
router.use(auth);

const createSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  unit: z.string().min(1).max(50),
  quantity: z.number().min(0),
  minQuantity: z.number().min(0),
  maxQuantity: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  expiryDate: z.string().optional(),
});

const updateSchema = createSchema.partial();

const listQuerySchema = z.object({
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  search: z.string().max(100).optional(),
});

router.get(
  '/',
  validateQuery(listQuerySchema),
  async (req, res, next) => {
    try {
      const query = req.query as z.infer<typeof listQuerySchema>;
      const filter: Record<string, unknown> = {};
      if (query.categoryId) filter.categoryId = query.categoryId;
      if (query.lowStock === 'true') {
        filter.$expr = { $lte: ['$quantity', '$minQuantity'] };
      }
      if (query.search?.trim()) {
        filter.name = { $regex: query.search.trim(), $options: 'i' };
      }
      const items = await Item.find(filter).populate('categoryId', 'name').sort({ name: 1 }).lean();
      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/export',
  validateQuery(listQuerySchema),
  async (req, res, next) => {
    try {
      const query = req.query as z.infer<typeof listQuerySchema>;
      const filter: Record<string, unknown> = {};
      if (query.categoryId) filter.categoryId = query.categoryId;
      if (query.lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$minQuantity'] };
      if (query.search?.trim()) filter.name = { $regex: query.search.trim(), $options: 'i' };
      const items = await Item.find(filter).populate('categoryId', 'name').sort({ name: 1 }).lean();
      const headers = ['Name', 'Category', 'Unit', 'Quantity', 'Min', 'Max', 'Supplier', 'Expiry'];
      const quote = (v: unknown) => {
        const s = v == null ? '' : String(v).replace(/"/g, '""');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
      };
      const row = (item: Record<string, unknown>) =>
        [
          quote(item.name),
          quote((item.categoryId as { name?: string })?.name),
          quote(item.unit),
          item.quantity,
          item.minQuantity,
          item.maxQuantity ?? '',
          quote(item.supplier),
          item.expiryDate ? new Date(item.expiryDate as Date).toISOString().slice(0, 10) : '',
        ].join(',');
      const csv = [headers.join(','), ...items.map((i) => row(i as Record<string, unknown>))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=items.csv');
      res.send('\uFEFF' + csv);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/', validateBody(createSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createSchema>;
    const { expiryDate, ...rest } = body;
    const item = await Item.create({
      ...rest,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });
    const populated = await Item.findById(item._id).populate('categoryId', 'name').lean();
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('categoryId', 'name').lean();
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof updateSchema>;
    const { expiryDate, ...rest } = body;
    const update: Record<string, unknown> = { ...rest };
    if (expiryDate !== undefined) update.expiryDate = expiryDate ? new Date(expiryDate) : null;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name')
      .lean();
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Item.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

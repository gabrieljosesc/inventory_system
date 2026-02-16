import { Router } from 'express';
import { z } from 'zod';
import { Item } from '../models/Item.js';
import { StockMovement } from '../models/StockMovement.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

const router = Router();
router.use(auth);

const createSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  type: z.enum(['in', 'out']),
  quantity: z.number().positive(),
  reason: z.string().max(200).optional(),
});

const listQuerySchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

router.get(
  '/export',
  validateQuery(listQuerySchema),
  async (req, res, next) => {
    try {
      const query = req.query as z.infer<typeof listQuerySchema>;
      const filter: Record<string, unknown> = {};
      if (query.itemId) filter.itemId = query.itemId;
      if (query.from || query.to) {
        filter.createdAt = {};
        if (query.from) {
          const fromDate = new Date(query.from);
          if (!isNaN(fromDate.getTime())) (filter.createdAt as Record<string, Date>).$gte = fromDate;
        }
        if (query.to) {
          const toDate = new Date(query.to);
          if (!isNaN(toDate.getTime())) (filter.createdAt as Record<string, Date>).$lte = toDate;
        }
      }
      const limit = query.limit ?? 5000;
      const movements = await StockMovement.find(filter)
        .populate('itemId', 'name unit')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      const quote = (v: unknown) => {
        const s = v == null ? '' : String(v).replace(/"/g, '""');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
      };
      const headers = ['Date', 'Item', 'Unit', 'Type', 'Quantity', 'Reason'];
      const rows = movements.map((m: Record<string, unknown>) => [
        new Date(m.createdAt as Date).toISOString(),
        quote((m.itemId as { name?: string })?.name),
        quote((m.itemId as { unit?: string })?.unit),
        m.type,
        m.quantity,
        quote(m.reason),
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=movements.csv');
      res.send('\uFEFF' + csv);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/', validateBody(createSchema), async (req: AuthRequest, res, next) => {
  try {
    const { itemId, type, quantity, reason } = req.body as z.infer<typeof createSchema>;
    const item = await Item.findById(itemId);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    if (type === 'out' && item.quantity < quantity) {
      res.status(400).json({ error: 'Insufficient stock' });
      return;
    }
    const newQty = type === 'in' ? item.quantity + quantity : item.quantity - quantity;
    await Item.findByIdAndUpdate(itemId, { quantity: newQty });
    const movement = await StockMovement.create({
      itemId,
      type,
      quantity,
      reason,
      createdBy: req.user?.userId,
    });
    const populated = await StockMovement.findById(movement._id)
      .populate('itemId', 'name unit')
      .lean();
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.get(
  '/',
  validateQuery(listQuerySchema),
  async (req, res, next) => {
    try {
      const query = req.query as z.infer<typeof listQuerySchema>;
      const filter: Record<string, unknown> = {};
      if (query.itemId) filter.itemId = query.itemId;
      if (query.from || query.to) {
        filter.createdAt = {};
        if (query.from) {
          const fromDate = new Date(query.from);
          if (!isNaN(fromDate.getTime())) (filter.createdAt as Record<string, Date>).$gte = fromDate;
        }
        if (query.to) {
          const toDate = new Date(query.to);
          if (!isNaN(toDate.getTime())) (filter.createdAt as Record<string, Date>).$lte = toDate;
        }
      }
      const limit = query.limit ?? 50;
      const movements = await StockMovement.find(filter)
        .populate('itemId', 'name unit')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      res.json(movements);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

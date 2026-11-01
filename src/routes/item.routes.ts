import { Router } from 'express';
import * as ctrl from '../controllers/item.controller';
import validate from '../middleware/validate';
import { itemSchema, decreaseSchema } from '../validators/schemas';

const router = Router();

router.post('/', validate(itemSchema), ctrl.create);
router.get('/', ctrl.list);
router.put('/:id', validate(itemSchema), ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/decrease-stock', validate(decreaseSchema), ctrl.decreaseStock);

export default router;
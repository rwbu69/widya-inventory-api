import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import validate from '../middleware/validate';
import { authSchema } from '../validators/schemas';

const router = Router();

router.post('/register', validate(authSchema), ctrl.register);
router.post('/login', validate(authSchema), ctrl.login);

export default router;
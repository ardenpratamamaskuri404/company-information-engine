import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { validateLocationBody } from '../middlewares/validateRequest';

const router = Router();

router.post('/location', validateLocationBody, LocationController.extractLocation);

export default router;

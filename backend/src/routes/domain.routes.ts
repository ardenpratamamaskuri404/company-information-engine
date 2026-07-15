import { Router } from 'express';
import { DomainController } from '../controllers/domain.controller';
import { validateDomainBody } from '../middlewares/validateRequest';

const router = Router();

router.post('/domain', validateDomainBody, DomainController.extractDomain);

export default router;

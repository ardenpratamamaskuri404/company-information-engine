import { Router } from 'express';
import { WebsiteController } from '../controllers/website.controller';
import { validateWebsiteBody } from '../middlewares/validateRequest';

const router = Router();

router.post('/website', validateWebsiteBody, WebsiteController.extractWebsite);

export default router;

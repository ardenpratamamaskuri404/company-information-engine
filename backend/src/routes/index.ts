import { Router } from 'express';
import websiteRoutes from './website.routes';
import domainRoutes from './domain.routes';
import locationRoutes from './location.routes';
import companyRoutes from './company.routes';

const router = Router();


router.use('/extract', websiteRoutes);
router.use('/extract', domainRoutes);
router.use('/extract', locationRoutes);


router.use('/', companyRoutes);

export default router;

import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { validateCompanyQuery } from '../middlewares/validateRequest';

const router = Router();

router.get('/company-information', validateCompanyQuery, CompanyController.getCompanyInformation);

export default router;

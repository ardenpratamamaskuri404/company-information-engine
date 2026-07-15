import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service';
import { formatSuccess } from '../utils/responseFormatter';

export class CompanyController {
  public static async getCompanyInformation(req: Request, res: Response, next: NextFunction) {
    try {
      const domain = req.query.domain as string;
      const result = await CompanyService.getCompanyInformation(domain);
      
      const payload = {
        website: result.website,
        domain: result.domain,
        location: result.location,
      };

      return res.status(200).json(formatSuccess(payload, result.warnings));
    } catch (err) {
      next(err);
    }
  }
}

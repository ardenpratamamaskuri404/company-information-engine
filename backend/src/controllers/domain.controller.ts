import { Request, Response, NextFunction } from 'express';
import { DomainService } from '../services/domain.service';
import { formatSuccess } from '../utils/responseFormatter';

export class DomainController {
  public static async extractDomain(req: Request, res: Response, next: NextFunction) {
    try {
      const { domain } = req.body;
      const domainInfo = await DomainService.extract(domain);
      return res.status(200).json(formatSuccess(domainInfo));
    } catch (err) {
      next(err);
    }
  }
}

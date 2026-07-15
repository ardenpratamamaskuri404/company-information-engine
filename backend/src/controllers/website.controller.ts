import { Request, Response, NextFunction } from 'express';
import { WebsiteService } from '../services/website.service';
import { formatSuccess } from '../utils/responseFormatter';

export class WebsiteController {
  public static async extractWebsite(req: Request, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;
      const metadata = await WebsiteService.extract(url);
      return res.status(200).json(formatSuccess(metadata));
    } catch (err) {
      next(err);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { LocationService } from '../services/location.service';
import { formatSuccess } from '../utils/responseFormatter';

export class LocationController {
  public static async extractLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      const locationInfo = await LocationService.extract(query);
      return res.status(200).json(formatSuccess(locationInfo));
    } catch (err) {
      next(err);
    }
  }
}

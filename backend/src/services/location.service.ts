import axios from 'axios';
import { LocationInfo } from '../types/location.types';
import { AppError } from '../types/common.types';
import { config } from '../config/env';

export class LocationService {
  private static TIMEOUT_MS = 8000;
  
  private static requestQueue: Promise<any> = Promise.resolve();

  public static async extract(query: string): Promise<LocationInfo> {
    
    const responsePromise = this.requestQueue.then(async () => {
      
      await this.delay(1000);
      return this.fetchLocation(query);
    });

    
    this.requestQueue = responsePromise.catch(() => {});

    return responsePromise;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async fetchLocation(query: string): Promise<LocationInfo> {
    try {
      const searchUrl = `${config.NOMINATIM_BASE_URL}?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=1`;
      
      const response = await axios.get(searchUrl, {
        timeout: this.TIMEOUT_MS,
        headers: {
          'User-Agent': config.USER_AGENT,
          'Accept': 'application/json',
        },
      });

      const results = response ? response.data : null;
      if (!results || !Array.isArray(results) || results.length === 0) {
        throw new AppError(`Location not found for query: "${query}"`, 404, 'LOCATION_NOT_FOUND');
      }

      const topResult = results[0];

      return {
        display_name: topResult.display_name || '',
        latitude: topResult.lat || '',
        longitude: topResult.lon || '',
        importance: topResult.importance !== undefined ? topResult.importance : '',
        osm_type: topResult.osm_type || '',
        address: topResult.address || {},
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;

      if (err.response) {
        if (err.response.status === 429) {
          throw new AppError('Location search is currently rate-limited by Nominatim', 502, 'UPSTREAM_UNAVAILABLE');
        }
        throw new AppError(
          `Nominatim service returned status ${err.response.status}: ${err.response.statusText}`,
          502,
          'UPSTREAM_UNAVAILABLE'
        );
      }

      console.error('Axios Nominatim error:', err.message);
      throw new AppError(
        `Location finder service cannot be reached: ${err.message}`,
        502,
        'UPSTREAM_UNAVAILABLE'
      );
    }
  }
}

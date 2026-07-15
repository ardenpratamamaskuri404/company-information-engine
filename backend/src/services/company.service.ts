import { WebsiteService } from './website.service';
import { DomainService } from './domain.service';
import { LocationService } from './location.service';
import { AppError } from '../types/common.types';

export interface CompanyInfoResult {
  website: any;
  domain: any;
  location: any;
  warnings: Array<{ source: string; message: string }>;
}

export class CompanyService {
  public static async getCompanyInformation(domain: string): Promise<CompanyInfoResult> {
    const websiteUrl = `https://${domain}`;

    // Execute all extractions in parallel
    const [websiteRes, domainRes, locationRes] = await Promise.allSettled([
      WebsiteService.extract(websiteUrl),
      DomainService.extract(domain),
      LocationService.extract(domain),
    ]);

    const warnings: Array<{ source: string; message: string }> = [];
    let website = null;
    let domainData = null;
    let location = null;

    if (websiteRes.status === 'fulfilled') {
      website = websiteRes.value;
    } else {
      warnings.push({ 
        source: 'website', 
        message: websiteRes.reason.message || 'Failed to extract website metadata' 
      });
    }

    if (domainRes.status === 'fulfilled') {
      domainData = domainRes.value;
    } else {
      warnings.push({ 
        source: 'domain', 
        message: domainRes.reason.message || 'Failed to extract domain intelligence' 
      });
    }

    if (locationRes.status === 'fulfilled') {
      location = locationRes.value;
    } else {
      warnings.push({ 
        source: 'location', 
        message: locationRes.reason.message || 'Failed to find company location' 
      });
    }

    // Standard requirement: Endpoint fails completely only if ALL three services fail
    if (website === null && domainData === null && location === null) {
      throw new AppError('All details extraction failed for the requested domain.', 502, 'INTEGRATION_FAILED');
    }

    return {
      website,
      domain: domainData,
      location,
      warnings,
    };
  }
}

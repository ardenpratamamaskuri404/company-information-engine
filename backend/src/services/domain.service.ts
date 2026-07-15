import axios from 'axios';
import { DomainInfo } from '../types/domain.types';
import { AppError } from '../types/common.types';
import { config } from '../config/env';

export class DomainService {
  private static TIMEOUT_MS = 8000;

  public static async extract(domain: string): Promise<DomainInfo> {
    const rdapUrl = `${config.RDAP_BASE_URL}/${domain.toLowerCase()}`;
    try {
      const response = await axios.get(rdapUrl, {
        timeout: this.TIMEOUT_MS,
        headers: {
          'User-Agent': config.USER_AGENT,
          'Accept': 'application/rdap+json, application/json',
        },
      });

      const data = response.data;
      if (!data) {
        throw new AppError('Empty response received from RDAP service', 404, 'DOMAIN_NOT_FOUND');
      }

      // 1. Extract registrar
      let registrar = '';
      if (data.entities && Array.isArray(data.entities)) {
        const registrarEntity = data.entities.find((ent: any) => 
          ent.roles && Array.isArray(ent.roles) && ent.roles.includes('registrar')
        );
        if (registrarEntity) {
          if (registrarEntity.vcardArray && Array.isArray(registrarEntity.vcardArray) && registrarEntity.vcardArray[1]) {
            const fields = registrarEntity.vcardArray[1];
            const fnField = fields.find((f: any) => Array.isArray(f) && f[0] === 'fn');
            if (fnField && fnField[3]) {
              registrar = fnField[3];
            }
          }
          if (!registrar && registrarEntity.handle) {
            registrar = registrarEntity.handle;
          }
        }
      }

      // 2. Extract events: registered_at, expired_at, last_updated
      let registered_at = '';
      let expired_at = '';
      let last_updated = '';

      if (data.events && Array.isArray(data.events)) {
        data.events.forEach((event: any) => {
          const action = event.eventAction;
          const date = event.eventDate;
          if (action && date) {
            if (action === 'registration') {
              registered_at = date;
            } else if (action === 'expiration') {
              expired_at = date;
            } else if (action === 'last changed' || action === 'last update') {
              last_updated = date;
            }
          }
        });
      }

      // 3. Extract status
      const status = Array.isArray(data.status) ? data.status : [];

      // 4. Extract nameservers
      const nameservers: string[] = [];
      if (data.nameservers && Array.isArray(data.nameservers)) {
        data.nameservers.forEach((ns: any) => {
          if (ns.ldhName) {
            nameservers.push(ns.ldhName.toLowerCase());
          }
        });
      }

      return {
        domain,
        registrar,
        registered_at,
        expired_at,
        last_updated,
        status,
        nameservers,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;

      if (err.response) {
        if (err.response.status === 404) {
          throw new AppError(`Domain "${domain}" is not registered or not found in RDAP database`, 404, 'DOMAIN_NOT_FOUND');
        }
        throw new AppError(
          `RDAP service returned status ${err.response.status}: ${err.response.statusText}`,
          502,
          'UPSTREAM_UNAVAILABLE'
        );
      }

      console.error('Axios RDAP error:', err.message);
      throw new AppError(
        `RDAP registry cannot be reached: ${err.message}`,
        502,
        'UPSTREAM_UNAVAILABLE'
      );
    }
  }
}

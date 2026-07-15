import axios from 'axios';
import { WebsiteService } from '../services/website.service';
import { DomainService } from '../services/domain.service';
import { LocationService } from '../services/location.service';
import { CompanyService } from '../services/company.service';
import { AppError } from '../types/common.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Data Acquisition Engine Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WebsiteService', () => {
    it('should successfully extract website metadata from HTML', async () => {
      const mockHtml = `
        <!doctype html>
        <html>
          <head>
            <title>Test Company Title</title>
            <meta name="description" content="Test description content">
            <link rel="canonical" href="https://example.com">
            <link rel="icon" href="/favicon-32x32.png">
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Description">
            <meta property="og:image" content="https://example.com/og.png">
          </head>
          <body>
            <p>Contact us at contact@example.com or phone us at 021-1234567</p>
            <a href="mailto:support@example.com">Mail Us</a>
            <a href="tel:+62217654321">Call Us</a>
            <a href="https://instagram.com/testcompany">Instagram</a>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockHtml,
      });

      const result = await WebsiteService.extract('https://example.com');

      expect(result.title).toBe('Test Company Title');
      expect(result.description).toBe('Test description content');
      expect(result.canonical).toBe('https://example.com');
      expect(result.favicon).toBe('https://example.com/favicon-32x32.png');
      expect(result.emails).toContain('contact@example.com');
      expect(result.emails).toContain('support@example.com');
      expect(result.phones).toContain('021-1234567');
      expect(result.phones).toContain('+62217654321');
      expect(result.social_media).toContain('https://instagram.com/testcompany');
      expect(result.open_graph.title).toBe('OG Title');
      expect(result.open_graph.image).toBe('https://example.com/og.png');
    });

    it('should handle timeout or upstream unavailable gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Timeout'));

      await expect(WebsiteService.extract('https://example.com')).rejects.toThrow(
        new AppError('Website cannot be reached: Network Timeout', 502, 'UPSTREAM_UNAVAILABLE')
      );
    });
  });

  describe('DomainService', () => {
    it('should successfully query and normalize RDAP domain data', async () => {
      const mockRdapResponse = {
        entities: [
          {
            roles: ['registrar'],
            vcardArray: [
              'vcard',
              [
                ['fn', {}, 'text', 'Test Registrar Inc.']
              ]
            ]
          }
        ],
        events: [
          { eventAction: 'registration', eventDate: '2020-01-01T10:00:00Z' },
          { eventAction: 'expiration', eventDate: '2030-01-01T10:00:00Z' },
          { eventAction: 'last changed', eventDate: '2023-01-01T10:00:00Z' }
        ],
        status: ['active', 'clientTransferProhibited'],
        nameservers: [
          { ldhName: 'ns1.testdns.com' },
          { ldhName: 'ns2.testdns.com' }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockRdapResponse,
      });

      const result = await DomainService.extract('example.com');

      expect(result.domain).toBe('example.com');
      expect(result.registrar).toBe('Test Registrar Inc.');
      expect(result.registered_at).toBe('2020-01-01T10:00:00Z');
      expect(result.expired_at).toBe('2030-01-01T10:00:00Z');
      expect(result.last_updated).toBe('2023-01-01T10:00:00Z');
      expect(result.status).toContain('active');
      expect(result.nameservers).toContain('ns1.testdns.com');
    });

    it('should throw 404 AppError if domain is not found', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          statusText: 'Not Found',
        }
      });

      await expect(DomainService.extract('nonexistent.com')).rejects.toThrow(
        new AppError('Domain "nonexistent.com" is not registered or not found in RDAP database', 404, 'DOMAIN_NOT_FOUND')
      );
    });
  });

  describe('LocationService', () => {
    it('should successfully search location using OSM Nominatim', async () => {
      const mockOsmResponse = [
        {
          display_name: 'Example Office, Gatot Subroto, Jakarta',
          lat: '-6.2297',
          lon: '106.8164',
          importance: 0.85,
          osm_type: 'node',
          address: {
            road: 'Gatot Subroto',
            city: 'Jakarta',
            country: 'Indonesia'
          }
        }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockOsmResponse,
      });

      const result = await LocationService.extract('PT Example');

      expect(result.display_name).toBe('Example Office, Gatot Subroto, Jakarta');
      expect(result.latitude).toBe('-6.2297');
      expect(result.longitude).toBe('106.8164');
      expect(result.importance).toBe(0.85);
      expect(result.address.city).toBe('Jakarta');
    });

    it('should throw 404 AppError if no locations are found', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: [],
      });

      await expect(LocationService.extract('NonExistentPlaceQueryXYZ')).rejects.toThrow(
        new AppError('Location not found for query: "NonExistentPlaceQueryXYZ"', 404, 'LOCATION_NOT_FOUND')
      );
    });
  });

  describe('CompanyService Integration', () => {
    it('should aggregate data when all services succeed', async () => {
      const mockHtml = '<html><head><title>Test Title</title></head><body></body></html>';
      const mockRdap = { status: ['active'] };
      const mockOsm = [{ lat: '1.23', lon: '4.56', display_name: 'Test Location' }];

      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: mockHtml }) // Website
        .mockResolvedValueOnce({ status: 200, data: mockRdap }) // Domain
        .mockResolvedValueOnce({ status: 200, data: mockOsm }); // Location

      const result = await CompanyService.getCompanyInformation('example.com');

      expect(result.website).not.toBeNull();
      expect(result.website.title).toBe('Test Title');
      expect(result.domain).not.toBeNull();
      expect(result.domain.status).toContain('active');
      expect(result.location).not.toBeNull();
      expect(result.location.latitude).toBe('1.23');
      expect(result.warnings.length).toBe(0);
    });

    it('should handle partial failure gracefully when one service fails', async () => {
      const mockHtml = '<html><head><title>Test Title</title></head><body></body></html>';
      const mockOsm = [{ lat: '1.23', lon: '4.56', display_name: 'Test Location' }];

      mockedAxios.get
        .mockResolvedValueOnce({ status: 200, data: mockHtml }) // Website
        .mockRejectedValueOnce({ response: { status: 404 } }) // Domain fails
        .mockResolvedValueOnce({ status: 200, data: mockOsm }); // Location

      const result = await CompanyService.getCompanyInformation('example.com');

      expect(result.website).not.toBeNull();
      expect(result.domain).toBeNull(); // failed
      expect(result.location).not.toBeNull();
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0].source).toBe('domain');
      expect(result.warnings[0].message).toContain('is not registered or not found');
    });

    it('should throw an error if all three services fail', async () => {
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Web Error'))
        .mockRejectedValueOnce(new Error('RDAP Error'))
        .mockRejectedValueOnce(new Error('OSM Error'));

      await expect(CompanyService.getCompanyInformation('example.com')).rejects.toThrow(
        new AppError('All details extraction failed for the requested domain.', 502, 'INTEGRATION_FAILED')
      );
    });
  });
});

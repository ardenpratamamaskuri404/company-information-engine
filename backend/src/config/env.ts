import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  RDAP_BASE_URL: process.env.RDAP_BASE_URL || 'https://rdap.org/domain',
  NOMINATIM_BASE_URL: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/search',
  USER_AGENT: process.env.USER_AGENT || 'CompanyLookupAgent/1.0 (admin@example.com)',
};

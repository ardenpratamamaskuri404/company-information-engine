import axios from 'axios';
import * as cheerio from 'cheerio';
import { WebsiteMetadata } from '../types/website.types';
import { AppError } from '../types/common.types';

export class WebsiteService {
  private static TIMEOUT_MS = 12000;

  // Browser-like headers to avoid anti-bot 403 blocks
  private static BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Connection': 'keep-alive',
  };

  public static async extract(url: string): Promise<WebsiteMetadata> {
    const parsedUrl = new URL(url);
    const origin = parsedUrl.origin;

    // Try fetching with full browser headers; on 403 retry with www prefix if not already present
    let html: string | null = null;
    const urlsToTry: string[] = [url];
    
    // If domain has no www., add a www. variant as fallback
    if (!parsedUrl.hostname.startsWith('www.')) {
      urlsToTry.push(`${parsedUrl.protocol}//www.${parsedUrl.hostname}`);
    }

    let lastError: any;
    for (const attemptUrl of urlsToTry) {
      try {
        const response = await axios.get(attemptUrl, {
          timeout: this.TIMEOUT_MS,
          maxRedirects: 5,
          headers: {
            ...this.BROWSER_HEADERS,
            'Referer': `https://www.google.com/search?q=${parsedUrl.hostname}`,
            'Host': new URL(attemptUrl).hostname,
          },
          // Treat 403/406 as non-throwing to attempt fallback
          validateStatus: (status) => status < 500,
        });

        if (response.status === 200 && typeof response.data === 'string') {
          html = response.data;
          break;
        } else if (response.status >= 400) {
          lastError = new AppError(
            `Website returned status ${response.status}. Website may be blocking automated access.`,
            response.status,
            'UPSTREAM_ERROR'
          );
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!html) {
      if (lastError instanceof AppError) throw lastError;
      const status = lastError?.response?.status;
      if (status === 403 || status === 406) {
        throw new AppError(
          `Website is protected and cannot be accessed automatically (HTTP ${status}). Try another domain.`,
          403,
          'UPSTREAM_BLOCKED'
        );
      }
      throw new AppError(
        `Website cannot be reached: ${lastError?.message || 'Unknown error'}`,
        502,
        'UPSTREAM_ERROR'
      );
    }

    try {
      const $ = cheerio.load(html);

      // Extract title
      const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content')?.trim() || '';

      // Extract description
      const description = $('meta[name="description"]').attr('content')?.trim() || $('meta[property="og:description"]').attr('content')?.trim() || '';

      // Extract canonical URL
      let canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';
      if (canonical && !canonical.startsWith('http')) {
        try {
          canonical = new URL(canonical, origin).href;
        } catch {
          // ignore
        }
      }

      // Extract favicon
      let favicon = $('link[rel="icon"]').attr('href')?.trim() || 
                    $('link[rel="shortcut icon"]').attr('href')?.trim() || 
                    $('link[rel="apple-touch-icon"]').attr('href')?.trim() || 
                    '';
      if (favicon) {
        if (!favicon.startsWith('http')) {
          try {
            favicon = new URL(favicon, origin).href;
          } catch {
            // ignore
          }
        }
      } else {
        favicon = `${origin}/favicon.ico`;
      }

      // Extract emails
      const emailsSet = new Set<string>();
      // 1. From mailto: links
      $('a[href^="mailto:"]').each((_, element) => {
        const href = $(element).attr('href') || '';
        const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
        if (email) emailsSet.add(email.toLowerCase());
      });
      
      // Clone DOM and remove scripts, styles, noscripts, iframes to clean up text parsing
      const clean$ = cheerio.load(html);
      clean$('script, style, noscript, iframe').remove();
      
      // Extract text separating element contents with spaces to prevent words/tags sticking
      const bodyText = clean$('body').find('*').contents().map((_, el) => {
        return el.type === 'text' ? clean$(el).text() : ' ';
      }).get().join(' ');

      // 2. From text regex matching with word boundaries
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}\b/g;
      const foundEmails = bodyText.match(emailRegex);
      if (foundEmails) {
        foundEmails.forEach(email => emailsSet.add(email.toLowerCase()));
      }
      const emails = Array.from(emailsSet);

      // Extract phones
      const phonesSet = new Set<string>();
      // 1. From tel: links
      $('a[href^="tel:"]').each((_, element) => {
        const href = $(element).attr('href') || '';
        const phone = href.replace(/^tel:/i, '').split('?')[0].trim();
        if (phone) phonesSet.add(decodeURIComponent(phone));
      });
      // 2. From text matching (Indonesian and general patterns)
      const phoneRegex = /\b(?:\+?62|0)(?:\d{2,4})[-.\s]?\d{3,4}[-.\s]?\d{3,6}\b/g;
      const foundPhones = bodyText.match(phoneRegex);
      if (foundPhones) {
        foundPhones.forEach(phone => {
          const cleanPhone = phone.trim();
          if (cleanPhone.replace(/[-.\s()]/g, '').length >= 7) {
            phonesSet.add(cleanPhone);
          }
        });
      }
      const phones = Array.from(phonesSet);

      // Extract social media links
      const socialMediaSet = new Set<string>();
      const socialPlatforms = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com', 'youtube.com', 'youtu.be'];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href')?.trim() || '';
        if (href.startsWith('http')) {
          try {
            const hostname = new URL(href).hostname.toLowerCase();
            const matchesPlatform = socialPlatforms.some(platform => hostname.includes(platform));
            if (matchesPlatform) {
              socialMediaSet.add(href);
            }
          } catch {
            // ignore invalid URL
          }
        }
      });
      const social_media = Array.from(socialMediaSet);

      // Extract Open Graph
      const open_graph = {
        title: $('meta[property="og:title"]').attr('content')?.trim() || '',
        description: $('meta[property="og:description"]').attr('content')?.trim() || '',
        image: $('meta[property="og:image"]').attr('content')?.trim() || '',
      };

      if (open_graph.image && !open_graph.image.startsWith('http')) {
        try {
          open_graph.image = new URL(open_graph.image, origin).href;
        } catch {
          // ignore
        }
      }

      return {
        url,
        title,
        description,
        canonical,
        favicon,
        emails,
        phones,
        social_media,
        open_graph,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.error('Axios website extract error:', err.message);
      throw new AppError(
        `Website cannot be reached: ${err.message}`,
        502,
        'UPSTREAM_UNAVAILABLE'
      );
    }
  }
}

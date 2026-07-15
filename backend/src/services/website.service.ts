import axios from 'axios';
import * as cheerio from 'cheerio';
import { WebsiteMetadata } from '../types/website.types';
import { AppError } from '../types/common.types';

export class WebsiteService {
  private static TIMEOUT_MS = 8000;

  public static async extract(url: string): Promise<WebsiteMetadata> {
    try {
      const response = await axios.get(url, {
        timeout: this.TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      const html = response.data;
      if (typeof html !== 'string') {
        throw new AppError('Website returned invalid HTML content', 502, 'UPSTREAM_ERROR');
      }

      const $ = cheerio.load(html);
      const parsedUrl = new URL(url);
      const origin = parsedUrl.origin;

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

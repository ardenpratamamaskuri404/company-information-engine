import React, { useState } from 'react';
import axios from 'axios';

// API Base URL config
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface WebsiteMetadata {
  url: string;
  title: string;
  description: string;
  canonical: string;
  favicon: string;
  emails: string[];
  phones: string[];
  social_media: string[];
  open_graph: {
    title: string;
    description: string;
    image: string;
  };
}

interface DomainInfo {
  domain: string;
  registrar: string;
  registered_at: string;
  expired_at: string;
  last_updated: string;
  status: string[];
  nameservers: string[];
}

interface LocationInfo {
  display_name: string;
  latitude: string;
  longitude: string;
  importance: number | string;
  osm_type: string;
  address: Record<string, any>;
}

interface CompanyData {
  website: WebsiteMetadata | null;
  domain: DomainInfo | null;
  location: LocationInfo | null;
}

interface Warning {
  source: string;
  message: string;
}

interface ApiResponse {
  success: boolean;
  data: CompanyData;
  warnings?: Warning[];
  message?: string;
}

export default function App() {
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompanyData | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [rawJson, setRawJson] = useState<any>(null);

  // Loading phase progress for the 3 nodes
  const [nodeStatus, setNodeStatus] = useState<{
    website: 'idle' | 'loading' | 'success' | 'failed';
    domain: 'idle' | 'loading' | 'success' | 'failed';
    location: 'idle' | 'loading' | 'success' | 'failed';
  }>({
    website: 'idle',
    domain: 'idle',
    location: 'idle',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    // Normalize domain input (strip protocols and paths)
    let cleanDomain = domainInput.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    setLoading(true);
    setError(null);
    setData(null);
    setWarnings([]);
    setRawJson(null);

    // Set nodes to loading
    setNodeStatus({
      website: 'loading',
      domain: 'loading',
      location: 'loading',
    });

    try {
      const response = await axios.get<ApiResponse>(`${API_URL}/company-information`, {
        params: { domain: cleanDomain },
      });

      const resData = response.data;
      setRawJson(resData);

      if (resData.success && resData.data) {
        setData(resData.data);
        setWarnings(resData.warnings || []);
        
        // Update nodes status based on return data
        setNodeStatus({
          website: resData.data.website ? 'success' : 'failed',
          domain: resData.data.domain ? 'success' : 'failed',
          location: resData.data.location ? 'success' : 'failed',
        });
      } else {
        throw new Error(resData.message || 'Lookup failed');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'An error occurred while fetching information.';
      setError(errMsg);
      setNodeStatus({
        website: 'failed',
        domain: 'failed',
        location: 'failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-2xl tracking-tight text-text">
              Company <span className="text-accent font-extrabold">Lookup</span>
            </span>
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
          </div>
          <div className="text-sm text-text-muted font-medium font-body">
            Technical Challenge
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-text tracking-tight mb-4">
            Temukan informasi perusahaan
          </h1>
          <p className="font-body text-text-muted text-lg">
            Masukkan nama domain untuk mengekstrak metadata website, data registrasi domain, dan koordinat lokasi geografis.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="w-full max-w-xl mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="cth: paper.id, google.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                required
                className="w-full px-5 py-4 border border-border rounded-xl font-body text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm text-base placeholder:text-text-muted"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-accent hover:bg-accent-hover disabled:bg-slate-300 text-white font-body font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mencari...
                </>
              ) : (
                <>
                  Cari
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* 3-Node Connected Flow */}
        {(loading || data || error) && (
          <div className="w-full max-w-2xl mb-12 bg-surface border border-border/60 rounded-2xl p-6 shadow-sm">
            <div className="text-center mb-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted font-body">
                Status Konektor
              </span>
            </div>
            <div className="relative flex items-center justify-between max-w-lg mx-auto">
              {/* Connected Line Background */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-slate-200 z-0"></div>

              {/* Connected Line Progress */}
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-accent transition-all duration-500 z-0"
                style={{
                  width: 
                    nodeStatus.website === 'success' && nodeStatus.domain === 'success' && nodeStatus.location === 'success' ? '100%' :
                    nodeStatus.website === 'success' && nodeStatus.domain === 'success' ? '50%' :
                    nodeStatus.website === 'success' ? '25%' : '0%'
                }}
              ></div>

              {/* Node 1: Website */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  nodeStatus.website === 'success' ? 'bg-accent border-blue-200 text-white shadow-md' :
                  nodeStatus.website === 'failed' ? 'bg-red-500 border-red-200 text-white' :
                  nodeStatus.website === 'loading' ? 'bg-white border-accent text-accent animate-pulse scale-110 shadow-sm' :
                  'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {nodeStatus.website === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : nodeStatus.website === 'failed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" /></svg>
                  )}
                </div>
                <span className="mt-2 text-xs font-bold font-body text-text">Website</span>
              </div>

              {/* Node 2: Domain */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  nodeStatus.domain === 'success' ? 'bg-accent border-blue-200 text-white shadow-md' :
                  nodeStatus.domain === 'failed' ? 'bg-red-500 border-red-200 text-white' :
                  nodeStatus.domain === 'loading' ? 'bg-white border-accent text-accent animate-pulse scale-110 shadow-sm' :
                  'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {nodeStatus.domain === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : nodeStatus.domain === 'failed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>
                  )}
                </div>
                <span className="mt-2 text-xs font-bold font-body text-text">Domain</span>
              </div>

              {/* Node 3: Location */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                  nodeStatus.location === 'success' ? 'bg-accent border-blue-200 text-white shadow-md' :
                  nodeStatus.location === 'failed' ? 'bg-red-500 border-red-200 text-white' :
                  nodeStatus.location === 'loading' ? 'bg-white border-accent text-accent animate-pulse scale-110 shadow-sm' :
                  'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {nodeStatus.location === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : nodeStatus.location === 'failed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" /></svg>
                  )}
                </div>
                <span className="mt-2 text-xs font-bold font-body text-text">Location</span>
              </div>
            </div>
          </div>
        )}

        {/* Global Error Message */}
        {error && (
          <div className="w-full max-w-3xl bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <h3 className="font-bold text-red-800 font-body text-sm">Gagal Mengambil Data</h3>
              <p className="text-red-700 font-body text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Warnings / Partial failure list */}
        {warnings.length > 0 && (
          <div className="w-full max-w-7xl bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h4 className="font-bold text-amber-800 font-body text-sm">Beberapa sumber data tidak tersedia:</h4>
            </div>
            <ul className="list-disc pl-7 text-amber-700 font-body text-xs space-y-1">
              {warnings.map((warn, i) => (
                <li key={i}>
                  <strong>{warn.source.toUpperCase()}</strong>: {warn.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Result Cards Grid */}
        {data && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Website Metadata Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-blue-100 rounded-xl text-accent">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" /></svg>
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-text">Website Metadata</h2>
                  <p className="text-xs text-text-muted font-body">Ekstraksi halaman HTML</p>
                </div>
              </div>

              {data.website ? (
                <div className="space-y-4 font-body flex-1 flex flex-col">
                  {/* Favicon & Title */}
                  <div className="flex items-start space-x-3 bg-white p-3.5 border border-border rounded-xl">
                    {data.website.favicon ? (
                      <img 
                        src={data.website.favicon} 
                        alt="favicon" 
                        className="w-10 h-10 object-contain rounded-md border border-slate-100 bg-slate-50 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center shrink-0 text-accent font-bold">W</div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-text truncate">
                        {data.website.title || 'Untitled'}
                      </h3>
                      <a href={data.website.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline truncate block">
                        {data.website.url}
                      </a>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Deskripsi</span>
                    <p className="text-sm text-text mt-1 bg-white p-3 border border-border rounded-xl leading-relaxed">
                      {data.website.description || 'Tidak ada deskripsi metadata.'}
                    </p>
                  </div>

                  {/* Contacts */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 border border-border rounded-xl">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Email Extracted</span>
                      {data.website.emails.length > 0 ? (
                        <div className="text-xs text-text font-medium truncate space-y-1">
                          {data.website.emails.map((e, idx) => (
                            <a href={`mailto:${e}`} key={idx} className="block text-accent hover:underline truncate">{e}</a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </div>
                    <div className="bg-white p-3 border border-border rounded-xl">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Telepon Extracted</span>
                      {data.website.phones.length > 0 ? (
                        <div className="text-xs text-text font-medium truncate space-y-1">
                          {data.website.phones.map((p, idx) => (
                            <a href={`tel:${p}`} key={idx} className="block text-accent hover:underline truncate">{p}</a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">-</span>
                      )}
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Sosial Media</span>
                    {data.website.social_media.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {data.website.social_media.map((link, idx) => {
                          let platform = 'Link';
                          if (link.includes('instagram.com')) platform = 'Instagram';
                          else if (link.includes('facebook.com')) platform = 'Facebook';
                          else if (link.includes('linkedin.com')) platform = 'LinkedIn';
                          else if (link.includes('twitter.com') || link.includes('x.com')) platform = 'Twitter/X';
                          else if (link.includes('tiktok.com')) platform = 'TikTok';
                          else if (link.includes('youtube.com') || link.includes('youtu.be')) platform = 'YouTube';

                          return (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              key={idx}
                              className="text-xs px-2.5 py-1.5 bg-white border border-border rounded-lg text-accent font-medium hover:bg-slate-50 transition-colors"
                            >
                              {platform}
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted font-body bg-white p-3 border border-border rounded-xl block">-</span>
                    )}
                  </div>

                  {/* OG Image preview if available */}
                  {data.website.open_graph.image && (
                    <div className="mt-auto pt-2">
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Open Graph Image</span>
                      <img 
                        src={data.website.open_graph.image} 
                        alt="og-preview" 
                        className="w-full h-32 object-cover rounded-xl border border-border shadow-inner"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-sm text-text-muted italic bg-white border border-dashed border-border rounded-2xl">
                  Data website tidak tersedia.
                </div>
              )}
            </div>

            {/* Domain Info Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-blue-100 rounded-xl text-accent">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-text">Domain Intelligence</h2>
                  <p className="text-xs text-text-muted font-body">Data Registrasi Domain (RDAP)</p>
                </div>
              </div>

              {data.domain ? (
                <div className="space-y-4 font-body flex-1 flex flex-col">
                  {/* Registrar block */}
                  <div className="bg-white p-3.5 border border-border rounded-xl">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Registrar</span>
                    <span className="text-sm font-bold text-text mt-0.5 block">
                      {data.domain.registrar || 'Unknown Registrar'}
                    </span>
                  </div>

                  {/* Date fields */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2.5 border border-border rounded-xl">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Created</span>
                      <span className="text-[11px] font-semibold text-text mt-0.5 block truncate">
                        {formatDate(data.domain.registered_at)}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 border border-border rounded-xl">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Expires</span>
                      <span className="text-[11px] font-semibold text-text mt-0.5 block truncate">
                        {formatDate(data.domain.expired_at)}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 border border-border rounded-xl">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Updated</span>
                      <span className="text-[11px] font-semibold text-text mt-0.5 block truncate">
                        {formatDate(data.domain.last_updated)}
                      </span>
                    </div>
                  </div>

                  {/* Nameservers */}
                  <div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Nameservers</span>
                    {data.domain.nameservers.length > 0 ? (
                      <div className="bg-white border border-border rounded-xl divide-y divide-border">
                        {data.domain.nameservers.map((ns, idx) => (
                          <span key={idx} className="block px-3 py-2 text-xs font-mono text-text">
                            {ns}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted font-body bg-white p-3 border border-border rounded-xl block">-</span>
                    )}
                  </div>

                  {/* Statuses */}
                  <div>
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Domain Status</span>
                    {data.domain.status.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {data.domain.status.map((st, idx) => (
                          <span key={idx} className="text-[10px] font-medium px-2 py-1 bg-blue-50 border border-blue-100 rounded-md text-accent">
                            {st}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted font-body bg-white p-3 border border-border rounded-xl block">-</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-sm text-text-muted italic bg-white border border-dashed border-border rounded-2xl">
                  Data domain tidak tersedia.
                </div>
              )}
            </div>

            {/* Location Finder Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2.5 bg-blue-100 rounded-xl text-accent">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" /></svg>
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-text">Company Location</h2>
                  <p className="text-xs text-text-muted font-body">Geocoding via OSM Nominatim</p>
                </div>
              </div>

              {data.location ? (
                <div className="space-y-4 font-body flex-1 flex flex-col">
                  {/* Display Name */}
                  <div className="bg-white p-3.5 border border-border rounded-xl">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Display Name</span>
                    <span className="text-sm font-bold text-text mt-1 block leading-normal">
                      {data.location.display_name}
                    </span>
                  </div>

                  {/* Lat/Lon Block */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 border border-border rounded-xl">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Latitude</span>
                      <span className="text-sm font-mono text-text font-semibold mt-0.5 block">
                        {data.location.latitude}
                      </span>
                    </div>
                    <div className="bg-white p-3 border border-border rounded-xl">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Longitude</span>
                      <span className="text-sm font-mono text-text font-semibold mt-0.5 block">
                        {data.location.longitude}
                      </span>
                    </div>
                  </div>

                  {/* Geotech fields */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-white border border-border rounded-xl p-3.5">
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Importance</span>
                      <span className="font-medium text-text mt-0.5 block">
                        {data.location.importance}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">OSM Type</span>
                      <span className="font-medium text-text mt-0.5 block uppercase">
                        {data.location.osm_type}
                      </span>
                    </div>
                  </div>

                  {/* Address parts details */}
                  {data.location.address && Object.keys(data.location.address).length > 0 && (
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Alamat Detail</span>
                      <div className="bg-white border border-border rounded-xl max-h-[140px] overflow-y-auto p-3 text-xs space-y-1.5 divide-y divide-slate-100">
                        {Object.entries(data.location.address).map(([key, val], idx) => (
                          <div key={idx} className="flex justify-between py-1.5">
                            <span className="font-bold text-text-muted capitalize mr-2 shrink-0">{key.replace(/_/g, ' ')}</span>
                            <span className="text-text font-medium text-right">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-sm text-text-muted italic bg-white border border-dashed border-border rounded-2xl">
                  Data lokasi tidak tersedia.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw JSON Toggle & Content */}
        {rawJson && (
          <div className="w-full border border-border rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowJson(!showJson)}
              className="w-full flex items-center justify-between px-6 py-4 bg-surface hover:bg-slate-100/80 transition-colors text-text font-semibold font-body border-b border-border"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
                Lihat Raw JSON Response
              </span>
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${showJson ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showJson && (
              <pre className="bg-slate-900 p-6 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px]">
                <code>{JSON.stringify(rawJson, null, 2)}</code>
              </pre>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-muted font-body">
          <div>
            &copy; {new Date().getFullYear()} Company Lookup. All rights reserved.
          </div>
          <div>
            Teknologi: React, TypeScript, Tailwind CSS, Express, Cheerio, Nominatim API
          </div>
        </div>
      </footer>
    </div>
  );
}

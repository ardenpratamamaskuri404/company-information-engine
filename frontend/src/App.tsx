import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


const colors = {
  bg: '#FFFFFF',
  surface: '#F5F9FF',
  accent: '#3B82F6',
  accentHover: '#2563EB',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
};

interface WebsiteMetadata {
  url: string;
  title: string;
  description: string;
  canonical: string;
  favicon: string;
  emails: string[];
  phones: string[];
  social_media: string[];
  open_graph: { title: string; description: string; image: string };
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
  address: Record<string, string>;
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

type NodeStatus = 'idle' | 'loading' | 'success' | 'failed';

export default function App() {
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompanyData | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [rawJson, setRawJson] = useState<any>(null);
  const [nodeStatus, setNodeStatus] = useState<{
    website: NodeStatus;
    domain: NodeStatus;
    location: NodeStatus;
  }>({ website: 'idle', domain: 'idle', location: 'idle' });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    
    let cleanDomain = domainInput.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    setLoading(true);
    setError(null);
    setData(null);
    setWarnings([]);
    setRawJson(null);
    setNodeStatus({ website: 'loading', domain: 'loading', location: 'loading' });

    try {
      const response = await axios.get(`${API_URL}/company-information`, {
        params: { domain: cleanDomain },
      });

      const resData = response.data;
      setRawJson(resData);

      if (resData.success && resData.data) {
        setData(resData.data);
        setWarnings(resData.warnings || []);
        setNodeStatus({
          website: resData.data.website ? 'success' : 'failed',
          domain: resData.data.domain ? 'success' : 'failed',
          location: resData.data.location ? 'success' : 'failed',
        });
      } else {
        throw new Error(resData.message || 'Lookup failed');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = axiosErr.response?.data?.message || axiosErr.message || 'An error occurred.';
      setError(errMsg);
      setNodeStatus({ website: 'failed', domain: 'failed', location: 'failed' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getSocialPlatformLabel = (url: string): string => {
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter / X';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    return 'Link';
  };

  const NodeIcon = ({ status }: { status: NodeStatus }) => {
    if (status === 'success')
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
    if (status === 'failed')
      return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
    return <div className="w-3 h-3 rounded-full bg-current" />;
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>

      {}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: 'rgba(255, 255, 255, 0.85)', 
        backdropFilter: 'blur(12px)', 
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.border}`, 
        padding: '16px 32px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24, color: colors.accent }}>
              Company Lookup
            </span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.accent, animation: 'pulse 2s infinite', display: 'inline-block' }} />
          </div>
          <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>Technical Challenge</span>
        </div>
      </header>

      {}
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {}
        <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 600 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 42, color: colors.text, margin: '0 0 12px 0', lineHeight: 1.2 }}>
            Temukan informasi<br />perusahaan
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 17, margin: 0 }}>
            Masukkan domain untuk mengekstrak metadata website, data registrasi domain, dan lokasi geografis.
          </p>
        </div>

        {}
        <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: 560, marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="cth: paper.id, google.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              required
              style={{
                flex: 1, padding: '14px 18px',
                border: `1.5px solid ${colors.border}`,
                borderRadius: 12, fontSize: 15,
                color: colors.text, outline: 'none',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = colors.accent}
              onBlur={(e) => e.target.style.borderColor = colors.border}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 28px',
                background: loading ? '#94a3b8' : colors.accent,
                color: '#fff', border: 'none',
                borderRadius: 12, fontWeight: 600,
                fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif",
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.2s',
                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              }}
              onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = colors.accentHover; }}
              onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = colors.accent; }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mencari...
                </>
              ) : (
                <>Cari →</>
              )}
            </button>
          </div>
        </form>

        {}
        {(loading || data || error) && (
          <div style={{
            width: '100%', maxWidth: 520,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 20, padding: '20px 32px',
            marginBottom: 40,
          }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px 0' }}>
              Status Konektor
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {}
              <div style={{ position: 'absolute', left: 28, right: 28, top: '50%', height: 3, background: colors.border, zIndex: 0, transform: 'translateY(-50%)' }} />

              {(['website', 'domain', 'location'] as const).map((key, idx) => {
                const labels = ['Website', 'Domain', 'Location'];
                const status = nodeStatus[key];
                const bg = status === 'success' ? colors.accent : status === 'failed' ? '#EF4444' : status === 'loading' ? '#fff' : '#f1f5f9';
                const textColor = status === 'idle' ? '#94a3b8' : status === 'loading' ? colors.accent : '#fff';
                const borderColor = status === 'loading' ? colors.accent : status === 'success' ? '#93c5fd' : status === 'failed' ? '#fca5a5' : colors.border;

                return (
                  <div key={key} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: bg, border: `3px solid ${borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: textColor,
                      boxShadow: status === 'success' ? '0 2px 12px rgba(59,130,246,0.3)' : 'none',
                      transition: 'all 0.4s ease',
                      transform: status === 'loading' ? 'scale(1.1)' : 'scale(1)',
                    }}>
                      <NodeIcon status={status} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{labels[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {}
        {error && (
          <div style={{
            width: '100%', maxWidth: 860,
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 12, padding: '14px 18px',
            marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <svg style={{ width: 20, height: 20, color: '#EF4444', flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p style={{ fontWeight: 700, color: '#991B1B', fontSize: 13, margin: '0 0 4px 0' }}>Gagal Mengambil Data</p>
              <p style={{ color: '#B91C1C', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        {}
        {warnings.length > 0 && (
          <div style={{
            width: '100%', background: '#FFFBEB',
            border: '1px solid #FDE68A', borderRadius: 12,
            padding: '12px 18px', marginBottom: 24,
          }}>
            <p style={{ fontWeight: 700, color: '#92400E', fontSize: 13, margin: '0 0 6px 0' }}>⚠ Beberapa sumber data tidak tersedia:</p>
            <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#B45309', fontSize: 12 }}>
              {warnings.map((w, i) => (
                <li key={i}><strong>{w.source.toUpperCase()}</strong>: {w.message}</li>
              ))}
            </ul>
          </div>
        )}

        {}
        {data && (
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>

            {}
            <ResultCard
              title="Website Metadata"
              subtitle="Ekstraksi halaman HTML"
              icon="🌐"
              empty={!data.website}
              emptyMsg="Data website tidak tersedia"
            >
              {data.website && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {}
                  <div style={{ background: '#F8FAFC', border: `1px solid ${colors.border}`, borderRadius: 10, padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {data.website.favicon ? (
                      <img src={data.website.favicon} alt="favicon" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8, border: `1px solid ${colors.border}` }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: '#F0F7FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🌐</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: colors.text, margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {data.website.title || 'Untitled'}
                      </p>
                      <a href={data.website.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: colors.accent, textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {data.website.url}
                      </a>
                    </div>
                  </div>

                  <InfoBlock label="Deskripsi">
                    <p style={{ fontSize: 12, color: colors.text, margin: 0, lineHeight: 1.6 }}>
                      {data.website.description || 'Tidak ada deskripsi.'}
                    </p>
                  </InfoBlock>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <InfoBlock label="Email">
                      {data.website.emails.length > 0
                        ? data.website.emails.slice(0, 3).map((e, i) => (
                          <a key={i} href={`mailto:${e}`} style={{ display: 'block', fontSize: 11, color: colors.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e}</a>
                        ))
                        : <span style={{ fontSize: 11, color: colors.textMuted }}>—</span>}
                    </InfoBlock>
                    <InfoBlock label="Telepon">
                      {data.website.phones.length > 0
                        ? data.website.phones.slice(0, 3).map((p, i) => (
                          <a key={i} href={`tel:${p}`} style={{ display: 'block', fontSize: 11, color: colors.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p}</a>
                        ))
                        : <span style={{ fontSize: 11, color: colors.textMuted }}>—</span>}
                    </InfoBlock>
                  </div>

                  <InfoBlock label="Sosial Media">
                    {data.website.social_media.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {data.website.social_media.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer"
                            style={{ fontSize: 11, padding: '4px 10px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.accent, textDecoration: 'none', fontWeight: 500 }}>
                            {getSocialPlatformLabel(link)}
                          </a>
                        ))}
                      </div>
                    ) : <span style={{ fontSize: 11, color: colors.textMuted }}>—</span>}
                  </InfoBlock>

                  {data.website.open_graph.image && (
                    <InfoBlock label="Open Graph Image">
                      <img src={data.website.open_graph.image} alt="OG Preview"
                        style={{ width: '100%', height: 'auto', maxHeight: 220, objectFit: 'contain', borderRadius: 8, border: `1px solid ${colors.border}`, background: '#F1F5F9', display: 'block', marginTop: 4 }} />
                    </InfoBlock>
                  )}
                </div>
              )}
            </ResultCard>

            {}
            <ResultCard title="Domain Intelligence" subtitle="Data Registrasi (RDAP)" icon="📋" empty={!data.domain} emptyMsg="Data domain tidak tersedia">
              {data.domain && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <InfoBlock label="Registrar">
                    <p style={{ fontSize: 13, fontWeight: 700, color: colors.text, margin: 0 }}>
                      {data.domain.registrar || 'Unknown Registrar'}
                    </p>
                  </InfoBlock>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Created', value: formatDate(data.domain.registered_at) },
                      { label: 'Expires', value: formatDate(data.domain.expired_at) },
                      { label: 'Updated', value: formatDate(data.domain.last_updated) },
                    ].map(({ label, value }) => (
                      <InfoBlock key={label} label={label}>
                        <span style={{ fontSize: 11, color: colors.text, fontWeight: 600 }}>{value}</span>
                      </InfoBlock>
                    ))}
                  </div>

                  <InfoBlock label="Nameservers">
                    {data.domain.nameservers.length > 0 ? (
                      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden' }}>
                        {data.domain.nameservers.map((ns, i) => (
                          <p key={i} style={{ margin: 0, padding: '6px 10px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: colors.text, borderBottom: i < data.domain!.nameservers.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                            {ns}
                          </p>
                        ))}
                      </div>
                    ) : <span style={{ fontSize: 11, color: colors.textMuted }}>—</span>}
                  </InfoBlock>

                  <InfoBlock label="Status">
                    {data.domain.status.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {data.domain.status.map((s, i) => (
                          <span key={i} style={{ fontSize: 10, padding: '3px 8px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, color: colors.accent, fontWeight: 600 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : <span style={{ fontSize: 11, color: colors.textMuted }}>—</span>}
                  </InfoBlock>
                </div>
              )}
            </ResultCard>

            {}
            <ResultCard title="Company Location" subtitle="Geocoding via OSM Nominatim" icon="📍" empty={!data.location} emptyMsg="Data lokasi tidak tersedia">
              {data.location && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <InfoBlock label="Nama Lokasi">
                    <p style={{ fontSize: 12, fontWeight: 700, color: colors.text, margin: 0, lineHeight: 1.5 }}>
                      {data.location.display_name}
                    </p>
                  </InfoBlock>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <InfoBlock label="Latitude">
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: colors.text }}>{data.location.latitude}</span>
                    </InfoBlock>
                    <InfoBlock label="Longitude">
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: colors.text }}>{data.location.longitude}</span>
                    </InfoBlock>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <InfoBlock label="Importance">
                      <span style={{ fontSize: 12, color: colors.text, fontWeight: 600 }}>{typeof data.location.importance === 'number' ? data.location.importance.toFixed(4) : data.location.importance}</span>
                    </InfoBlock>
                    <InfoBlock label="OSM Type">
                      <span style={{ fontSize: 12, color: colors.text, fontWeight: 600, textTransform: 'uppercase' }}>{data.location.osm_type}</span>
                    </InfoBlock>
                  </div>

                  {Object.keys(data.location.address).length > 0 && (
                    <InfoBlock label="Alamat Detail">
                      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, maxHeight: 140, overflowY: 'auto', padding: '6px 0' }}>
                        {Object.entries(data.location.address).map(([key, val], i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', borderBottom: `1px solid ${colors.border}` }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: 10, color: colors.text, fontWeight: 600, textAlign: 'right' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </InfoBlock>
                  )}
                </div>
              )}
            </ResultCard>
          </div>
        )}

        {}
        {rawJson && (
          <div style={{ width: '100%', border: `1px solid ${colors.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <button
              onClick={() => setShowJson(!showJson)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '14px 20px',
                background: colors.surface, border: 'none',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: 14, color: colors.text,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{'</>'}</span> Lihat Raw JSON Response
              </span>
              <span style={{ transform: showJson ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 18 }}>▾</span>
            </button>
            {showJson && (
              <pre style={{
                background: '#0F172A', color: '#34D399',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, padding: 24,
                margin: 0, overflowX: 'auto', maxHeight: 500,
              }}>
                <code>{JSON.stringify(rawJson, null, 2)}</code>
              </pre>
            )}
          </div>
        )}
      </main>

      {}
      <footer style={{ borderTop: `1px solid ${colors.border}`, padding: '24px 32px', background: '#F8FAFC' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12, color: colors.textMuted }}>
          <span>© {new Date().getFullYear()} Company Lookup. All rights reserved.</span>
          <span>Developed by <span style={{ color: colors.accent, fontWeight: 600 }}>Arden Pratama Maskuri</span></span>
        </div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${colors.surface}; }
        ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
      `}</style>
    </div>
  );
}


function ResultCard({ title, subtitle, icon, empty, emptyMsg, children }: {
  title: string; subtitle: string; icon: string;
  empty: boolean; emptyMsg: string; children?: React.ReactNode;
}): React.ReactElement {
  const cardColors = { border: '#E2E8F0', text: '#0F172A', textMuted: '#64748B' };
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${cardColors.border}`, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 16px -6px rgba(0, 0, 0, 0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 24, width: 44, height: 44, background: '#F0F7FF', border: '1px solid #D0E7FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: cardColors.text, margin: '0 0 2px 0' }}>{title}</h2>
          <p style={{ fontSize: 11, color: cardColors.textMuted, margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      {empty ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, border: `1.5px dashed ${cardColors.border}`, borderRadius: 12, color: cardColors.textMuted, fontSize: 13, fontStyle: 'italic' }}>
          {emptyMsg}
        </div>
      ) : children}
    </div>
  );
}


function InfoBlock({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  const blockColors = { border: '#E2E8F0', textMuted: '#64748B' };
  return (
    <div style={{ background: '#F8FAFC', border: `1px solid ${blockColors.border}`, borderRadius: 10, padding: '8px 12px' }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: blockColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px 0' }}>{label}</p>
      {children}
    </div>
  );
}

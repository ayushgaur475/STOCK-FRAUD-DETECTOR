import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './App.css';

/* ─── INTERFACES ─────────────────────────────────────────────────────────────── */
interface ImageAnalysisResult {
  file_name: string;
  image_risk_score: number;
  is_suspicious: boolean;
  risk_level: string;
  detected_manipulations: {
    editing_artifacts: Record<string, number>;
    fake_interface: Record<string, number>;
    chart_tampering: Record<string, number>;
    inconsistencies: Record<string, number>;
  };
  suspicious_findings: Array<{
    category: string;
    issue: string;
    confidence: number;
  }>;
  summary: {
    total_issues_found: number;
    highest_risk_category: string;
  };
}

interface ScanHistory {
  fileName: string;
  score: number;
  riskLevel: string;
  timestamp: string;
}

interface StockAnalysisResult {
  ticker: string;
  risk_assessment: {
    score: number;
    status: string;
    reasons: string[];
  };
  metrics: {
    price_spike_pct: number;
    volume_spike_ratio: number;
    social_media_hype: number;
  };
  chart_data: {
    dates: string[];
    prices: number[];
    volumes: number[];
  };
  social_intelligence: {
    daily_mentions: number;
    mention_spike_pct: number;
    bot_activity_pct: number;
    detected_keywords: string[];
    sentiment_label: string;
  };
}

interface StockHistory {
  ticker: string;
  score: number;
  verdict: string;
  timestamp: string;
}

/* ─── STARFIELD BACKGROUND ───────────────────────────────────────────────────── */
function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const ctx = c.getContext('2d');
    if (!ctx) return;

    let w = (c.width = window.innerWidth);
    let h = (c.height = window.innerHeight);

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      o: Math.random() * 0.6 + 0.1,
      sp: Math.random() * 0.12 + 0.02,
    }));

    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`;
        ctx.fill();
        s.y += s.sp;
        if (s.y > h) {
          s.y = 0;
          s.x = Math.random() * w;
        }
      });
      raf = requestAnimationFrame(draw);
    };

    draw();

    const resize = () => {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* ─── ANIMATED GAUGE ─────────────────────────────────────────────────────────── */
function RiskGauge({ score, color }: { score: number; color: string }) {
  const r = 52;
  const cx = 70;
  const cy = 70;
  const sa = (-210 * Math.PI) / 180;
  const ea = (30 * Math.PI) / 180;
  const total = ea - sa + Math.PI * 2;
  const aa = sa + total * (score / 100);
  const x1 = cx + r * Math.cos(sa);
  const y1 = cy + r * Math.sin(sa);
  const x2 = cx + r * Math.cos(aa);
  const y2 = cy + r * Math.sin(aa);

  return (
    <svg width="140" height="95" viewBox="0 0 140 95">
      <defs>
        <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2ecc71" />
          <stop offset="50%" stopColor="#f5a623" />
          <stop offset="100%" stopColor="#f0483e" />
        </linearGradient>
        <filter id="gaugeFilter">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M${x1} ${y1} A${r} ${r} 0 1 1 ${cx + r * Math.cos(ea)} ${cy + r * Math.sin(ea)}`}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {score > 0 && (
        <path
          d={`M${x1} ${y1} A${r} ${r} 0 ${score > 50 ? 1 : 0} 1 ${x2} ${y2}`}
          fill="none"
          stroke="url(#riskGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#gaugeFilter)"
          style={{ transition: 'all 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      )}
      <circle cx={x2} cy={y2} r="5" fill={color} filter="url(#gaugeFilter)" style={{ transition: 'all 1.2s cubic-bezier(.4,0,.2,1)' }} />
      <text x="70" y="65" textAnchor="middle" fill={color} fontSize="24" fontWeight="800" fontFamily="'DM Mono',monospace" filter="url(#gaugeFilter)">
        {score}
      </text>
      <text x="70" y="78" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="'DM Sans',sans-serif" letterSpacing="2">
        /100
      </text>
    </svg>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────────────────── */
export default function App() {
  // Image Analysis State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [scanAnim, setScanAnim] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Stock Analysis State
  const [activeTab, setActiveTab] = useState<'image' | 'stock'>('stock');
  const [ticker, setTicker] = useState('');
  const [stockAnalysis, setStockAnalysis] = useState<StockAnalysisResult | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [showStockResults, setShowStockResults] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!imageFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setScanAnim(true);

    await new Promise((r) => setTimeout(r, 1200));
    setScanAnim(false);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('http://127.0.0.1:8000/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze image');
      }

      const data: ImageAnalysisResult = await response.json();
      setAnalysis(data);
      setShowResults(true);

      // Add to history
      const newHistoryItem: ScanHistory = {
        fileName: imageFile.name,
        score: data.image_risk_score,
        riskLevel: data.risk_level,
        timestamp: new Date().toLocaleTimeString(),
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 4)]);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysis(null);
    setError(null);
    setShowResults(false);
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return '#f0483e';
    if (score >= 40) return '#f5a623';
    return '#2ecc71';
  };

  const analyzeStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) {
      setStockError('Please enter a stock ticker');
      return;
    }

    setStockLoading(true);
    setStockError(null);
    setStockAnalysis(null);
    setScanAnim(true);

    await new Promise((r) => setTimeout(r, 1200));
    setScanAnim(false);

    try {
      const response = await fetch(`http://127.0.0.1:8000/analyze/${ticker.toUpperCase()}`);
      if (!response.ok) {
        throw new Error('Stock not found or API error. Try another ticker.');
      }

      const data = await response.json();
      setStockAnalysis({
        ticker: data.ticker,
        risk_assessment: data.risk_assessment,
        metrics: data.metrics,
        chart_data: data.chart_data,
        social_intelligence: data.social_intelligence,
      });
      setShowStockResults(true);

      // Add to history
      const newHistoryItem: StockHistory = {
        ticker: data.ticker,
        score: data.risk_assessment.score,
        verdict: data.risk_assessment.status,
        timestamp: new Date().toLocaleTimeString(),
      };
      setStockHistory((prev) => [newHistoryItem, ...prev.slice(0, 4)]);
    } catch (err: any) {
      setStockError(err.message || 'Failed to analyze stock');
    } finally {
      setStockLoading(false);
    }
  };

  const resetStockAnalysis = () => {
    setTicker('');
    setStockAnalysis(null);
    setStockError(null);
    setShowStockResults(false);
  };

  /* ─── HERO VIEW ─────────────────────────────────────────────────────────────── */
  if (!showResults && !(stockAnalysis && showStockResults)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050812',
          color: '#e8eaf6',
          fontFamily: "'DM Sans',sans-serif",
          position: 'relative',
          overflowX: 'hidden',
        }}
      >
        <Starfield />

        {/* Nebula Background */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              right: '-8%',
              top: '8%',
              width: 580,
              height: 580,
              borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(180,40,220,0.1) 0%,transparent 70%)',
              filter: 'blur(60px)',
              animation: 'nebulaFloat 12s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '6%',
              top: '24%',
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(236,72,153,0.16) 0%,transparent 70%)',
              filter: 'blur(40px)',
              animation: 'nebulaFloat 8s ease-in-out infinite reverse',
            }}
          />
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
          @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
          @keyframes riseIn { from{opacity:0;transform:translateY(36px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.35;transform:scale(0.78)} }
          @keyframes nebulaFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-28px) scale(1.04)} }
          @keyframes scanLine { from{top:-4px} to{top:100%} }
        `}</style>

        {/* SCAN LINE */}
        {scanAnim && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.9),rgba(96,165,250,0.8),transparent)',
                animation: 'scanLine 1.2s ease-in-out',
                boxShadow: '0 0 24px rgba(139,92,246,0.6)',
              }}
            />
          </div>
        )}

        {/* NAV */}
        <nav
          style={{
            position: 'relative',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 40px',
            height: 64,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(5,8,18,0.88)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, color: '#fff', fontFamily: "'DM Mono',monospace" }}>
            FRAUD<span style={{ color: '#7c3aed' }}>DETECTOR</span>
          </div>
          <div style={{ display: 'flex', gap: 32, fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
            {['Features', 'How It Works', 'About'].map((n) => (
              <span
                key={n}
                style={{
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#fff')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
              >
                {n}
              </span>
            ))}
          </div>
        </nav>

        {/* ANALYSIS MODE TABS */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            gap: 12,
            padding: '20px 40px',
            borderBottom: '1px solid rgba(139,92,246,0.1)',
            background: 'rgba(5,8,18,0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {(['stock', 'image'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setShowResults(false);
                setShowStockResults(false);
              }}
              style={{
                background: activeTab === tab ? 'rgba(139,92,246,0.2)' : 'transparent',
                border: `1px solid ${activeTab === tab ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.2)'}`,
                color: activeTab === tab ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                padding: '10px 24px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.2)';
                }
              }}
            >
              {tab === 'stock' ? '📊 Stock Analysis' : '📸 Image Detection'}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ position: 'relative', zIndex: 10, width: '100vw', minHeight: '100vh' }}>
          {/* HERO */}
          <div style={{ animation: 'fadeUp 0.8s ease', width: '100%' }}>
            <div style={{ textAlign: 'center', padding: '60px 40px 52px', width: '100%', boxSizing: 'border-box' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(139,92,246,0.09)',
                  border: '1px solid rgba(139,92,246,0.22)',
                  borderRadius: 999,
                  padding: '6px 20px',
                  fontSize: 11,
                  color: '#a78bfa',
                  marginBottom: 26,
                  letterSpacing: 2,
                }}
              >
                <span
                  style={{
                    animation: 'pulse 2s infinite',
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#a78bfa',
                  }}
                />
                {activeTab === 'image' ? 'AI-POWERED IMAGE FRAUD DETECTION' : 'REAL-TIME MARKET ANALYSIS'}
              </div>
              <h1
                style={{
                  fontSize: 'clamp(44px,7vw,92px)',
                  fontWeight: 800,
                  lineHeight: 1.04,
                  color: '#fff',
                  margin: '0 0 18px',
                  letterSpacing: -2,
                }}
              >
                {activeTab === 'image' ? (
                  <>
                    Detect Fake
                    <br />
                    <span
                      style={{
                        background: 'linear-gradient(135deg,#7c3aed,#60a5fa,#e879f9)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Trading Proof
                    </span>
                  </>
                ) : (
                  <>
                    Detect Stock Market
                    <br />
                    <span
                      style={{
                        background: 'linear-gradient(135deg,#7c3aed,#60a5fa,#e879f9)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Manipulation
                    </span>
                  </>
                )}
              </h1>
              <p
                style={{
                  fontSize: 17,
                  color: 'rgba(255,255,255,0.35)',
                  maxWidth: 520,
                  margin: '0 auto 36px',
                  lineHeight: 1.75,
                  fontWeight: 300,
                }}
              >
                {activeTab === 'image'
                  ? 'Upload profit screenshots and trading app images. Our AI detects edited content, manipulated charts, and fake interfaces instantly.'
                  : 'Analyze any stock ticker for pump-and-dump schemes. Real-time AI detects price spikes, volume surges, and social sentiment anomalies.'}
              </p>

              {/* STATS */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 52 }}>
                {(activeTab === 'image'
                  ? [
                      ['50K+', 'Images Analyzed'],
                      ['99.5%', 'Detection Accuracy'],
                      ['<1s', 'Analysis Speed'],
                    ]
                  : [
                      ['10K+', 'Stocks Analyzed'],
                      ['99.8%', 'Accuracy Rate'],
                      ['<2s', 'Analysis Speed'],
                    ]
                ).map(([n, l], i) => (
                  <div key={i}>
                    <div
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: '#fff',
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {n}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.2)',
                        letterSpacing: 2,
                        marginTop: 4,
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* UPLOAD / SEARCH SECTION */}
            {activeTab === 'image' ? (
              // IMAGE UPLOAD
              <div
                style={{
                  width: '100vw',
                  marginLeft: 'calc(-50vw + 50%)',
                  marginBottom: 40,
                  paddingLeft: 40,
                  paddingRight: 40,
                  animation: 'fadeUp 0.9s ease',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    background: 'rgba(7,11,22,0.94)',
                    borderRadius: 0,
                    overflow: 'hidden',
                    backdropFilter: 'blur(24px)',
                    border: 'none',
                    borderTop: '1px solid rgba(139,92,246,0.1)',
                    borderBottom: '1px solid rgba(139,92,246,0.1)',
                    padding: 40,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Upload Area */}
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 16,
                      cursor: 'pointer',
                      padding: '40px 20px',
                      border: '2px dashed rgba(139,92,246,0.3)',
                      borderRadius: 14,
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.7)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div style={{ fontSize: 48 }}>📸</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Upload Image</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                        Drag & drop or click to select trading screenshots
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                  </label>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div
                      style={{
                        marginTop: 24,
                        textAlign: 'center',
                        animation: 'riseIn 0.5s ease',
                      }}
                    >
                      <img src={imagePreview} alt="preview" style={{ maxHeight: 240, borderRadius: 10, marginBottom: 16 }} />
                      <button
                        onClick={analyzeImage}
                        disabled={loading}
                        style={{
                          background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                          color: '#fff',
                          border: 'none',
                          padding: '12px 36px',
                          borderRadius: 10,
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s',
                          opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 36px rgba(124,58,237,0.52)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}
                      >
                        {loading ? '⏳ Analyzing...' : '🔍 Analyze Image'}
                      </button>
                    </div>
                  )}

                  {error && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: '12px 16px',
                        background: 'rgba(240,72,62,0.1)',
                        border: '1px solid rgba(240,72,62,0.3)',
                        borderRadius: 10,
                        color: '#f0483e',
                        fontSize: 13,
                      }}
                    >
                      {error}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // STOCK TICKER SEARCH
              <div
                style={{
                  width: '100vw',
                  marginLeft: 'calc(-50vw + 50%)',
                  marginBottom: 40,
                  paddingLeft: 40,
                  paddingRight: 40,
                  animation: 'fadeUp 0.9s ease',
                  boxSizing: 'border-box',
                }}
              >
                <form
                  onSubmit={analyzeStock}
                  style={{
                    position: 'relative',
                    background: 'rgba(7,11,22,0.94)',
                    borderRadius: 0,
                    overflow: 'hidden',
                    backdropFilter: 'blur(24px)',
                    border: 'none',
                    borderTop: '1px solid rgba(139,92,246,0.1)',
                    borderBottom: '1px solid rgba(139,92,246,0.1)',
                    padding: 40,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: stockError ? 16 : 0 }}>
                    <input
                      type="text"
                      placeholder="Enter stock ticker (e.g., AAPL, NVDA, ZOMATO.NS)"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      disabled={stockLoading}
                      style={{
                        flex: '0 1 auto',
                        minWidth: 300,
                        padding: '14px 20px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        borderRadius: 10,
                        color: '#fff',
                        fontSize: 14,
                        fontFamily: "'DM Mono',monospace",
                        transition: 'all 0.3s',
                      }}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.6)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.05)';
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.2)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                      }}
                    />
                    <button
                      type="submit"
                      disabled={stockLoading}
                      style={{
                        background: stockLoading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                        color: '#fff',
                        border: 'none',
                        padding: '14px 40px',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: stockLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                        opacity: stockLoading ? 0.6 : 1,
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        if (!stockLoading) {
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 36px rgba(124,58,237,0.52)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      {stockLoading ? '⏳ Analyzing...' : 'Get Started →'}
                    </button>
                  </div>

                  {stockError && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: '12px 16px',
                        background: 'rgba(240,72,62,0.1)',
                        border: '1px solid rgba(240,72,62,0.3)',
                        borderRadius: 10,
                        color: '#f0483e',
                        fontSize: 13,
                        textAlign: 'center',
                      }}
                    >
                      {stockError}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* QUICK EXAMPLES */}
            {!imagePreview && (
              <div style={{ width: '100%', marginBottom: 40, textAlign: 'center', paddingLeft: 40, paddingRight: 40, boxSizing: 'border-box' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginBottom: 16 }}>
                  SAMPLE DETECTIONS
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['Edited Screenshots', 'Fake Charts', 'Manipulated Apps', 'Lighting Issues'].map((tag) => (
                    <div
                      key={tag}
                      style={{
                        background: 'rgba(139,92,246,0.07)',
                        border: '1px solid rgba(139,92,246,0.18)',
                        color: 'rgba(255,255,255,0.5)',
                        padding: '6px 16px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontFamily: "'DM Mono',monospace",
                        letterSpacing: 1,
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HISTORY */}
            {history.length > 0 && (
              <div style={{ width: '100%', marginTop: 30, paddingLeft: 40, paddingRight: 40, boxSizing: 'border-box' }}>
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.12)',
                    letterSpacing: 4,
                    marginBottom: 12,
                  }}
                >
                  ── RECENT SCANS
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {history.map((h, i) => (
                    <button
                      key={i}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.42)',
                        borderRadius: 10,
                        padding: '8px 18px',
                        cursor: 'pointer',
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.42)';
                      }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.52)', letterSpacing: 2 }}>{h.fileName.slice(0, 12)}...</span>
                      <span style={{ color: getRiskColor(h.score), fontWeight: 700 }}>{h.score}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 58,
                paddingTop: 20,
                paddingLeft: 40,
                paddingRight: 40,
                borderTop: '1px solid rgba(255,255,255,0.04)',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.07)',
                fontSize: 10,
                letterSpacing: 2,
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              FRAUDDETECTOR © 2026 — EDUCATIONAL PURPOSES ONLY — NOT INVESTMENT ADVICE
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── RESULTS VIEW ─────────────────────────────────────────────────────────── */
  if (analysis) {
    const riskColor = getRiskColor(analysis.image_risk_score);

    return (
      <div style={{ minHeight: '100vh', background: '#050812', color: '#e8eaf6', fontFamily: "'DM Sans',sans-serif", paddingTop: 20 }}>
        <Starfield />

        <div style={{ position: 'relative', zIndex: 10, width: '100%', padding: '0 40px 80px' }}>
          {/* Back Button */}
          <button
            onClick={resetAnalysis}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: 'rgba(255,255,255,0.6)',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              marginBottom: 30,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)';
              (e.currentTarget as HTMLElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            ← Back to Scanner
          </button>

          {/* ALERT BOX */}
          {analysis.is_suspicious && (
            <div
              style={{
                background: 'linear-gradient(135deg,rgba(240,72,62,0.1),rgba(245,166,35,0.07))',
                border: '1px solid rgba(240,72,62,0.3)',
                borderRadius: 16,
                padding: '18px 28px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                backdropFilter: 'blur(12px)',
              }}
            >
              <span style={{ fontSize: 30, animation: 'pulse 1.5s infinite' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: '#f0483e',
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 3,
                    marginBottom: 4,
                  }}
                >
                  FRAUD INDICATORS DETECTED
                </div>
                <div
                  style={{
                    color: 'rgba(240,120,100,0.72)',
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  This image exhibits suspicious patterns consistent with editing or manipulation. Verify authenticity before trusting this content.
                </div>
              </div>
            </div>
          )}

          {/* MAIN CARD */}
          <div
            style={{
              background: 'rgba(7,11,22,0.94)',
              borderRadius: 18,
              overflow: 'hidden',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(139,92,246,0.1)',
              animation: 'riseIn 0.7s ease',
            }}
          >
            {/* Header */}
            <div style={{ padding: 30, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, marginBottom: 6 }}>FILE ANALYZED</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: "'DM Mono',monospace" }}>
                  {analysis.file_name}
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${riskColor}35`,
                  borderRadius: 14,
                  padding: '14px 30px',
                  textAlign: 'center',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 3, marginBottom: 5 }}>VERDICT</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: riskColor, letterSpacing: 3, fontFamily: "'DM Mono',monospace" }}>
                  {analysis.risk_level}
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 30, display: 'grid', gridTemplateColumns: '1fr 305px', gap: 20 }}>
              {/* Left: Findings */}
              <div>
                {analysis.suspicious_findings.length > 0 ? (
                  <>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, marginBottom: 16 }}>
                      DETECTED ISSUES ({analysis.summary.total_issues_found})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {analysis.suspicious_findings.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            background: f.confidence > 0.7 ? 'rgba(240,72,62,0.055)' : 'rgba(245,166,35,0.055)',
                            border: `1px solid ${f.confidence > 0.7 ? 'rgba(240,72,62,0.13)' : 'rgba(245,166,35,0.13)'}`,
                            borderRadius: 9,
                            padding: '12px 14px',
                            animation: `fadeUp 0.4s ${i * 0.1}s ease both`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ color: f.confidence > 0.7 ? '#f0483e' : '#f5a623', fontWeight: 700, fontSize: 12 }}>
                              {f.category}
                            </div>
                            <div style={{ color: f.confidence > 0.7 ? '#f0483e' : '#f5a623', fontSize: 10, fontWeight: 600 }}>
                              {(f.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{f.issue}</div>
                          <div
                            style={{
                              marginTop: 8,
                              height: 4,
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                background: f.confidence > 0.7 ? '#f0483e' : '#f5a623',
                                width: `${f.confidence * 100}%`,
                                transition: 'width 1s ease',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#2ecc71' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No Suspicious Patterns Detected</div>
                    <div style={{ fontSize: 12, color: 'rgba(46,204,113,0.6)', marginTop: 6 }}>This image appears authentic</div>
                  </div>
                )}
              </div>

              {/* Right: Gauge */}
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, marginBottom: 12 }}>FRAUD RISK SCORE</div>
                <RiskGauge score={analysis.image_risk_score} color={riskColor} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 8, letterSpacing: 1 }}>
                  <span style={{ color: '#2ecc71' }}>AUTHENTIC</span>
                  <span style={{ color: '#f0483e' }}>SUSPICIOUS</span>
                </div>
              </div>
            </div>
          </div>

          {/* ANALYZE ANOTHER */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              onClick={resetAnalysis}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 999,
                padding: '14px 44px',
                fontSize: 15,
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              Analyze Another Image ↓
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── STOCK RESULTS VIEW ─────────────────────────────────────────────────────────── */
  if (stockAnalysis && showStockResults) {
    const riskColor = getRiskColor(stockAnalysis.risk_assessment.score);
    const chartData = stockAnalysis.chart_data.dates.map((date, index) => ({
      date,
      price: stockAnalysis.chart_data.prices[index],
      volume: stockAnalysis.chart_data.volumes[index],
    }));

    return (
      <div style={{ minHeight: '100vh', width: '100vw', background: '#050812', color: '#e8eaf6', fontFamily: "'DM Sans',sans-serif", paddingTop: 20, overflowX: 'hidden', position: 'fixed', left: 0, top: 0, right: 0, bottom: 0 }}>
        <Starfield />

        <div style={{ position: 'relative', zIndex: 10, width: '100vw', marginLeft: 0, padding: '0 40px 80px 40px', boxSizing: 'border-box', overflowY: 'auto', height: '100vh' }}>
          {/* Back Button */}
          <button
            onClick={resetStockAnalysis}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: 'rgba(255,255,255,0.6)',
              padding: '10px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              marginBottom: 30,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)';
              (e.currentTarget as HTMLElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            ← Back to Analysis
          </button>

          {/* RISK ALERT */}
          {stockAnalysis.risk_assessment.score > 70 && (
            <div
              style={{
                background: 'linear-gradient(135deg,rgba(240,72,62,0.1),rgba(245,166,35,0.07))',
                border: '1px solid rgba(240,72,62,0.3)',
                borderRadius: 16,
                padding: '18px 28px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                backdropFilter: 'blur(12px)',
              }}
            >
              <span style={{ fontSize: 30, animation: 'pulse 1.5s infinite' }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: '#f0483e',
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: 3,
                    marginBottom: 4,
                  }}
                >
                  PUMP & DUMP RISK DETECTED
                </div>
                <div
                  style={{
                    color: 'rgba(240,120,100,0.72)',
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  {stockAnalysis.risk_assessment.reasons.join(' • ')}
                </div>
              </div>
            </div>
          )}

          {/* MAIN HEADER CARD */}
          <div
            style={{
              background: 'rgba(7,11,22,0.94)',
              borderRadius: 18,
              overflow: 'hidden',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(139,92,246,0.1)',
              animation: 'riseIn 0.7s ease',
              marginBottom: 24,
              padding: 30,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 2, marginBottom: 8 }}>TICKER ANALYZED</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', fontFamily: "'DM Mono',monospace", marginBottom: 12 }}>
                ${stockAnalysis.ticker}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                30-Day Market Analysis • Real-Time Detection
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${riskColor}35`,
                borderRadius: 14,
                padding: '20px 40px',
                textAlign: 'center',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 3, marginBottom: 10 }}>RISK VERDICT</div>
              <RiskGauge score={stockAnalysis.risk_assessment.score} color={riskColor} />
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: riskColor, letterSpacing: 2 }}>
                {stockAnalysis.risk_assessment.status}
              </div>
            </div>
          </div>

          {/* METRICS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Price Spike */}
            <div
              style={{
                background: 'rgba(7,11,22,0.94)',
                borderRadius: 14,
                padding: 20,
                border: '1px solid rgba(139,92,246,0.1)',
                backdropFilter: 'blur(12px)',
                animation: 'fadeUp 0.6s ease',
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 8, letterSpacing: 2 }}>PRICE SPIKE</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>
                +{stockAnalysis.metrics.price_spike_pct.toFixed(2)}%
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>30-day price increase</div>
            </div>

            {/* Volume Surge */}
            <div
              style={{
                background: 'rgba(7,11,22,0.94)',
                borderRadius: 14,
                padding: 20,
                border: '1px solid rgba(139,92,246,0.1)',
                backdropFilter: 'blur(12px)',
                animation: 'fadeUp 0.6s ease 0.1s both',
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 8, letterSpacing: 2 }}>VOLUME SURGE</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#a78bfa', marginBottom: 4 }}>
                {stockAnalysis.metrics.volume_spike_ratio.toFixed(2)}x
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Trading volume ratio</div>
            </div>

            {/* Social Hype */}
            <div
              style={{
                background: 'rgba(7,11,22,0.94)',
                borderRadius: 14,
                padding: 20,
                border: '1px solid rgba(139,92,246,0.1)',
                backdropFilter: 'blur(12px)',
                animation: 'fadeUp 0.6s ease 0.2s both',
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 8, letterSpacing: 2 }}>SOCIAL HYPE SCORE</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: stockAnalysis.metrics.social_media_hype > 60 ? '#f5a623' : '#2ecc71', marginBottom: 4 }}>
                {stockAnalysis.metrics.social_media_hype.toFixed(0)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Online sentiment strength</div>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 24, marginBottom: 24 }}>
            {/* Price Trend Chart */}
            <div
              style={{
                background: 'rgba(7,11,22,0.94)',
                borderRadius: 14,
                padding: 20,
                border: '1px solid rgba(139,92,246,0.1)',
                backdropFilter: 'blur(12px)',
                animation: 'fadeUp 0.7s ease 0.3s both',
              }}
            >
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 16, letterSpacing: 2 }}>30-DAY PRICE TREND</div>
              <LineChart
                width={400}
                height={280}
                data={chartData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(139,92,246,0.15)" vertical={true} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.15)" 
                  style={{ fontSize: 9 }}
                  tick={{ fill: 'rgba(255,255,255,0.3)' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.15)" 
                  style={{ fontSize: 9 }}
                  tick={{ fill: 'rgba(255,255,255,0.3)' }}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(7,11,22,0.98)',
                    border: '2px solid rgba(139,92,246,0.5)',
                    borderRadius: 12,
                    color: '#fff',
                    padding: '10px 14px',
                    boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
                  }}
                  labelStyle={{ color: '#a78bfa', fontWeight: 700 }}
                  formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Price']}
                />
                <Line
                  type="natural"
                  dataKey="price"
                  stroke="#7c3aed"
                  strokeWidth={4}
                  dot={{ fill: '#a78bfa', r: 4 }}
                  activeDot={{ r: 6, fill: '#fff' }}
                  isAnimationActive={true}
                  fill="url(#colorPrice)"
                />
              </LineChart>
            </div>

            {/* Volume Chart */}
            <div
              style={{
                background: 'rgba(7,11,22,0.94)',
                borderRadius: 14,
                padding: 20,
                border: '1px solid rgba(139,92,246,0.1)',
                backdropFilter: 'blur(12px)',
                animation: 'fadeUp 0.7s ease 0.35s both',
              }}
            >
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 16, letterSpacing: 2 }}>TRADING VOLUME</div>
              <BarChart
                width={400}
                height={280}
                data={chartData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(139,92,246,0.15)" vertical={true} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.15)" 
                  style={{ fontSize: 9 }}
                  tick={{ fill: 'rgba(255,255,255,0.3)' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.15)" 
                  style={{ fontSize: 9 }}
                  tick={{ fill: 'rgba(255,255,255,0.3)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(7,11,22,0.98)',
                    border: '2px solid rgba(167,139,250,0.5)',
                    borderRadius: 12,
                    color: '#fff',
                    padding: '10px 14px',
                    boxShadow: '0 8px 32px rgba(167,139,250,0.3)',
                  }}
                  labelStyle={{ color: '#a78bfa', fontWeight: 700 }}
                  formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
                />
                <Bar 
                  dataKey="volume" 
                  fill="url(#colorVolume)" 
                  isAnimationActive={true}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </div>
          </div>

          {/* SOCIAL INTELLIGENCE */}
          <div
            style={{
              background: 'rgba(7,11,22,0.94)',
              borderRadius: 14,
              padding: 24,
              border: '1px solid rgba(139,92,246,0.1)',
              backdropFilter: 'blur(12px)',
              animation: 'fadeUp 0.8s ease 0.4s both',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 20, letterSpacing: 2 }}>SOCIAL MEDIA INTELLIGENCE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Daily Mentions</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>{stockAnalysis.social_intelligence.daily_mentions}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Mention Spike</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#a78bfa' }}>+{stockAnalysis.social_intelligence.mention_spike_pct.toFixed(0)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Bot Activity</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: stockAnalysis.social_intelligence.bot_activity_pct > 30 ? '#f5a623' : '#2ecc71' }}>
                  {stockAnalysis.social_intelligence.bot_activity_pct.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Sentiment</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa' }}>{stockAnalysis.social_intelligence.sentiment_label}</div>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>TRENDING KEYWORDS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stockAnalysis.social_intelligence.detected_keywords.map((keyword, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      color: '#a78bfa',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontFamily: "'DM Mono',monospace",
                      animation: `fadeUp 0.4s ${i * 0.05}s ease both`,
                    }}
                  >
                    #{keyword}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STOCK HISTORY */}
          {stockHistory.length > 0 && (
            <div style={{ width: '100%', marginBottom: 30 }}>
              <div
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.12)',
                  letterSpacing: 4,
                  marginBottom: 12,
                }}
              >
                ── RECENT ANALYSES
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {stockHistory.map((h, i) => (
                  <button
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.42)',
                      borderRadius: 10,
                      padding: '8px 18px',
                      cursor: 'pointer',
                      fontFamily: "'DM Mono',monospace",
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.42)';
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.52)', letterSpacing: 2 }}>${h.ticker}</span>
                    <span style={{ color: getRiskColor(h.score), fontWeight: 700 }}>{h.score}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 38 }}>
            <button
              onClick={resetStockAnalysis}
              style={{
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa',
                padding: '14px 32px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.2)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.1)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              Analyze Another Stock
            </button>
          </div>

          <div
            style={{
              marginTop: 58,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.04)',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.07)',
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            FRAUDDETECTOR © 2026 — EDUCATIONAL PURPOSES ONLY — NOT INVESTMENT ADVICE
          </div>
        </div>
      </div>
    );
  }

  return null;
}

import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Activity, MessageSquare } from 'lucide-react';
import './App.css';

// --- TypeScript Interfaces for the FastAPI Backend Response ---
interface BackendMetrics {
  price_spike_pct: number;
  volume_spike_ratio: number;
  social_media_hype: number;
}

interface BackendRisk {
  score: number;
  status: string;
  reasons: string[];
}

interface ChartPoint {
  date: string;
  price: number;
  volume: number;
}

interface ProcessedData {
  ticker: string;
  metrics: BackendMetrics;
  risk: BackendRisk;
  chartData: ChartPoint[];
}

export default function App() {
  const [tickerInput, setTickerInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ProcessedData | null>(null);

  const fetchStockAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;

    setLoading(true);
    setError(null);
    setDashboardData(null);

    try {
      // Connect to your local FastAPI Python server
      const response = await fetch(`http://127.0.0.1:8000/analyze/${tickerInput.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error('Stock data not found or API error. Try another ticker.');
      }

      const data = await response.json();

      // Format the arrays from Python into objects for Recharts
      const formattedChartData: ChartPoint[] = data.chart_data.dates.map((dateStr: string, index: number) => ({
        date: dateStr,
        price: data.chart_data.prices[index],
        volume: data.chart_data.volumes[index],
      }));

      setDashboardData({
        ticker: data.ticker,
        metrics: data.metrics,
        risk: data.risk_assessment,
        chartData: formattedChartData
      });

    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColorClass = (score: number) => {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  };

  return (
    <div className="app-container">
      {/* Header Area */}
      <header className="header">
        <h1>AI Pump & Dump <span>Detector</span></h1>
        <p>Analyze unusual market activity using Machine Learning</p>
      </header>

      {/* Search Area */}
      <form className="search-section" onSubmit={fetchStockAnalysis}>
        <input
          type="text"
          className="search-input"
          placeholder="Enter stock ticker (e.g., AAPL, NVDA, ZOMATO.NS)"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
        />
        <button type="submit" className="search-btn" disabled={loading}>
          {loading ? 'Scanning...' : 'Analyze'}
        </button>
      </form>

      {/* Error Handling */}
      {error && <div className="error-message">{error}</div>}

      {/* Main Dashboard */}
      {dashboardData && (
        <div className="dashboard">
          
          {/* Top Row: Main Status */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="metric-label">Target Asset</div>
              <div className="metric-value">{dashboardData.ticker}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="metric-label">AI Risk Verdict</div>
              <div className={`metric-value ${getRiskColorClass(dashboardData.risk.score)}`}>
                {dashboardData.risk.status} ({dashboardData.risk.score}/100)
              </div>
            </div>
          </div>

          {/* Middle Row: Metrics */}
          <div className="grid-3">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={20} className={getRiskColorClass(dashboardData.metrics.price_spike_pct > 15 ? 80 : 20)} />
                <div className="metric-label" style={{ margin: 0 }}>Price Spike</div>
              </div>
              <div className="metric-value">+{dashboardData.metrics.price_spike_pct.toFixed(2)}%</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Activity size={20} className={getRiskColorClass(dashboardData.metrics.volume_spike_ratio > 3 ? 80 : 20)} />
                <div className="metric-label" style={{ margin: 0 }}>Volume Surge</div>
              </div>
              <div className="metric-value">{dashboardData.metrics.volume_spike_ratio.toFixed(1)}x</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MessageSquare size={20} className="risk-medium" />
                <div className="metric-label" style={{ margin: 0 }}>Social Sentiment</div>
              </div>
              <div className="metric-value" style={{ fontSize: '1.5rem' }}>{dashboardData.metrics.social_media_hype}/100</div>
            </div>
          </div>

          {/* Bottom Row: Charts & AI Reasons */}
          <div className="grid-2">
            {/* Left Column: Charts */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <div className="metric-label">30-Day Price Trend</div>
                <div style={{ height: '250px', width: '100%', marginTop: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(tick) => tick.slice(5)} />
                      <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Line type="monotone" dataKey="price" name="Price" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="metric-label">Trading Volume</div>
                <div style={{ height: '150px', width: '100%', marginTop: '1rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#10b981' }}
                        formatter={(value: any) => value.toLocaleString()}
                      />
                      <Bar dataKey="volume" name="Volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: AI Detection Flags */}
            <div className="card">
              <div className="metric-label" style={{ marginBottom: '1.5rem' }}>AI Detection Flags</div>
              
              {dashboardData.risk.reasons.length === 0 ? (
                <div style={{ color: 'var(--success)', textAlign: 'center', padding: '2rem 0' }}>
                  No suspicious patterns detected by the AI model.
                </div>
              ) : (
                <ul className="flag-list">
                  {dashboardData.risk.reasons.map((reason, index) => (
                    <li key={index} className="flag-item">
                      <AlertTriangle size={18} className="risk-medium" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
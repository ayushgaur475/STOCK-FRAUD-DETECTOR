# 📊 STOCK FRAUD DETECTOR
### Detect Pump-and-Dump Schemes & Manipulated Trading Screenshots

A comprehensive AI-powered fraud detection platform that analyzes stock tickers for manipulation schemes and detects fake trading screenshots using advanced computer vision and NLP.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![React](https://img.shields.io/badge/React-19.2-blue)

---

## 🎯 Features

### 📈 Stock Analysis Mode
- **Real-time Pump-and-Dump Detection**
  - Price spike analysis (%)
  - Volume surge tracking (ratio)
  - AI anomaly detection using Isolation Forest
  - Risk scoring 0-100

- **Social Media Intelligence**
  - Daily mention tracking
  - Bot activity detection
  - Sentiment analysis (NLP)
  - Suspicious keyword detection
  - Mention spike percentage

- **30-Day Market Charts**
  - Interactive price trend visualization
  - Trading volume bars with gradient
  - Hover tooltips with exact values
  - Real data from Yahoo Finance

- **Risk Assessment**
  - Color-coded verdicts (LOW/MODERATE/HIGH RISK)
  - Detailed reasoning for risk scores
  - Historical analysis tracking

### 🖼️ Image Detection Mode
- **Trading Screenshot Analysis**
  - Edited profit screenshots detection
  - Fake trading app interface detection
  - Manipulated charts identification
  - Image compression artifact analysis
  - Lighting & blending inconsistencies

- **Detailed Findings**
  - Suspicious editing indicators
  - Confidence scores per finding
  - Risk category classification
  - Visual manipulation detection

- **Image History**
  - Track recent scans
  - Quick re-analysis of previous images
  - Risk score comparison

---

## 🏗️ Project Structure

```
STOCK-FRAUD-DETECTOR/
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── data_fetcher.py         # Yahoo Finance integration
│   ├── pump_detector.py        # Stock manipulation analysis
│   ├── image_analyzer.py       # Computer vision detection
│   ├── requirements.txt        # Python dependencies
│   └── __pycache__/
│
├── frontend-new/
│   ├── src/
│   │   ├── App.tsx             # Main React component
│   │   ├── App.css             # Styles & animations
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # Global styles
│   │   └── assets/
│   ├── public/                 # Static files
│   ├── index.html              # HTML template
│   ├── package.json            # NPM dependencies
│   ├── vite.config.ts          # Vite configuration
│   └── tsconfig.json           # TypeScript config
│
├── .git/                       # Git repository
├── .gitignore
└── README.md                   # This file
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (async Python web framework)
- **Data Fetching**: yfinance (real stock data)
- **AI/ML**: scikit-learn (Isolation Forest anomaly detection)
- **NLP**: VADER Sentiment Analysis
- **Image Processing**: OpenCV, PIL
- **CORS**: FastAPI middleware for frontend integration
- **Server**: Uvicorn

### Frontend
- **Framework**: React 19.2.0
- **Language**: TypeScript
- **Build Tool**: Vite 7.3.1
- **Charts**: Recharts (LineChart, BarChart)
- **Icons**: lucide-react
- **Styling**: CSS3 with custom animations
- **Canvas**: Animated starfield background

### Infrastructure
- **Version Control**: Git & GitHub
- **Python Env**: Virtual Environment (.venv)
- **Package Manager**: npm (frontend), pip (backend)

---

## 📦 Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- Git
- Windows/MacOS/Linux

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On MacOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**requirements.txt contents:**
```
fastapi
uvicorn
yfinance
pandas
scikit-learn
numpy
vaderSentiment
requests
opencv-python
pillow
python-multipart
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend-new

# Install dependencies
npm install

# Build (if needed)
npm run build
```

---

## 🚀 Running the Project

### 1. Start the Backend Server

```bash
# From backend directory
cd backend

# Activate virtual environment
.venv\Scripts\activate

# Run the server (Option 1 - with reload for development)
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Run the server (Option 2 - direct execution)
python main.py
```

**Expected Output:**
```
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### 2. Start the Frontend Server

```bash
# From frontend-new directory
cd frontend-new

# Start Vite dev server
npm run dev
```

**Expected Output:**
```
  VITE v7.3.1  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:5173/
```

---

## 🔌 API Endpoints

### Root Endpoint
```
GET http://127.0.0.1:8000/
```
**Response:**
```json
{
  "message": "Pump and Dump Detection API is running. Use /analyze/{ticker} to test."
}
```

### Stock Analysis Endpoint
```
GET http://127.0.0.1:8000/analyze/{ticker}
```

**Parameters:**
- `ticker` (string): Stock ticker symbol (e.g., AAPL, META, NVDA)

**Response:**
```json
{
  "ticker": "META",
  "metrics": {
    "price_spike_pct": -1.31,
    "volume_spike_ratio": 1.04,
    "social_media_hype": 5
  },
  "social_intelligence": {
    "daily_mentions": 44,
    "mention_spike_pct": 15.8,
    "bot_activity_pct": 5,
    "detected_keywords": [],
    "sentiment_label": "Neutral"
  },
  "risk_assessment": {
    "score": 0,
    "status": "LOW RISK",
    "reasons": []
  },
  "chart_data": {
    "dates": ["2026-01-23", "2026-01-26", ...],
    "prices": [658.76, 672.36, ...],
    "volumes": [22797700, 16327400, ...]
  }
}
```

### Image Analysis Endpoint
```
POST http://127.0.0.1:8000/analyze-image
```

**Parameters:**
- `file` (multipart/form-data): Image file (JPG, PNG, etc.)

**Response:**
```json
{
  "file_name": "screenshot.png",
  "image_risk_score": 45.23,
  "is_suspicious": true,
  "risk_level": "MEDIUM",
  "detected_manipulations": {
    "editing_artifacts": {...},
    "fake_interface": {...},
    "chart_tampering": {...},
    "inconsistencies": {...}
  },
  "suspicious_findings": [
    {
      "category": "Compression Artifacts",
      "issue": "JPEG compression detected...",
      "confidence": 0.82
    }
  ],
  "summary": {
    "total_issues_found": 3,
    "highest_risk_category": "Compression Artifacts"
  }
}
```

---

## 🎮 Usage Guide

### Stock Analysis Workflow

1. **Open Application** → `http://localhost:5173/`
2. **Click "Stock Analysis" Tab** (default view)
3. **Enter Ticker** → Type stock symbol (e.g., "META", "AAPL", "NVDA")
4. **Click "Get Started"** → API analyzes stock automatically
5. **View Results**:
   - Risk gauge showing 0-100 score
   - Price spike metrics
   - Volume surge ratios
   - Social media hype score
   - 30-day price trending chart
   - Trade volume bar chart
   - Social intelligence section
6. **Analyze Another** → Clear and search new ticker

### Image Detection Workflow

1. **Open Application** → `http://localhost:5173/`
2. **Click "Image Detection" Tab**
3. **Upload Image** → Drag & drop or click to select trading screenshot
4. **View Analysis**:
   - Risk score percentage
   - Suspicious findings list
   - Confidence levels per finding
   - Overall risk verdict
5. **Analyze Another** → Upload different image

### Supported Stock Tickers
- **US Stocks**: AAPL, MSFT, NVDA, TSLA, GME, AMZN, GOOGL, META, IBM, JPM
- **International**: ZOMATO.NS (India), 0700.HK (Hong Kong), SAP.DE (Germany)
- **Any valid Yahoo Finance ticker**

---

## 🧠 How It Works

### Stock Analysis Algorithm

#### 1. **Data Fetching**
- Real 6-month historical data from Yahoo Finance
- Feature engineering: daily returns, moving averages, price/volume spikes

#### 2. **Risk Scoring (100 points max)**

**Market Heuristics (up to 60 points):**
- Price spike > 30% = +30 points
- Price spike > 10% = +15 points
- Volume surge > 5x = +30 points
- Volume surge > 2x = +15 points

**AI Anomaly Detection (up to 20 points):**
- Isolation Forest algorithm detects statistical outliers
- Checks 5-day trading patterns
- Flags unusual trading behavior

**Social Media Intelligence (up to 20 points):**
- Daily mention tracking
- Bot activity detection (0-100%)
- Promotional keyword detection
- Sentiment analysis (Neutral/Promotional/Suspicious)

#### 3. **Risk Verdicts**
- **HIGH RISK (75+)**: Coordinated pump-and-dump scheme
- **MODERATE RISK (40-74)**: Suspicious activity detected
- **LOW RISK (<40)**: Normal trading patterns

### Image Analysis Algorithm

#### 1. **Text Detection**
- Regex-based scam keyword detection
- Profit claim indicators (300%, guaranteed gains, etc.)
- Urgency keywords (buy now, limited spots, etc.)
- VIP promotion red flags (paid groups, WhatsApp tips, etc.)

#### 2. **Computer Vision**
- JPEG compression artifact detection
- Face/object detection for fake interfaces
- Color histogram analysis for editing
- Lighting consistency checks

#### 3. **Risk Calculation**
- Weighted scoring by finding category
- Confidence levels (0-100%) per finding
- Overall risk aggregation

---

## 🎨 Frontend Design System

### Color Palette
```
Primary: #7c3aed (Purple)
Secondary: #a78bfa (Light Purple)
Background: #050812 (Dark Navy)
Success: #2ecc71 (Green)
Warning: #f5a623 (Orange)
Danger: #f0483e (Red)
```

### Key Components
- **Starfield Background**: Canvas-animated stars
- **Risk Gauge**: Animated SVG dial (0-100)
- **Charts**: Recharts with gradients
- **Cards**: Glassmorphism effect (backdrop blur)
- **Animations**: Fade-ups, rise-ins, pulse effects

### Full-Width Responsive Layout
- Uses `100vw` viewport width
- Proper margin compensation
- Mobile-friendly design
- Smooth transitions

---

## 📊 Database & Data Flow

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│ localhost:  │
│   5173      │
└──────┬──────┘
       │
       │ HTTP Requests
       │
┌──────▼──────┐
│   Backend   │ (FastAPI)
│ localhost:  │
│   8000      │
└──────┬──────┘
       │
       ├─→ YFinance (Stock Data)
       ├─→ OpenCV (Image Analysis)
       └─→ scikit-learn (ML Models)
```

---

## 🔐 Security Features

- **CORS Enabled**: Frontend-backend communication allowed
- **Input Validation**: File type and size checks
- **Error Handling**: Graceful error responses
- **Type Safety**: TypeScript frontend, type hints in Python

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process on port 8000 (Windows)
taskkill /F /IM python.exe

# Try different port
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

### Frontend not connecting to backend
- Check backend is running on `http://127.0.0.1:8000`
- Check CORS is enabled in `main.py`
- Check browser console for errors (F12)

### YFinance data not loading
- Check internet connection
- Verify ticker symbol is valid
- Try another ticker (e.g., AAPL)

### Image analysis fails
- Ensure image is valid JPG/PNG
- Check image file size
- Verify OpenCV is installed

---

## 📈 Performance Metrics

| Operation | Time | Notes |
|-----------|------|-------|
| Stock Analysis (API) | 2-5 sec | Depends on network |
| Image Analysis | 1-3 sec | Depends on image size |
| Chart Rendering | <1 sec | 30-day data |
| Page Load | <2 sec | Vite optimization |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👨‍💻 Author

**Ayush Gaur**
- GitHub: [@ayushgaur475](https://github.com/ayushgaur475)
- Project: [STOCK-FRAUD-DETECTOR](https://github.com/ayushgaur475/STOCK-FRAUD-DETECTOR)

---

## 🙏 Acknowledgments

- YFinance for real-time stock data
- scikit-learn for ML algorithms
- React & Vite communities
- FastAPI framework
- Recharts visualization library

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoint responses

---

## 🗓️ Changelog

### v1.0 (March 2026)
- ✅ Stock analysis with pump-and-dump detection
- ✅ Image fraud detection engine
- ✅ 30-day market charts
- ✅ Social media intelligence tracking
- ✅ Full-width responsive UI
- ✅ Risk assessment system
- ✅ Beautiful animations & design

---

**Last Updated**: March 9, 2026
**Status**: Active & Ready for Production

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from data_fetcher import fetch_stock_data
from pump_detector import analyze_stock_for_manipulation

app = FastAPI(title="Stock Pump & Dump Detector API")

# Enable CORS so your React frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Pump and Dump Detection API is running. Use /analyze/{ticker} to test."}

@app.get("/analyze/{ticker}")
def analyze_ticker(ticker: str):
    # 1. Fetch Data
    df = fetch_stock_data(ticker)
    
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="Stock data not found or API error.")

    # 2. Run AI, Rule-based logic, AND the new NLP Sentiment Analysis
    analysis_results = analyze_stock_for_manipulation(df, ticker)
    
    # 3. Format historical data for frontend charts (last 30 days)
    chart_data = df.tail(30).reset_index()
    chart_data['Date'] = chart_data['Date'].dt.strftime('%Y-%m-%d')
    
    historical_chart = {
        "dates": chart_data['Date'].tolist(),
        "prices": chart_data['Close'].round(2).tolist(),
        "volumes": chart_data['Volume'].tolist()
    }

    # 4. Return the COMPLETE JSON payload to frontend
    return {
        "ticker": ticker.upper(),
        "metrics": {
            "price_spike_pct": analysis_results["price_spike_pct"],
            "volume_spike_ratio": analysis_results["volume_spike_ratio"],
            "social_media_hype": analysis_results["social_hype_score"] 
        },
        "social_intelligence": analysis_results["social_intelligence"], # <--- NEW LINE
        "risk_assessment": {
            "score": analysis_results["risk_score"],
            "status": analysis_results["status"],
            "reasons": analysis_results["reasons"]
        },
        "chart_data": historical_chart
    }
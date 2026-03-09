from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from data_fetcher import fetch_stock_data
from pump_detector import analyze_stock_for_manipulation
from image_analyzer import ImagePatternDetector
import numpy as np

app = FastAPI(title="Stock Pump & Dump Detector API")

def convert_numpy_types(obj):
    """
    Recursively convert NumPy types to native Python types for JSON serialization.
    """
    if isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, bool):
        # Check bool before np types since bool is a parent class
        return bool(obj)
    elif hasattr(np, 'bool_') and isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, (np.integer, np.int_, np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

# Initialize image analyzer
image_detector = ImagePatternDetector()

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


@app.post("/analyze-image")
async def analyze_image_upload(file: UploadFile = File(...)):
    """
    Analyze uploaded image for signs of manipulation, fake interfaces, and edited charts.
    Detects:
    - Edited profit screenshots
    - Fake trading app interfaces  
    - Manipulated charts
    - Image compression artifacts
    - Lighting and blending inconsistencies
    """
    try:
        # Read image file
        image_data = await file.read()
        
        if not image_data:
            raise HTTPException(status_code=400, detail="No image data received")
        
        # Verify it's an image
        if not file.content_type or 'image' not in file.content_type:
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Analyze the image
        analysis_results = image_detector.analyze_image(image_data)
        
        if 'error' in analysis_results:
            raise HTTPException(status_code=400, detail=analysis_results['error'])
        
        # Get detailed suspicious findings
        suspicious_details = image_detector.get_suspicious_details(analysis_results)
        
        # Format response
        visual_analysis = analysis_results.get('visual_analysis', {})
        response = {
            "file_name": file.filename,
            "image_risk_score": round(analysis_results['overall_risk_score'] * 100, 2),
            "is_suspicious": analysis_results['is_suspicious'],
            "risk_level": "HIGH" if analysis_results['overall_risk_score'] > 0.7 else "MEDIUM" if analysis_results['overall_risk_score'] > 0.4 else "LOW",
            "detected_manipulations": {
                "editing_artifacts": visual_analysis.get('manipulation_indicators', {}),
                "fake_interface": visual_analysis.get('fake_interface_indicators', {}),
                "chart_tampering": visual_analysis.get('chart_tampering_indicators', {}),
                "inconsistencies": visual_analysis.get('inconsistency_indicators', {})
            },
            "suspicious_findings": suspicious_details,
            "summary": {
                "total_issues_found": len(suspicious_details),
                "highest_risk_category": max(
                    [(cat, max([d['confidence'] for d in suspicious_details if d['category'] == cat], default=0))
                     for cat in set([d['category'] for d in suspicious_details])],
                    key=lambda x: x[1]
                )[0] if suspicious_details else "None"
            }
        }
        
        # Convert NumPy types to native Python types for JSON serialization
        return convert_numpy_types(response)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
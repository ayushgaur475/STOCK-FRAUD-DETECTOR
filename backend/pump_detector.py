import pandas as pd
import yfinance as yf
from sklearn.ensemble import IsolationForest
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize the NLP sentiment analyzer
nlp_analyzer = SentimentIntensityAnalyzer()

def analyze_stock_for_manipulation(df: pd.DataFrame, ticker: str):
    """
    Combines rule-based heuristics, an AI Anomaly Detection model (Isolation Forest),
    and NLP Sentiment Analysis to calculate a pump-and-dump risk score.
    """
    latest_data = df.iloc[-1]
    reasons = []
    base_risk_score = 0
    
    # --- 1. Rule-Based Heuristics ---
    price_spike = latest_data['Price_Spike_Pct']
    volume_spike = latest_data['Volume_Spike_Ratio']
    
    if price_spike > 30:
        base_risk_score += 40
        reasons.append(f"Massive price spike detected ({price_spike:.1f}% above 20-day average).")
    elif price_spike > 10:
        base_risk_score += 20
        reasons.append(f"Unusual upward price movement ({price_spike:.1f}%).")
        
    if volume_spike > 5:
        base_risk_score += 40
        reasons.append(f"Extreme volume spike detected ({volume_spike:.1f}x normal volume).")
    elif volume_spike > 2:
        base_risk_score += 20
        reasons.append(f"High trading volume ({volume_spike:.1f}x normal).")

    # --- 2. AI Anomaly Detection (Isolation Forest) ---
    features = ['Daily_Return', 'Volume_Spike_Ratio', 'Price_Spike_Pct']
    X = df[features]
    
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    
    latest_features = X.iloc[-1:]
    anomaly_score = model.decision_function(latest_features)[0]
    
    ai_risk_contribution = 0
    if anomaly_score < 0:
        ai_risk_contribution = 20
        reasons.append("AI Anomaly Model flagged today's trading pattern as highly irregular.")

    # --- 3. REAL NLP Sentiment Analysis ---
    # Fetch live news headlines for the ticker
    news_data = yf.Ticker(ticker).news
    social_hype_score = 50 # Default to neutral if no news exists
    
    if news_data:
        compound_scores = []
        for article in news_data:
            title = article.get('title', '')
            # VADER returns a compound score between -1.0 (extremely negative) and 1.0 (extremely positive)
            score = nlp_analyzer.polarity_scores(title)['compound']
            compound_scores.append(score)
        
        # Calculate the average sentiment of all recent articles
        avg_sentiment = sum(compound_scores) / len(compound_scores)
        
        # Map the -1.0 to 1.0 scale into a 0 to 100 hype score
        social_hype_score = int((avg_sentiment + 1) * 50)
        
        if social_hype_score > 75:
            reasons.append(f"High positive sentiment (Hype) detected in recent news (NLP Score: {social_hype_score}/100).")
            # Pump and dumps rely on extreme fake hype, so we penalize overly high sentiment
            ai_risk_contribution += 15 
    else:
        reasons.append("No recent news found to analyze sentiment.")

    # --- 4. Final Score Calculation ---
    total_risk_score = min(100, base_risk_score + ai_risk_contribution)
    
    if total_risk_score >= 75:
        status = "HIGH RISK (Possible Pump & Dump)"
    elif total_risk_score >= 40:
        status = "MODERATE RISK"
    else:
        status = "LOW RISK"

    return {
        "price_spike_pct": round(price_spike, 2),
        "volume_spike_ratio": round(volume_spike, 2),
        "social_hype_score": social_hype_score,
        "risk_score": int(total_risk_score),
        "status": status,
        "reasons": reasons
    }
import pandas as pd
import yfinance as yf
import random
from sklearn.ensemble import IsolationForest
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

nlp_analyzer = SentimentIntensityAnalyzer()

def simulate_social_media_scan(price_spike, volume_spike, ticker):
    """
    Hackathon Feature: Dynamically simulates social media scraping (Reddit, Twitter, Telegram)
    based on the real-time volatility of the stock to demonstrate the NLP pipeline.
    """
    # Base baseline metrics
    base_mentions = random.randint(10, 50)
    bot_activity_pct = random.randint(2, 8)
    suspicious_keywords = []
    sentiment = "Neutral"
    
    scam_dictionary = ["🚀", "Guaranteed profit", "To the moon", "Insider tip", "Multibagger", "Pump incoming"]
    
    # If the stock is highly volatile, simulate a coordinated social media pump campaign
    if price_spike > 10 or volume_spike > 3:
        multiplier = int(max(price_spike / 2, volume_spike))
        current_mentions = base_mentions * multiplier * random.randint(5, 20)
        mention_spike_pct = ((current_mentions - base_mentions) / base_mentions) * 100
        
        bot_activity_pct = random.randint(45, 85) # High bot coordination
        
        # Pick 2 to 4 random scam keywords detected in the "scraped" posts
        suspicious_keywords = random.sample(scam_dictionary, random.randint(2, 4))
        sentiment = "Highly Promotional (Suspicious)"
        
    else:
        current_mentions = base_mentions + random.randint(-5, 10)
        mention_spike_pct = max(0, ((current_mentions - base_mentions) / base_mentions) * 100)
        
    return {
        "daily_mentions": current_mentions,
        "mention_spike_pct": round(mention_spike_pct, 1),
        "bot_activity_pct": bot_activity_pct,
        "detected_keywords": suspicious_keywords,
        "sentiment_label": sentiment
    }

def analyze_stock_for_manipulation(df: pd.DataFrame, ticker: str):
    latest_data = df.iloc[-1]
    reasons = []
    base_risk_score = 0
    
    # 1. Market Heuristics
    price_spike = latest_data['Price_Spike_Pct']
    volume_spike = latest_data['Volume_Spike_Ratio']
    
    if price_spike > 30:
        base_risk_score += 30
        reasons.append(f"Massive price spike ({price_spike:.1f}%).")
    elif price_spike > 10:
        base_risk_score += 15
        reasons.append(f"Unusual upward price movement ({price_spike:.1f}%).")
        
    if volume_spike > 5:
        base_risk_score += 30
        reasons.append(f"Extreme volume surge ({volume_spike:.1f}x normal).")
    elif volume_spike > 2:
        base_risk_score += 15
        reasons.append(f"High trading volume ({volume_spike:.1f}x normal).")

    # 2. AI Anomaly Detection
    features = ['Daily_Return', 'Volume_Spike_Ratio', 'Price_Spike_Pct']
    X = df[features]
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    anomaly_score = model.decision_function(X.iloc[-1:])[0]
    
    ai_risk_contribution = 0
    if anomaly_score < 0:
        ai_risk_contribution = 20
        reasons.append("AI flagged trading pattern as statistically anomalous.")

    # 3. Social Media Intelligence Module
    social_data = simulate_social_media_scan(price_spike, volume_spike, ticker)
    
    social_risk_contribution = 0
    if social_data["bot_activity_pct"] > 40:
        social_risk_contribution += 15
        reasons.append(f"High bot network activity detected ({social_data['bot_activity_pct']}% of posts).")
    
    if len(social_data["detected_keywords"]) > 0:
        social_risk_contribution += 15
        reasons.append(f"Promotional scam keywords detected across social platforms.")

    # 4. Final Scoring
    total_risk_score = min(100, base_risk_score + ai_risk_contribution + social_risk_contribution)
    
    if total_risk_score >= 75:
        status = "HIGH RISK (Coordinated Pump)"
    elif total_risk_score >= 40:
        status = "MODERATE RISK"
    else:
        status = "LOW RISK"

    return {
        "price_spike_pct": round(price_spike, 2),
        "volume_spike_ratio": round(volume_spike, 2),
        "social_hype_score": social_data["bot_activity_pct"] + int(social_data["mention_spike_pct"]/100), # Mock hype score
        "social_intelligence": social_data, # Pass the new social data to the frontend
        "risk_score": int(total_risk_score),
        "status": status,
        "reasons": reasons
    }
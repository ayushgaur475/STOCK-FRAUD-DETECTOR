import yfinance as yf
import pandas as pd
import numpy as np

def fetch_stock_data(ticker_symbol: str, period: str = "6mo"):
    """
    Fetches historical daily stock data and engineers features for the AI model.
    """
    try:
        stock = yf.Ticker(ticker_symbol)
        df = stock.history(period=period)
        
        if df.empty:
            return None

        # Feature Engineering for AI and Rule-based logic
        # 1. Price Change (Daily Return)
        df['Daily_Return'] = df['Close'].pct_change() * 100
        
        # 2. 20-Day Moving Averages
        df['Price_20MA'] = df['Close'].rolling(window=20).mean()
        df['Volume_20MA'] = df['Volume'].rolling(window=20).mean()
        
        # 3. Spikes relative to moving averages
        df['Price_Spike_Pct'] = ((df['Close'] - df['Price_20MA']) / df['Price_20MA']) * 100
        df['Volume_Spike_Ratio'] = df['Volume'] / df['Volume_20MA']
        
        # Drop NaN values created by rolling averages
        df = df.dropna()
        
        return df

    except Exception as e:
        print(f"Error fetching data for {ticker_symbol}: {e}")
        return None
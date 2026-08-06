"""
charts.py — Python-rendered charts via Matplotlib/Seaborn.
Returns Base64 encoded PNGs inside JSON.
Uses the actual columns from places.csv: state, city, popular_destination, latitude, longitude, interest, google_rating, price_fare
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import io
import os
import base64
import numpy as np
from django.conf import settings

# Travel.IO Theme Constants
PRIMARY = '#6366f1'
ACCENT = '#10b981'

def _setup_plot(theme='dark'):
    if theme == 'light':
        TEXT = '#1e293b'
        GRID = '#cbd5e1'
        plt.style.use('default')
    else:
        TEXT = '#e2e8f0'
        GRID = '#1e1e3f'
        plt.style.use('dark_background')
        
    fig, ax = plt.subplots(figsize=(6, 4))
    
    # Make background completely transparent
    fig.patch.set_alpha(0.0)
    ax.patch.set_alpha(0.0)
    
    ax.tick_params(colors=TEXT)
    ax.xaxis.label.set_color(TEXT)
    ax.yaxis.label.set_color(TEXT)
    ax.title.set_color(TEXT)
    for spine in ax.spines.values():
        spine.set_color(GRID)
        
    return fig, ax, 'none', TEXT

def _get_base64_json(fig):
    buf = io.BytesIO()
    plt.tight_layout()
    # Save with transparent=True
    fig.savefig(buf, format='png', transparent=True, edgecolor='none', dpi=100)
    plt.close(fig)
    buf.seek(0)
    b64_str = base64.b64encode(buf.read()).decode('utf-8')
    return {"image": f"data:image/png;base64,{b64_str}"}

import requests

def get_places_df():
    try:
        # Fetch live data from Node.js (MongoDB)
        res = requests.get('http://localhost:5000/api/locations/internal/places-export', timeout=5)
        res.raise_for_status()
        places = res.json()
        if not places:
            return pd.DataFrame()
            
        df = pd.DataFrame(places)
        
        # Rename MongoDB fields to match the CSV column names expected by the charts
        df = df.rename(columns={
            'cityName': 'city',
            'name': 'popular_destination',
            'type': 'interest',
            'rating': 'google_rating',
            'entrance_fee': 'price_fare'
        })
        
        # Handle cases where some fields might be missing or null
        if 'google_rating' in df.columns:
            df['google_rating'] = pd.to_numeric(df['google_rating'], errors='coerce')
        if 'price_fare' in df.columns:
            df['price_fare'] = pd.to_numeric(df['price_fare'], errors='coerce')
            
        return df
    except Exception as e:
        print(f"Error fetching live places from MongoDB via Node: {e}")
        # Fallback to CSV if Node is down
        csv_path = os.path.join(settings.BASE_DIR, '..', 'dataset', 'destinations', 'places.csv')
        try:
            return pd.read_csv(csv_path, encoding='cp1252')
        except Exception as csv_err:
            print(f"Fallback CSV failed: {csv_err}")
            return pd.DataFrame()

def get_city_budget_safety_data(theme='dark'):
    fig, ax1, BG_COLOR, TEXT = _setup_plot(theme)
    df = get_places_df()
    
    if not df.empty and 'city' in df.columns and 'price_fare' in df.columns and 'google_rating' in df.columns:
        # Get top 10 cities by destination count
        top_cities = df['city'].value_counts().head(10).index
        city_df = df[df['city'].isin(top_cities)]
        
        # Calculate average budget and safety per city
        grouped = city_df.groupby('city').agg(
            avg_budget=('price_fare', 'mean'),
            avg_safety=('google_rating', 'mean') # Using google_rating as safety proxy
        ).reset_index()
        
        # Sort by budget
        grouped = grouped.sort_values('avg_budget', ascending=False)
        
        # Plot Bar (Budget) on ax1
        sns.barplot(data=grouped, x='city', y='avg_budget', color='#8b5cf6', alpha=0.8, ax=ax1)
        ax1.set_xlabel('City')
        ax1.set_ylabel('Average Budget (INR)', color='#8b5cf6')
        ax1.tick_params(axis='y', labelcolor='#8b5cf6')
        ax1.set_xticklabels(ax1.get_xticklabels(), rotation=45, ha='right')
        
        # Plot Line (Safety Proxy) on secondary Y-axis
        ax2 = ax1.twinx()
        ax2.plot(grouped['city'], grouped['avg_safety'], color=ACCENT, marker='o', linewidth=2, markersize=8)
        ax2.set_ylabel('Avg Safety / Rating', color=ACCENT)
        ax2.tick_params(axis='y', labelcolor=ACCENT)
        ax2.set_ylim(0, 5) # Rating is out of 5
        
        plt.title('Budget & Safety by Top Cities', pad=20, color=TEXT)
    else:
        ax1.text(0.5, 0.5, 'No City Data Available', ha='center', va='center', color=TEXT)
        
    return _get_base64_json(fig)

def get_safety_by_state_data(theme='dark'):
    fig, ax, BG_COLOR, TEXT = _setup_plot(theme)
    df = get_places_df()
    if not df.empty and 'state' in df.columns and 'google_rating' in df.columns:
        grouped = df.groupby('state').agg(
            count=('popular_destination', 'count'),
            avg_rating=('google_rating', 'mean')
        ).sort_values('count', ascending=False).head(15).reset_index()
        
        # Color based on rating
        colors = []
        for r in grouped['avg_rating']:
            if r >= 4: colors.append(ACCENT)
            elif r >= 3: colors.append('#f59e0b')
            else: colors.append('#ef4444')
            
        sns.barplot(data=grouped, x='count', y='state', palette=colors, ax=ax)
        ax.set_title('Destinations by State (Top 15)', pad=15)
        ax.set_xlabel('Number of Destinations')
        ax.set_ylabel('')
    else:
        ax.text(0.5, 0.5, 'No State Data', ha='center', va='center', color=TEXT)
    
    return _get_base64_json(fig)

def get_budget_distribution_data(theme='dark'):
    fig, ax, BG_COLOR, TEXT = _setup_plot(theme)
    df = get_places_df()
    if not df.empty and 'price_fare' in df.columns and 'google_rating' in df.columns:
        valid_df = df[['price_fare', 'google_rating']].dropna()
        if len(valid_df) > 500:
            valid_df = valid_df.sample(500, random_state=42)
            
        sns.scatterplot(data=valid_df, x='price_fare', y='google_rating', ax=ax,
                        color='#8b5cf6', alpha=0.6, s=40)
        
        ax.set_title('Price vs Google Rating', pad=15)
        ax.set_xlabel('Price (INR)')
        ax.set_ylabel('Google Rating')
    else:
        ax.text(0.5, 0.5, 'No Budget Data', ha='center', va='center', color=TEXT)
        
    return _get_base64_json(fig)

def get_vibes_donut_data(theme='dark'):
    fig, ax, BG_COLOR, TEXT = _setup_plot(theme)
    df = get_places_df()
    if not df.empty and 'interest' in df.columns:
        all_categories = df['interest'].dropna().apply(lambda x: [c.strip() for c in str(x).split(',') if c.strip()])
        counts = {}
        for cats in all_categories:
            for c in cats:
                counts[c] = counts.get(c, 0) + 1
                
        top_n = dict(sorted(counts.items(), key=lambda item: item[1], reverse=True)[:5])
        labels = list(top_n.keys())
        sizes = list(top_n.values())
        
        colors = [PRIMARY, '#8b5cf6', '#d946ef', ACCENT, '#f59e0b']
        
        wedges, texts, autotexts = ax.pie(sizes, labels=labels, autopct='%1.1f%%', 
                                          startangle=90, colors=colors,
                                          textprops=dict(color=TEXT))
        centre_circle = plt.Circle((0,0), 0.70, fc=BG_COLOR)
        fig.gca().add_artist(centre_circle)
        ax.axis('equal')
        ax.set_title('Top Travel Categories/Vibes', pad=15)
    else:
        ax.text(0.5, 0.5, 'No Category Data', ha='center', va='center', color=TEXT)
        
    return _get_base64_json(fig)

def get_system_health_data(hits=None, theme='dark'):
    fig, ax, BG_COLOR, TEXT = _setup_plot(theme)
    hours = np.arange(24)
    
    if hits and len(hits) == 24:
        # Use real data from Node.js
        hits = np.array(hits)
        title = 'API Requests (Last 24 Hours)'
    else:
        # Fallback to simulated data if no POST data
        base = 100
        cycle = 150 * np.sin(np.pi * (hours - 6) / 12)
        cycle = np.where(cycle < 0, 0, cycle)
        hits = base + cycle + np.random.normal(0, 20, 24)
        hits = np.maximum(hits, 0)
        title = 'API Requests (Simulated)'
    
    ax.fill_between(hours, hits, color=ACCENT, alpha=0.3)
    ax.plot(hours, hits, color=ACCENT, linewidth=2)
    
    ax.set_title(title, pad=15)
    ax.set_xlabel('Hour of Day (IST)')
    ax.set_ylabel('Request Count')
    ax.grid(color='#1e1e3f', linestyle='--', alpha=0.5)
    
    return _get_base64_json(fig)

"""
TravelIO — RSS Feed reader for travel news from Indian sources.
"""
import feedparser
import requests
from bs4 import BeautifulSoup
from datetime import datetime

RSS_FEEDS = [
    {
        'name': 'The Hindu - Travel',
        'url': 'https://www.thehindu.com/life-and-style/travel/feeder/default.rss',
        'source': 'TheHindu',
    },
    {
        'name': 'News18 - Lifestyle & Travel',
        'url': 'https://www.news18.com/rss/lifestyle.xml',
        'source': 'News18',
    },
    {
        'name': 'Times of India - Ahmedabad',
        'url': 'https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms',
        'source': 'TOI',
    },
    {
        'name': 'Indian Express - Ahmedabad',
        'url': 'https://indianexpress.com/section/cities/ahmedabad/feed/',
        'source': 'IndianExpress',
    },
]


def clean_html(html_text):
    """Strip HTML tags from text."""
    if not html_text:
        return ''
    soup = BeautifulSoup(html_text, 'html.parser')
    return soup.get_text(strip=True)[:300]


def fetch_travel_news(destinations=None, max_per_feed=20):
    """Fetch travel news from RSS feeds, optionally filtered by destination."""
    all_articles = []
    dest_lower = [d.lower() for d in (destinations or [])]
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

    for feed_config in RSS_FEEDS:
        try:
            r = requests.get(feed_config['url'], headers=headers, timeout=10)
            feed = feedparser.parse(r.content)

            for entry in feed.entries:
                title = entry.get('title', '')
                summary_raw = entry.get('summary', entry.get('description', ''))
                summary = clean_html(summary_raw)
                
                # Some RSS feeds (like TOI or IE) only provide images or empty summaries
                if not summary.strip():
                    summary = "Click to read the full story for more details."

                link = entry.get('link', '')
                published = entry.get('published', '')

                pub_date = None
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    # feedparser's parsed time is always in UTC
                    pub_date = datetime(*entry.published_parsed[:6]).isoformat() + "Z"

                article = {
                    'title': title,
                    'summary': summary,
                    'url': link,
                    'source': feed_config['source'],
                    'source_name': feed_config['name'],
                    'date': pub_date or published,
                }

                if dest_lower:
                    text_combined = (title + ' ' + summary).lower()
                    if any(dest in text_combined for dest in dest_lower):
                        all_articles.append(article)
                else:
                    all_articles.append(article)

                if len([a for a in all_articles if a['source'] == feed_config['source']]) >= max_per_feed:
                    break

        except Exception as e:
            print(f"[RSS Error] Failed to fetch from {feed_config['name']}: {e}")
            continue

    all_articles.sort(key=lambda x: x.get('date', '') or '', reverse=True)
    return all_articles

"""
image_scraper.py — Travel-specific image retrieval for TravelIO.

Pipeline:
  1. Check image_cache.json for an exact key hit → return immediately.
  2. Run a priority query chain (most specific → broadest) via DuckDuckGo.
  3. Score each candidate URL: reject bad domains, bad paths, non-photo
     extensions, and URLs with no travel keyword signal.
  4. Cache the first batch of valid travel photos and return them.
  5. If all queries fail, return a curated type-appropriate Unsplash fallback.
"""
import os
import json

CACHE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache', 'image_cache.json')

# ──────────────────────────────────────────────────────────────────────────────
# Initialize persistent cache
# ──────────────────────────────────────────────────────────────────────────────
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, 'r', encoding='utf-8') as _f:
        try:
            image_cache = json.load(_f)
        except Exception:
            image_cache = {}
else:
    image_cache = {}

# ──────────────────────────────────────────────────────────────────────────────
# Domain / path blocklists
# ──────────────────────────────────────────────────────────────────────────────

# Full domain/hostname substrings — any URL whose lower-cased text contains
# one of these is unconditionally rejected.
BAD_DOMAIN_PATTERNS = [
    # Adult / inappropriate
    'hentaiblue', 'porncomics', 'hdporncomics', 'hdporn',

    # Stock photo watermarks (paid)
    'istockphoto.com', 'gettyimages.com', 'dreamstime.com',
    'depositphotos.com', 'shutterstock.com', 'freepik.com',
    'vecteezy.com', 'flaticon.com', 'pngtree.com', 'canva.com',

    # Public domain / clipart sites (not travel photos)
    'publicdomainpictures.net', 'openclipart.org', 'clker.com',

    # Video / streaming (thumbnails)
    'youtube.com', 'youtu.be', 'ytimg.com', 'yt3.ggpht.com',
    'vimeo.com', 'dailymotion.com', 'twitch.tv',

    # Social media profiles / feeds
    'linkedin.com/dms', 'linkedin.com/in/',
    'twitter.com', 'twimg.com', 'x.com',
    'facebook.com', 'fbcdn.net', 'fb.com',
    'instagram.com', 'cdninstagram.com',
    'tiktok.com',

    # Pinterest (repins of unrelated content)
    'pinterest.com', 'pinterest.',
    'pinimg.com',

    # Marketplace / shopping
    'amazon.com', 'flipkart.com', 'ebay.com', 'etsy.com',
    'snapdeal.com', 'meesho.com', 'myntra.com', 'nykaa.com',

    # Academic / research
    'researchgate.net', 'academia.edu', 'semanticscholar.org',

    # News / blog cover images (article banners, not destination photos)
    'feedshare-shrink', 'article-cover_image',

    # Maps / data
    'baidu.com', 'maps.gstatic.com',

    # Japan travel agency logo
    'shopping.jtb.co.jp',

    # Misc known bad
    'get-vthumb',
]

# URL path substrings — reject regardless of domain if found in the path/query.
BAD_PATH_PATTERNS = [
    # Logos / branding
    '/logo', '/logos', '/logo.', '-logo.', '_logo.',
    '/icon', '/icons', '/favicon',
    '/badge', '/badges',
    '/branding', '/brand-',

    # UI / screenshots
    '/screenshot', '/screen-shot', '/screengrab', '/screencast',
    '/ui/', '/app-icon',

    # Promotional / advertising
    '/banner', '/banners', '/poster', '/posters',
    '/advertisement', '/ads/', '/ad/', '/advert',

    # User profiles / avatars
    '/avatar', '/avatars', '/profile-pic', '/user/', '/member/',

    # Products
    '/product', '/products', '/shop/', '/cart/', '/catalog/',

    # Memes / jokes
    'meme', 'funny', '-joke-', 'comic-strip', 'demotivational',

    # Charts / diagrams (data visualization)
    '/chart', '/graph', '/infographic', '/diagram', '/pie-chart',

    # Illustrations / vectors
    'clipart', 'illustration', 'vector-art', 'stock-vector',
    'cartoon', 'animated-gif',

    # Book / album / movie covers
    'book-cover', 'album-cover', 'movie-poster', 'dvd-cover',

    # Wikipedia API thumbnails (small article images)
    'wikipedia.org/wiki', '/wikipedia/commons/thumb',
    'upload.wikimedia.org',

    # Specific known bad patterns from previous system
    'long-haired-cat', 'cat-picture', 'hydrangea',
    'drawing.png', 'drawing.jpg',
    'nightreign', 'elden-ring', 'recluse-painnico',
    'goblin-king-quote', 'water-treatment',
    'data-v', 'csbm-3603',
    'el/', '/el/',
]

# Only accept these image file extensions (checked against URL before query string)
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

# Travel-positive keywords: a URL whose path/host contains ANY of these gets a
# higher priority score — used to sort candidates before selecting.
TRAVEL_KEYWORDS = [
    'travel', 'tourism', 'tourist', 'destination', 'visit', 'india',
    'landmark', 'heritage', 'nature', 'hill', 'mountain', 'beach',
    'fort', 'temple', 'lake', 'river', 'palace', 'garden', 'park',
    'resort', 'hotel', 'trek', 'wildlife', 'safari', 'scenic',
    'panorama', 'valley', 'waterfall', 'sunset', 'sunrise',
]

# Type-appropriate Unsplash fallbacks (curated, stable URLs).
TYPE_FALLBACKS = {
    'temple':       'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    'spiritual':    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    'mountain':     'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    'hill station': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    'beach':        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    'heritage':     'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    'historical':   'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    'fort':         'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    'palace':       'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    'waterfall':    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
    'lake':         'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80',
    'nature':       'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80',
    'wildlife':     'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=800&q=80',
    'adventure':    'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=800&q=80',
    'market':       'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80',
    'garden':       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    'default':      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
}


# ──────────────────────────────────────────────────────────────────────────────
# URL validation helpers
# ──────────────────────────────────────────────────────────────────────────────

def is_bad_url(url: str) -> bool:
    """Return True if the URL is known to be a non-travel/inappropriate image."""
    if not url:
        return True
    u = url.lower()

    for pat in BAD_DOMAIN_PATTERNS:
        if pat in u:
            return True

    for pat in BAD_PATH_PATTERNS:
        if pat in u:
            return True

    # Extension check — only on the part before the query string
    path = u.split('?')[0]
    _, ext = os.path.splitext(path)
    if ext and ext not in ALLOWED_EXTENSIONS:
        # Allow URLs with no recognizable extension (e.g. CDN URLs)
        if ext in ('.gif', '.svg', '.bmp', '.tiff', '.ico', '.pdf',
                   '.mp4', '.webm', '.mov', '.avi', '.xml', '.json',
                   '.php', '.html', '.htm', '.asp', '.aspx', '.jsp'):
            return True

    return False


def _travel_score(url: str) -> int:
    """Return the count of travel keywords found in the URL (0 = no signal)."""
    u = url.lower()
    return sum(1 for kw in TRAVEL_KEYWORDS if kw in u)


def _get_type_fallback(query_key: str = '') -> str:
    """Return a type-appropriate Unsplash fallback image URL."""
    q = query_key.lower()
    for k, img in TYPE_FALLBACKS.items():
        if k != 'default' and k in q:
            return img
    return TYPE_FALLBACKS['default']


# ──────────────────────────────────────────────────────────────────────────────
# Priority query chain builder
# ──────────────────────────────────────────────────────────────────────────────

def _build_queries(query: str) -> list:
    """
    Given a raw query string, build an ordered list of progressively broader
    search queries optimised for travel photography.

    The caller typically passes something like:
      - "Almora Uttarakhand india tourism"  (city enrichment)
      - "Almora Fort Almora india"           (place enrichment)

    We normalise and extend it into a priority chain.
    """
    # Strip known noise tokens to extract the core destination name(s)
    noise = {'india', 'tourism', 'place', 'places', 'to', 'visit',
             'famous', 'landmark', 'temple', 'mountain', 'tourist',
             'attraction', 'travel'}
    parts = [t for t in query.strip().split() if t.lower() not in noise]

    # Destination = first 1-3 meaningful tokens
    dest = ' '.join(parts[:3]) if len(parts) >= 3 else ' '.join(parts)

    queries = [
        f"{dest} India tourism",
        f"{dest} India tourist place",
        f"{dest} India landmark",
        f"{dest} India travel",
        f"{dest} India nature",
    ]
    # Also include the original query as a safety net
    if query.strip().lower() not in [q.lower() for q in queries]:
        queries.append(query.strip())

    return queries


# ──────────────────────────────────────────────────────────────────────────────
# Core image retrieval
# ──────────────────────────────────────────────────────────────────────────────

def _save_cache():
    """Persist the in-memory cache to disk."""
    try:
        cache_dir = os.path.dirname(CACHE_FILE)
        os.makedirs(cache_dir, exist_ok=True)
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(image_cache, f)
    except Exception as e:
        print(f"[image_scraper] Failed to save cache: {e}")


def _download_image(url: str, upload_dir: str, idx: int) -> str:
    """
    Try to download an image to the local uploads directory.
    Returns a localhost URL on success, or the original remote URL on failure.
    """
    import requests
    try:
        # Quick HEAD to check content-type and size before full download
        head = requests.head(url, timeout=4, allow_redirects=True)
        content_type = head.headers.get('Content-Type', '')
        if 'image' not in content_type:
            return url  # not an image

        content_length = int(head.headers.get('Content-Length', 0))
        if content_length and content_length < 10_000:
            return ''  # Likely an icon/thumbnail — skip

        resp = requests.get(url, timeout=8, stream=True)
        if resp.status_code != 200:
            return url

        # Determine extension
        ext = url.split('?')[0].rsplit('.', 1)[-1].lower()
        if ext not in ('jpg', 'jpeg', 'png', 'webp'):
            # Infer from content-type
            ct = resp.headers.get('Content-Type', '')
            ext = 'jpg'
            if 'png' in ct:
                ext = 'png'
            elif 'webp' in ct:
                ext = 'webp'

        filename = f"img_{idx + 1}.{ext}"
        filepath = os.path.join(upload_dir, filename)
        with open(filepath, 'wb') as fp:
            for chunk in resp.iter_content(8192):
                fp.write(chunk)

        # Normalise safe_query from upload_dir name
        safe_query = os.path.basename(upload_dir)
        return f"http://localhost:5000/uploads/locations/{safe_query}/{filename}"

    except Exception:
        return url  # fall back to remote URL


def get_google_images(query: str, count: int = 5, fast_mode: bool = False) -> list:
    """
    Return `count` travel-appropriate image URLs for the given destination query.

    Pipeline:
      1. Exact cache hit → return immediately.
      2. Build priority query chain and iterate until we have `count` valid URLs.
      3. Score, filter, deduplicate candidates.
      4. Download valid images locally (for persistence).
      5. Cache and return.
      6. Fallback to Unsplash type image if everything fails.
    """
    query_key = query.lower().strip()

    # ── 1. Cache hit ──────────────────────────────────────────────────────────
    if query_key in image_cache:
        cached = [u for u in image_cache[query_key] if not is_bad_url(u)]
        if len(cached) >= count:
            return cached[:count]
        # Partial cache — we'll top up below but preserve what we have
        existing_valid = cached
    else:
        existing_valid = []

    # ── fast_mode: return Unsplash type fallback without network call ─────────
    fallback = _get_type_fallback(query_key)
    if fast_mode:
        return [fallback] * count

    # ── 2. Build priority queries ─────────────────────────────────────────────
    priority_queries = _build_queries(query)

    # Upload directory for local caching
    import string
    safe_query = "".join(c if c.isalnum() else "_" for c in query_key)[:80]
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    upload_dir = os.path.join(base_dir, 'server', 'uploads', 'locations', safe_query)
    os.makedirs(upload_dir, exist_ok=True)

    collected = list(existing_valid)  # start with anything already valid

    try:
        from duckduckgo_search import DDGS
    except ImportError:
        try:
            from ddgs import DDGS
        except ImportError:
            print("[image_scraper] DDGS not available — returning fallback")
            return [fallback] * count

    try:
        for pq in priority_queries:
            if len(collected) >= count:
                break  # Early exit: we already have enough valid images

            try:
                with DDGS() as ddgs:
                    raw_results = list(ddgs.images(pq, max_results=count * 5))
            except Exception as search_err:
                print(f"[image_scraper] Search failed for '{pq}': {search_err}")
                continue

            # ── 3. Score and filter candidates ────────────────────────────────
            candidates = []
            for r in raw_results:
                img_url = r.get('image', '')
                if not img_url or is_bad_url(img_url):
                    continue
                # Optional: prefer larger images
                width = r.get('width', 0)
                height = r.get('height', 0)
                if width and height and (width < 200 or height < 150):
                    continue  # Skip tiny thumbnails/icons
                score = _travel_score(img_url)
                candidates.append((score, img_url))

            # Sort: prefer URLs with travel keyword signals
            candidates.sort(key=lambda x: x[0], reverse=True)

            for _, img_url in candidates:
                if len(collected) >= count:
                    break
                if img_url in collected:
                    continue
                # ── 4. Download locally ────────────────────────────────────────
                local_url = _download_image(img_url, upload_dir, len(collected))
                if local_url and not is_bad_url(local_url):
                    collected.append(local_url)

        # ── 5. Fill remaining slots with fallback ─────────────────────────────
        if not collected:
            collected = [fallback]
        while len(collected) < count:
            collected.append(collected[0])

        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for u in collected:
            if u not in seen:
                seen.add(u)
                deduped.append(u)
        collected = deduped

        # Persist to cache
        image_cache[query_key] = collected
        _save_cache()

        return collected[:count]

    except Exception as e:
        print(f"[image_scraper] Unexpected error for '{query}': {e}")
        fallback_list = [fallback] * count
        image_cache[query_key] = fallback_list
        _save_cache()
        return fallback_list


# ──────────────────────────────────────────────────────────────────────────────
# Quick test
# ──────────────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import sys
    q = sys.argv[1] if len(sys.argv) > 1 else 'Almora Uttarakhand India tourism'
    results = get_google_images(q, count=3)
    for i, url in enumerate(results, 1):
        print(f"  {i}. {url}")

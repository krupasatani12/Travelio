"""
City Index — loads and merges places.csv + Top Indian Places to Visit.csv
into a State -> City -> Place hierarchy for paginated browsing.

locations_rows.csv is NOT used here — it backs the semantic search only.
Photo/teaser enrichment is done by matching place names against the
semantic_index.metadata dict (which comes from locations_rows.csv).
"""
import os
import math
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(os.path.dirname(BASE_DIR), 'dataset', 'destinations')

PLACES_CSV = os.path.join(DATASET_DIR, 'places.csv')
TOP_CSV = os.path.join(DATASET_DIR, 'Top Indian Places to Visit.csv')


class CityIndex:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CityIndex, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    # ------------------------------------------------------------------
    # Initialization: merge CSV base + MongoDB overlay
    # ------------------------------------------------------------------
    def _initialize(self):
        import time
        t0 = time.time()
        print("CityIndex: loading places data...")
        frames = []

        # --- Step 1: Load CSV files as fast local base ---
        if os.path.exists(PLACES_CSV):
            df_p = pd.read_csv(PLACES_CSV, encoding='cp1252')
            df_p = df_p.rename(columns={
                'state': 'state',
                'city': 'city',
                'popular_destination': 'name',
                'google_rating': 'rating',
                'price_fare': 'entrance_fee',
                'interest': 'type',
            })
            df_p['review_count_lakhs'] = 0.0
            df_p['best_time'] = ''
            frames.append(df_p[['state', 'city', 'name', 'type', 'rating',
                                'entrance_fee', 'review_count_lakhs',
                                'best_time', 'latitude', 'longitude']])
        else:
            print(f"  Warning: {PLACES_CSV} not found")

        if os.path.exists(TOP_CSV):
            df_t = pd.read_csv(TOP_CSV)
            df_t = df_t.rename(columns={
                'State': 'state',
                'City': 'city',
                'Name': 'name',
                'Type': 'type',
                'Google review rating': 'rating',
                'Entrance Fee in INR': 'entrance_fee',
                'Number of google review in lakhs': 'review_count_lakhs',
                'Best Time to visit': 'best_time',
            })
            df_t['latitude'] = None
            df_t['longitude'] = None
            frames.append(df_t[['state', 'city', 'name', 'type', 'rating',
                                'entrance_fee', 'review_count_lakhs',
                                'best_time', 'latitude', 'longitude']])
        else:
            print(f"  Warning: {TOP_CSV} not found")

        if not frames:
            print("  CityIndex: no source CSVs found — index is empty.")
            self.places_df = pd.DataFrame()
            self._city_summary = pd.DataFrame()
            self._states = []
            return

        merged = pd.concat(frames, ignore_index=True)

        # Normalize capitalization and fix specific typos
        merged['state'] = merged['state'].str.strip().str.title()
        merged['city'] = merged['city'].str.strip().str.title()
        state_fixes = {
            'Maharahtra': 'Maharashtra',
            'Maharastra': 'Maharashtra',
            'Andaman And Nicobar': 'Andaman and Nicobar Islands',
            'Andaman And Nicobar Islands': 'Andaman and Nicobar Islands',
            'Nct Of Delhi': 'Delhi',
            'Gujrat': 'Gujarat',
            'Karanataka': 'Karnataka'
        }
        merged['state'] = merged['state'].replace(state_fixes)

        # Dedupe CSV rows
        merged['_key'] = (
            merged['state'].str.strip().str.lower() + '|' +
            merged['city'].str.strip().str.lower() + '|' +
            merged['name'].str.strip().str.lower()
        )
        merged = merged.sort_values('review_count_lakhs', ascending=False)
        merged = merged.drop_duplicates(subset='_key', keep='first')
        merged = merged.drop(columns=['_key'])

        # Mark CSV rows
        merged['_source'] = 'csv'

        csv_count = len(merged)

        # --- Step 2: Fetch MongoDB data and merge on top ---
        try:
            import requests
            res = requests.get(
                'http://localhost:5000/api/locations/internal/places-export',
                timeout=3
            )
            res.raise_for_status()
            mongo_places = res.json()

            if mongo_places and len(mongo_places) > 0:
                df_m = pd.DataFrame(mongo_places)
                df_m = df_m.rename(columns={'cityName': 'city'})

                # Normalize
                df_m['state'] = df_m['state'].str.strip().str.title()
                df_m['city'] = df_m['city'].str.strip().str.title()
                df_m['name'] = df_m['name'].str.strip().str.title()

                # Build merge key
                df_m['_key'] = (
                    df_m['state'].str.strip().str.lower() + '|' +
                    df_m['city'].str.strip().str.lower() + '|' +
                    df_m['name'].str.strip().str.lower()
                )
                merged['_key'] = (
                    merged['state'].str.strip().str.lower() + '|' +
                    merged['city'].str.strip().str.lower() + '|' +
                    merged['name'].str.strip().str.lower()
                )

                # Separate MongoDB-only rows (admin-added, not in CSV)
                new_places = df_m[~df_m['_key'].isin(merged['_key'])].copy()

                # For existing rows, override CSV values with MongoDB values
                for _, mrow in df_m[df_m['_key'].isin(merged['_key'])].iterrows():
                    mask = merged['_key'] == mrow['_key']
                    for col in ['type', 'rating', 'entrance_fee', 'best_time',
                                'latitude', 'longitude']:
                        if col in mrow and pd.notna(mrow.get(col)):
                            merged.loc[mask, col] = mrow[col]
                    # Override review_count_lakhs only if MongoDB has a non-zero value
                    if 'review_count_lakhs' in mrow and mrow.get('review_count_lakhs'):
                        merged.loc[mask, 'review_count_lakhs'] = mrow['review_count_lakhs']

                # Append new admin-added places
                if len(new_places) > 0:
                    new_rows = []
                    for _, nr in new_places.iterrows():
                        new_rows.append({
                            'state': nr.get('state', ''),
                            'city': nr.get('city', ''),
                            'name': nr.get('name', ''),
                            'type': nr.get('type', 'General'),
                            'rating': nr.get('rating', 0.0),
                            'entrance_fee': nr.get('entrance_fee', 0.0),
                            'review_count_lakhs': nr.get('review_count_lakhs', 0.0),
                            'best_time': nr.get('best_time', ''),
                            'latitude': nr.get('latitude', None),
                            'longitude': nr.get('longitude', None),
                            '_source': 'mongodb',
                        })
                    merged = pd.concat([merged, pd.DataFrame(new_rows)],
                                       ignore_index=True)

                merged = merged.drop(columns=['_key'], errors='ignore')
                print(f"  CityIndex: Merged {len(mongo_places)} MongoDB places "
                      f"({len(new_places)} new, "
                      f"{len(df_m) - len(new_places)} updated)")
        except Exception as e:
            print(f"  CityIndex: MongoDB fetch skipped ({e}). Using CSV only.")
            merged = merged.drop(columns=['_key'], errors='ignore')

        # --- Step 3: Clean up NaNs ---
        merged['rating'] = pd.to_numeric(merged['rating'], errors='coerce').fillna(0.0)
        merged['review_count_lakhs'] = pd.to_numeric(merged['review_count_lakhs'], errors='coerce').fillna(0.0)
        merged['entrance_fee'] = pd.to_numeric(merged['entrance_fee'], errors='coerce').fillna(0.0)
        merged['best_time'] = merged['best_time'].fillna('')
        merged['type'] = merged['type'].fillna('General')

        self.places_df = merged.reset_index(drop=True)

        # Build city-level summary
        city_groups = self.places_df.groupby(['state', 'city'], as_index=False)
        self._city_summary = city_groups.agg(
            place_count=('name', 'count'),
            avg_rating=('rating', 'mean'),
            total_reviews=('review_count_lakhs', 'sum'),
        )
        self._city_summary['avg_rating'] = self._city_summary['avg_rating'].round(2)
        self._city_summary['total_reviews'] = self._city_summary['total_reviews'].round(2)

        self._states = sorted(self._city_summary['state'].dropna().unique().tolist())

        elapsed = round((time.time() - t0) * 1000)
        print(f"  CityIndex: {len(self.places_df)} places across "
              f"{len(self._city_summary)} cities in {len(self._states)} states. "
              f"({elapsed}ms)")

    # ------------------------------------------------------------------
    # Reload: re-run initialization (called by webhook)
    # ------------------------------------------------------------------
    def reload(self):
        """Force re-initialize with fresh CSV + MongoDB data."""
        print("CityIndex: reloading data (webhook triggered)...")
        self.__class__._enrichment_cache = None  # Clear class-level image cache too
        self._initialize()

    # ------------------------------------------------------------------
    # Photo enrichment: try to match place/city name in semantic_index
    # ------------------------------------------------------------------
    _enrichment_cache = None

    # URL patterns that indicate non-travel / inappropriate content.
    # Any URL matching one of these substrings is silently rejected.
    BAD_URL_PATTERNS = [
        # Adult / inappropriate
        'hentaiblue', 'porncomics', 'hdporncomics', 'hdporn',

        # Stock photo watermarks (paid)
        'istockphoto.com', 'gettyimages.com', 'dreamstime.com',
        'depositphotos.com', 'shutterstock.com', 'freepik.com',
        'vecteezy.com', 'flaticon.com', 'pngtree.com', 'canva.com',

        # Public domain / clipart sites (not travel photos)
        'publicdomainpictures.net', 'openclipart.org', 'clker.com',

        # Video / streaming thumbnails
        'youtube.com', 'youtu.be', 'ytimg.com', 'yt3.ggpht.com',
        'vimeo.com', 'dailymotion.com', 'twitch.tv',

        # Social media profiles / feeds
        'linkedin.com/dms', 'linkedin.com/in/',
        'twitter.com', 'twimg.com', 'x.com',
        'facebook.com', 'fbcdn.net', 'fb.com',
        'instagram.com', 'cdninstagram.com',
        'tiktok.com',

        # Pinterest (repins of unrelated content)
        'pinterest.com', 'pinterest.', 'pinimg.com',

        # Marketplace / shopping
        'amazon.com', 'flipkart.com', 'ebay.com', 'etsy.com',
        'snapdeal.com', 'meesho.com',

        # Academic / research
        'researchgate.net', 'academia.edu',

        # News / blog banners
        'feedshare-shrink', 'feedshare-shrink_2048',
        'article-cover_image',

        # Maps / data
        'baidu.com',

        # Japan travel agency logo
        'shopping.jtb.co.jp',

        # Logos / icons / UI (path-based)
        '/logo', '/logos', '/logo.', '-logo.', '_logo.',
        '/icon', '/icons', '/favicon',
        '/banner', '/banners', '/poster', '/posters',
        '/advertisement', '/ads/', '/ad/', '/advert',
        '/avatar', '/avatars', '/profile-pic', '/user/',
        '/product', '/products', '/shop/', '/cart/',
        '/screenshot', '/screen-shot', '/screengrab',
        '/chart', '/graph', '/infographic', '/diagram',
        'clipart', 'illustration', 'vector-art', 'stock-vector',
        'meme', '-joke-', 'comic-strip',
        'book-cover', 'album-cover', 'movie-poster',

        # Wikipedia thumbnails
        'wikipedia.org/wiki', '/wikipedia/commons/thumb',
        'upload.wikimedia.org',

        # Misc known bad
        'get-vthumb',
        'long-haired-cat', 'cat-picture',
        'hydrangea', 'drawing.png', 'drawing.jpg',
        'nightreign', 'elden-ring', 'recluse-painnico',
        'goblin-king-quote', 'water-treatment',
        'data-v', 'csbm-3603',
        'el/', '/el/',
    ]

    TYPE_IMAGE_MAP = {
        'temple':      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
        'spiritual':   'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
        'mountain':    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
        'hill station':'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
        'beach':       'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
        'heritage':    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        'historical':  'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        'fort':        'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        'palace':      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        'waterfall':   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
        'lake':        'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80',
        'nature':      'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80',
        'wildlife':    'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=800&q=80',
        'adventure':   'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=800&q=80',
        'market':      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80',
        'garden':      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
        'default':     'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
    }

    @classmethod
    def _is_bad_url(cls, url: str) -> bool:
        """Return True if the URL matches any known non-travel / inappropriate pattern."""
        u = url.lower()
        for pat in cls.BAD_URL_PATTERNS:
            if pat in u:
                return True
        return False

    @classmethod
    def _sanitise_images(cls, images: list, query_key: str = '', place_type=None) -> list:
        """
        Filter a raw image list:
        1. Remove any URL matching BAD_URL_PATTERNS.
        2. Promote localhost images to the front (they are locally downloaded
           travel photos and are always the most trustworthy).
        3. If nothing survives, return a single type-appropriate Unsplash fallback.
        """
        clean = [u for u in images if u and not cls._is_bad_url(u)]
        # Promote locally-hosted images first
        local = [u for u in clean if 'localhost:5000' in u]
        remote = [u for u in clean if 'localhost:5000' not in u]
        merged = local + remote
        if not merged:
            merged = [cls._get_type_fallback(query_key, place_type)]
        return merged

    @classmethod
    def _get_type_fallback(cls, query_key='', place_type=None):
        text = f"{query_key} {place_type or ''}".lower()
        for k, img in cls.TYPE_IMAGE_MAP.items():
            if k != 'default' and k in text:
                return img
        return cls.TYPE_IMAGE_MAP['default']

    @classmethod
    def _build_enrichment_cache(cls):
        """Build a name->meta dict from the local JSON cache file."""
        if cls._enrichment_cache is not None:
            return
        cls._enrichment_cache = {}
        try:
            import json, os
            BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            cache_path = os.path.join(BASE_DIR, 'cache', 'image_cache.json')

            if os.path.exists(cache_path):
                with open(cache_path, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                    for key, images in cache_data.items():
                        if not images:
                            continue
                        norm_key = key.lower().strip()
                        # Sanitise at load time — this is the single choke-point
                        clean = cls._sanitise_images(images, norm_key)
                        cls._enrichment_cache[norm_key] = {
                            'heroImage': clean[0],
                            'images': clean,
                        }
        except Exception as e:
            print(f"Warning: Failed to load JSON image cache: {e}")

    @classmethod
    def _get_enrichment(cls, query_key, place_type=None):
        """
        Look up heroImage and images from JSON cache.

        Lookup order:
          1. Exact key match.
          2. Normalised match: strip noise tokens, compare lowercased destination
             name against all cache keys — only accept a match when the
             destination name is a complete contiguous substring (not a single
             first-token partial match that causes wrong images to appear).
          3. Type-appropriate Unsplash fallback — never return a random entry.
        """
        if cls._enrichment_cache is None:
            cls._build_enrichment_cache()

        norm_key = query_key.strip().lower()

        # ── 1. Exact cache hit ────────────────────────────────────────────────
        entry = cls._enrichment_cache.get(norm_key)
        if entry:
            hero = entry.get('heroImage', '')
            imgs = entry.get('images', [])
            if cls._is_bad_url(hero):
                imgs = cls._sanitise_images(imgs, norm_key, place_type)
                hero = imgs[0] if imgs else ''
            return hero, imgs

        # ── 2. Strict destination-name match ──────────────────────────────────
        # Extract the meaningful destination tokens (drop noise words).
        NOISE = {'india', 'tourism', 'place', 'places', 'to', 'visit',
                 'famous', 'landmark', 'tourist', 'attraction', 'travel',
                 'nature', 'temple', 'mountain'}
        dest_tokens = [t for t in norm_key.split() if t not in NOISE]

        if dest_tokens:
            # Build the destination phrase (first 1-3 tokens max)
            dest_phrase = ' '.join(dest_tokens[:3])
            # Only match if the FULL destination phrase appears as a contiguous
            # substring in the cache key — not just the first token.
            for k, v in cls._enrichment_cache.items():
                if dest_phrase in k:
                    hero = v.get('heroImage', '')
                    imgs = v.get('images', [])
                    if not cls._is_bad_url(hero) and imgs:
                        return hero, imgs

        # ── 3. Type fallback — never return a random unrelated cache entry ────
        fallback = cls._get_type_fallback(norm_key, place_type)
        return fallback, [fallback]

    # ------------------------------------------------------------------
    # Public API: list of cities (outer grid)
    # ------------------------------------------------------------------
    def get_cities(self, state=None, sort='alpha', page=1, limit=20):
        df = self._city_summary.copy()

        # Filter by state
        if state:
            df = df[df['state'].str.lower() == state.strip().lower()]

        # Sort
        if sort == 'most_reviewed':
            df = df.sort_values('total_reviews', ascending=False)
        elif sort == 'highest_rated':
            df = df.sort_values('avg_rating', ascending=False)
        else:  # alphabetical
            df = df.sort_values('city')

        total = len(df)
        total_pages = max(1, math.ceil(total / limit))
        page = max(1, min(page, total_pages))
        start = (page - 1) * limit
        page_df = df.iloc[start:start + limit]

        cities = []
        for _, row in page_df.iterrows():
            city_key = f"{row['city']} {row['state']} India tourism"
            thumb, _ = self._get_enrichment(city_key)
            if not thumb or self._is_bad_url(thumb):
                from ml.image_scraper import get_google_images
                photos = get_google_images(city_key, 1)
                thumb = photos[0] if photos else self._get_type_fallback(city_key)

            cities.append({
                'city': row['city'],
                'state': row['state'],
                'place_count': int(row['place_count']),
                'avg_rating': float(row['avg_rating']),
                'total_reviews_lakhs': float(row['total_reviews']),
                'thumbnail': thumb,
            })

        return {
            'cities': cities,
            'page': page,
            'limit': limit,
            'total': total,
            'total_pages': total_pages,
            'states': self._states,
        }

    # ------------------------------------------------------------------
    # Public API: places within a city (inner drill-down)
    # ------------------------------------------------------------------
    def get_city_places(self, city, sort='alpha', page=1, limit=10):
        clean_city = (city or '').strip().lower()
        print(f"[CityIndex ML] Searching places for city: '{city}' (Normalized: '{clean_city}')")
        
        # Try exact normalized match
        df = self.places_df[self.places_df['city'].str.strip().str.lower() == clean_city].copy()
        
        # If no exact match, try contains / substring match
        if df.empty and clean_city:
            df = self.places_df[self.places_df['city'].str.strip().str.lower().str.contains(clean_city, regex=False)].copy()
            
        print(f"[CityIndex ML] Found {len(df)} matching places in Python dataset for '{clean_city}'")

        if sort == 'most_reviewed':
            df = df.sort_values('review_count_lakhs', ascending=False)
        elif sort == 'highest_rated':
            df = df.sort_values('rating', ascending=False)
        else:
            df = df.sort_values('name')

        total = len(df)
        total_pages = max(1, math.ceil(total / limit))
        page = max(1, min(page, total_pages))
        start = (page - 1) * limit
        page_df = df.iloc[start:start + limit]

        places = []
        for _, row in page_df.iterrows():
            # Use richer query key: include the place name + city + India + tourism
            place_key = f"{row['name']} {row['city']} India tourism"
            img, images_list = self._get_enrichment(place_key, place_type=row['type'])
            # If the enrichment returned only a generic/type fallback, try live search
            generic_prefix = 'https://images.unsplash.com'
            if (not img or self._is_bad_url(img)) or \
               (not images_list or (len(images_list) == 1 and generic_prefix in images_list[0])):
                from ml.image_scraper import get_google_images
                fetched = get_google_images(place_key, 3)
                if fetched:
                    img = fetched[0]
                    images_list = fetched
            photos = images_list if images_list and len(images_list) > 0 else [img]
            
            # Read rating, reviews, entrance_fee directly from database
            rating = float(row['rating']) if (pd.notna(row['rating']) and float(row['rating']) > 0) else 4.2
            reviews = float(row['review_count_lakhs']) if pd.notna(row['review_count_lakhs']) else 0.0
            fee = float(row['entrance_fee']) if pd.notna(row['entrance_fee']) else 0.0
            is_google = False

            places.append({
                'name': row['name'],
                'city': row['city'],
                'state': row['state'],
                'type': row['type'],
                'rating': rating,
                'review_count_lakhs': reviews,
                'entrance_fee': fee,
                'best_time': row['best_time'],
                'latitude': float(row['latitude']) if pd.notna(row['latitude']) else None,
                'longitude': float(row['longitude']) if pd.notna(row['longitude']) else None,
                'image': img,
                'photos': photos,
                'teaser': '',
                'google_powered': is_google,
            })

        # Get the city's state for context
        city_state = df['state'].iloc[0] if len(df) > 0 else ''

        return {
            'city': city,
            'state': city_state,
            'places': places,
            'page': page,
            'limit': limit,
            'total': total,
            'total_pages': total_pages,
        }

    # ------------------------------------------------------------------
    # Public API: city detail (hero info for the dedicated city page)
    # ------------------------------------------------------------------
    def get_city_detail(self, city_slug):
        """Return metadata for a single city by slug (lowercase, hyphenated)."""
        # Normalize slug: 'new-delhi' -> 'new delhi'
        city_name_lower = city_slug.replace('-', ' ').strip().lower()

        match = self._city_summary[
            self._city_summary['city'].str.strip().str.lower() == city_name_lower
        ]

        if match.empty:
            return None

        row = match.iloc[0]
        city_key = f"{row['city']} {row['state']} India tourism"
        thumb, images_list = self._get_enrichment(city_key)
        teaser = ''
        if not thumb or self._is_bad_url(thumb):
            from ml.image_scraper import get_google_images
            # No fast_mode — fetch real travel photos
            photos = get_google_images(city_key, 2)
            if photos and len(photos) > 1:
                thumb = photos[1] if not self._is_bad_url(photos[1]) else photos[0]
            elif photos:
                thumb = photos[0]

        return {
            'city': row['city'],
            'state': row['state'],
            'place_count': int(row['place_count']),
            'avg_rating': float(row['avg_rating']),
            'total_reviews_lakhs': float(row['total_reviews']),
            'thumbnail': thumb,
            'teaser': teaser or '',
            'slug': city_slug,
        }

    # ------------------------------------------------------------------
    # Public API: nearby cities (same state, excluding current city)
    # ------------------------------------------------------------------
    def get_nearby_cities(self, city_slug, limit=6):
        """Return cities in the same state as the given city."""
        city_name_lower = city_slug.replace('-', ' ').strip().lower()

        match = self._city_summary[
            self._city_summary['city'].str.strip().str.lower() == city_name_lower
        ]

        if match.empty:
            return []

        target_state = match.iloc[0]['state']

        # Get all cities in the same state, excluding the current city
        same_state = self._city_summary[
            (self._city_summary['state'] == target_state) &
            (self._city_summary['city'].str.strip().str.lower() != city_name_lower)
        ].copy()

        # Sort by total_reviews descending to show most popular first
        same_state = same_state.sort_values('total_reviews', ascending=False).head(limit)

        nearby = []
        for _, row in same_state.iterrows():
            # Use full enrichment key — NOT just the city name (avoids wrong token matches)
            nearby_key = f"{row['city']} {row['state']} India tourism"
            thumb, _ = self._get_enrichment(nearby_key)
            if not thumb or self._is_bad_url(thumb):
                from ml.image_scraper import get_google_images
                # No fast_mode — fetch real travel photos
                photos = get_google_images(nearby_key, 1)
                thumb = photos[0] if photos else self._get_type_fallback(nearby_key)
            slug = row['city'].strip().lower().replace(' ', '-')
            nearby.append({
                'city': row['city'],
                'state': row['state'],
                'place_count': int(row['place_count']),
                'avg_rating': float(row['avg_rating']),
                'total_reviews_lakhs': float(row['total_reviews']),
                'thumbnail': thumb,
                'slug': slug,
            })

        return nearby

    # ------------------------------------------------------------------
    # Public API: single place detail
    # ------------------------------------------------------------------
    def get_place_detail(self, city_slug, place_slug):
        """Return full detail for a single place."""
        city_name_lower = city_slug.replace('-', ' ').strip().lower()
        place_name_lower = place_slug.replace('-', ' ').strip().lower()

        df = self.places_df[
            self.places_df['city'].str.strip().str.lower() == city_name_lower
        ]

        # Try exact match first
        match = df[df['name'].str.strip().str.lower() == place_name_lower]

        # Fallback: partial match
        if match.empty:
            match = df[df['name'].str.strip().str.lower().str.contains(place_name_lower, na=False)]

        if match.empty:
            return None

        row = match.iloc[0]
        # Richer place key: name + city + state + India tourism
        place_key = f"{row['name']} {row['city']} {row['state']} India tourism"
        img, images_list = self._get_enrichment(place_key)
        if not img or self._is_bad_url(img):
            # Try city enrichment as secondary
            city_key = f"{row['city']} {row['state']} India tourism"
            img, _ = self._get_enrichment(city_key)
        teaser = ''
            
        from ml.image_scraper import get_google_images

        # Priority queries for the FIRST (hero) image — must represent the destination
        GENERIC_FALLBACK = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1"
        PRIORITY_SUFFIXES = [
            "famous landmark",
            "temple",
            "mountain",
            "tourist attraction",
        ]

        def _is_generic(url):
            """Return True when the URL is the generic travel-photo fallback."""
            return not url or GENERIC_FALLBACK.split("?")[0] in url

        def _find_specific_image(place_name, city_name):
            """Try priority queries until we find a non-generic cached image."""
            for suffix in PRIORITY_SUFFIXES:
                query = f"{place_name} {city_name} india {suffix}"
                hits = get_google_images(query, 1, fast_mode=True)
                if hits and not _is_generic(hits[0]):
                    return hits[0]
            return ""

        if images_list and len(images_list) > 1:
            photos = images_list
            img = photos[0]
            # If the cached first image is generic, try a specific query
            if _is_generic(img):
                specific = _find_specific_image(row['name'], row['city'])
                if specific:
                    img = specific
                    photos = [img] + photos[1:]
        elif img and not _is_generic(img):
            photos = [img] + get_google_images(f"{row['name']} {row['city']} india", 4, fast_mode=True)
            img = photos[0]
        else:
            # No specific image yet — search with priority queries
            specific = _find_specific_image(row['name'], row['city'])
            rest = get_google_images(f"{row['name']} {row['city']} india", 4, fast_mode=True)
            if specific:
                photos = [specific] + rest
                img = specific
            elif img and not _is_generic(img):
                photos = [img] + rest
                img = photos[0]
            else:
                # Build a destination-specific Unsplash URL as absolute last resort
                encoded = row['name'].lower().replace(' ', '%20')
                city_enc = row['city'].lower().replace(' ', '%20')
                destination_url = (
                    f"https://source.unsplash.com/800x600/?"
                    f"{encoded},{city_enc},india,landmark"
                )
                photos = [destination_url] + rest
                img = destination_url

        # Read rating, reviews, entrance_fee directly from database
        rating = float(row['rating']) if (pd.notna(row['rating']) and float(row['rating']) > 0) else 4.2
        reviews = float(row['review_count_lakhs']) if pd.notna(row['review_count_lakhs']) else 0.0
        fee = float(row['entrance_fee']) if pd.notna(row['entrance_fee']) else 0.0
        is_google = False

        lat = float(row['latitude']) if pd.notna(row['latitude']) else None
        lng = float(row['longitude']) if pd.notna(row['longitude']) else None

        # Google Maps link
        google_maps_url = ''
        if lat and lng:
            google_maps_url = f'https://www.google.com/maps?q={lat},{lng}'
        else:
            google_maps_url = f'https://www.google.com/maps/search/{row["name"]}+{row["city"]}+India'

        return {
            'name': row['name'],
            'city': row['city'],
            'state': row['state'],
            'type': row['type'],
            'rating': rating,
            'review_count_lakhs': reviews,
            'entrance_fee': fee,
            'best_time': row['best_time'],
            'latitude': lat,
            'longitude': lng,
            'image': img,
            'photos': photos,
            'teaser': teaser or '',
            'google_powered': is_google,
            'google_maps_url': google_maps_url,
            'slug': place_slug,
            'city_slug': city_slug,
        }

    # ------------------------------------------------------------------
    # Full-text Search (across cities and places)
    # ------------------------------------------------------------------
    def search(self, query, limit=20):
        if not query or len(query) < 1:
            return {'cities': [], 'places': []}
            
        q_lower = query.strip().lower()
        
        # 1. Search Cities
        city_mask = (
            self._city_summary['city'].str.lower().str.contains(q_lower, na=False) |
            self._city_summary['state'].str.lower().str.contains(q_lower, na=False)
        )
        city_matches = self._city_summary[city_mask].head(limit)
        
        cities = []
        for _, row in city_matches.iterrows():
            # Use full enrichment key — avoid single-token partial matching
            city_key = f"{row['city']} {row['state']} India tourism"
            thumb, _ = self._get_enrichment(city_key)
            if not thumb or self._is_bad_url(thumb):
                from ml.image_scraper import get_google_images
                # No fast_mode — fetch real travel photos
                photos = get_google_images(city_key, 1)
                thumb = photos[0] if photos else self._get_type_fallback(city_key)
            cities.append({
                'name': row['city'],
                'state': row['state'],
                'place_count': int(row['place_count']),
                'rating': float(row['avg_rating']),
                'total_reviews_lakhs': float(row['total_reviews']),
                'thumbnail': thumb,
            })
            
        # 2. Search Places
        place_mask = (
            self.places_df['name'].str.lower().str.contains(q_lower, na=False) |
            self.places_df['city'].str.lower().str.contains(q_lower, na=False) |
            self.places_df['state'].str.lower().str.contains(q_lower, na=False) |
            self.places_df['type'].str.lower().str.contains(q_lower, na=False)
        )
        place_matches = self.places_df[place_mask].head(limit)
        
        places = []
        for _, row in place_matches.iterrows():
            # Richer place key for search results
            place_key = f"{row['name']} {row['city']} India tourism"
            img, images_list = self._get_enrichment(place_key)
            if not img or self._is_bad_url(img):
                from ml.image_scraper import get_google_images
                photos = get_google_images(place_key, 1)
                img = photos[0] if photos else self._get_type_fallback(place_key, row['type'])
            teaser = ''
            places.append({
                'name': row['name'],
                'city': row['city'],
                'state': row['state'],
                'type': row['type'],
                'image': img or '',
                'description': teaser or f"A popular {str(row['type']).lower()} destination in {row['city']}.",
            })
            
        return {
            'cities': cities,
            'places': places
        }

    # ------------------------------------------------------------------
    # Utility: autocomplete place names
    # ------------------------------------------------------------------
    def autocomplete_places(self, query, limit=10):
        """Return city and place names matching the query prefix."""
        if not query or len(query) < 1:
            return []
        q_lower = query.strip().lower()
        
        # 1. Match Cities
        city_matches = self.places_df[
            self.places_df['city'].str.strip().str.lower().str.startswith(q_lower, na=False)
        ].drop_duplicates(subset='city').head(limit)
        
        city_results = [
            {'name': row['city'], 'city': row['state'], 'state': row['state'], 'is_city': True}
            for _, row in city_matches.iterrows()
        ]
        
        # 2. Match Places
        place_matches = self.places_df[
            self.places_df['name'].str.strip().str.lower().str.startswith(q_lower, na=False)
        ].drop_duplicates(subset='name').head(limit)
        
        place_results = [
            {'name': row['name'], 'city': row['city'], 'state': row['state'], 'is_city': False}
            for _, row in place_matches.iterrows()
        ]
        
        # Deduplicate names if city name and place name are identical (unlikely but possible)
        seen = set()
        combined = []
        for item in (city_results + place_results):
            if item['name'] not in seen:
                seen.add(item['name'])
                combined.append(item)
                if len(combined) >= limit:
                    break
                    
        return combined


# Singleton
city_index = CityIndex()

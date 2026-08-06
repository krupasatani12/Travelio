"""
Management command: refresh_image_cache

Pre-warms the image_cache.json for all cities and places using the improved
multi-query pipeline in image_scraper.py.

Usage:
    python manage.py refresh_image_cache
    python manage.py refresh_image_cache --cities-only
    python manage.py refresh_image_cache --places-only
    python manage.py refresh_image_cache --limit 50   # process first 50 destinations
    python manage.py refresh_image_cache --force       # re-fetch even cached entries
"""
from django.core.management.base import BaseCommand
import time


class Command(BaseCommand):
    help = 'Pre-warm the image cache for all cities and places using travel-specific queries.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cities-only',
            action='store_true',
            help='Only refresh city thumbnails.',
        )
        parser.add_argument(
            '--places-only',
            action='store_true',
            help='Only refresh place images.',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=0,
            help='Maximum number of destinations to process (0 = all).',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-fetch images even for destinations that are already cached.',
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=1.5,
            help='Seconds to wait between requests to avoid rate limiting (default: 1.5).',
        )

    def handle(self, *args, **options):
        from ml.city_index import city_index
        from ml.image_scraper import get_google_images, image_cache, _save_cache, is_bad_url

        cities_only = options['cities_only']
        places_only = options['places_only']
        limit = options['limit']
        force = options['force']
        delay = options['delay']

        processed = 0
        skipped = 0
        errors = 0

        def needs_refresh(key):
            """Return True if the key is not yet cached or force is set."""
            if force:
                return True
            cached = image_cache.get(key.lower().strip(), [])
            # Refresh if empty or all images are bad/generic Unsplash fallbacks
            if not cached:
                return True
            bad = sum(1 for u in cached if is_bad_url(u) or 'unsplash.com' in u)
            return bad == len(cached)  # all images are fallbacks

        # ── Cities ────────────────────────────────────────────────────────────
        if not places_only:
            self.stdout.write(self.style.MIGRATE_HEADING('\nRefreshing city thumbnails...'))
            city_df = city_index._city_summary

            for _, row in city_df.iterrows():
                if limit and processed >= limit:
                    break

                city_key = f"{row['city']} {row['state']} India tourism"
                if not needs_refresh(city_key):
                    skipped += 1
                    continue

                try:
                    self.stdout.write(f"  [{processed + 1}] {row['city']}, {row['state']}...")
                    imgs = get_google_images(city_key, count=3)
                    good = [u for u in imgs if not is_bad_url(u) and 'unsplash.com' not in u]
                    status = self.style.SUCCESS(f"✓ {len(good)} travel photos") if good \
                        else self.style.WARNING("⚠ fallback only")
                    self.stdout.write(f"    {status}")
                    processed += 1
                    time.sleep(delay)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"    ✗ Error: {e}"))
                    errors += 1
                    time.sleep(delay * 2)

        # ── Places ────────────────────────────────────────────────────────────
        if not cities_only:
            self.stdout.write(self.style.MIGRATE_HEADING('\nRefreshing place images...'))
            places_df = city_index.places_df

            for _, row in places_df.iterrows():
                if limit and processed >= limit:
                    break

                place_key = f"{row['name']} {row['city']} {row['state']} India tourism"
                if not needs_refresh(place_key):
                    skipped += 1
                    continue

                try:
                    self.stdout.write(f"  [{processed + 1}] {row['name']} ({row['city']})...")
                    imgs = get_google_images(place_key, count=4)
                    good = [u for u in imgs if not is_bad_url(u) and 'unsplash.com' not in u]
                    status = self.style.SUCCESS(f"✓ {len(good)} travel photos") if good \
                        else self.style.WARNING("⚠ fallback only")
                    self.stdout.write(f"    {status}")
                    processed += 1
                    time.sleep(delay)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"    ✗ Error: {e}"))
                    errors += 1
                    time.sleep(delay * 2)

        # ── Summary ───────────────────────────────────────────────────────────
        _save_cache()
        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone! Processed: {processed} | Skipped (cached): {skipped} | Errors: {errors}'
            )
        )

        # Reload the city_index enrichment cache so the new images are visible immediately
        try:
            city_index.__class__._enrichment_cache = None
            self.stdout.write(self.style.SUCCESS('Enrichment cache cleared — will reload on next request.'))
        except Exception:
            pass

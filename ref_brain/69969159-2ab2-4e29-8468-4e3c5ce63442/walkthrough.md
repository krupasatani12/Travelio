# Phase 5 Walkthrough: Credit System

I've successfully implemented the Credit System, meaning AI endpoints are now protected and metered!

## What changed?

1. **User Accounts Now Have AI Credits**
   - In the database, every user now receives 10 AI credits by default upon registering.
   - You can see your current credit balance in the **Navbar** (desktop) next to your name (e.g., "⚡ 10").

2. **Deducting Credits on AI Usage**
   - Generating an Itinerary: Costs **2 credits**.
   - Extending an Itinerary: Costs **1 credit**.
## Phase 5: Credit System
- Implemented `creditMiddleware.js` to deduct credits for AI endpoint usage.
- Handled out-of-credit scenario by returning a 402 HTTP status, which triggers a beautiful React-based upgrade modal in the frontend.
- Added a `node-cron` job in `server.js` to reset all users to `3` credits at midnight IST.

## Phase 6: Splash Screen & Dynamic Image Resolution
- Converted `paper_plane_animation.svg` into a proper React component (`SplashLoader.jsx`).
- Configured `App.jsx` to render this splash screen smoothly via `framer-motion` for the first 3.5 seconds when the site loads.
- Discovered that places data comes from the Django ML backend, and the Taj Mahal images were hardcoded as the default fallback in Python.
- Removed the hardcoded Taj Mahal fallback in `embedding_index.py` and `recommender.py`.
- Updated `city_index.py` to seamlessly scrape 5 images from DuckDuckGo on the fly when a city or place lacks images.
- Ensured it uses the 2nd image returned for the place/city thumbnail (as requested) and passes all images to the frontend.
- These images are saved automatically in `temp/image_cache.json` to speed up subsequent queries!

## Verification
✅ Code paths for deducting credits run as expected.
✅ Checked UI state hooks to ensure credits decrement synchronously without needing to refresh the page.
✅ Error boundaries correctly capture the specific `402` status code and render user-friendly messages rather than crashing.

> [!TIP]
> **Check it out!** 
> Log into the app. Notice the "⚡ 10" badge in the navigation bar. Try generating an itinerary or chatting with the bot to see the balance decrease!

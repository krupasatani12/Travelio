# Phase 6: Database Expansion

In this phase, we will enrich our database by fetching unique location images and integrating real flight data, as well as polishing the initial app loading experience.

## Proposed Changes

### 1. Image Scraping & Local Storage
- **Update Model:** Modify `Location.js` to include an `images` array (array of strings) alongside `heroImage`.
- **Migration Script:** Create a Node.js/Python script that scans MongoDB for any Location currently using the default Unsplash "Taj Mahal" picture.
- **Downloading:** For each matching location, we will fetch 5 unique images via DuckDuckGo search. We will download these images directly to the server's local file system (`server/uploads/locations/{locationId}/`) and store their local URLs in MongoDB, fulfilling the requirement to store them locally.

### 2. Flight Data Integration
- **New Model:** Create a `Flight.js` Mongoose model matching the structure of `temp/flights.csv` (Airline, Source, Destination, Dep_Time, Price, etc.).
- **Seeding:** Write a script to parse `flights.csv` and bulk-insert the 15,000+ flight records into MongoDB.
- **API Endpoint:** Create `/api/flights/search` allowing the frontend to query real flight prices based on the user's starting city and chosen destination.

### 3. Initial Branding Animation
- **Component:** Create a `SplashLoader.jsx` component in React.
- **Inline SVG:** As requested, I will fetch the actual raw code from `temp/paper_plane_animation.svg` and inline it directly into the React component instead of using an `<img>` tag.
- **Integration:** Hook this component into `App.jsx` so it displays for a few seconds when the site is first opened.

## Open Questions

> [!WARNING]
> **Flight Data Size**
> The `flights.csv` file has over 15,000 rows. Inserting these into a free-tier MongoDB cluster is fine, but we need to ensure we index the `source` and `destination` fields so queries remain fast. Are you okay with me adding these indexes to the MongoDB schema?

> [!TIP]
> **Scraping Time**
> Downloading 5 full-resolution images for dozens of locations and saving them to disk will take a few minutes to run. I will write the script to show progress logs while it downloads. Is that acceptable?

## Verification Plan

### Database & Images
- Check `server/uploads/locations/` to ensure image files are actually saved to the local disk.
- Verify MongoDB `Location` documents now point to `/uploads/...` instead of Unsplash.

### Flights
- Run the flight seeder script and verify the document count in MongoDB.
- Test the `/api/flights/search` endpoint via HTTP request.

### Animation
- Reload the React app and confirm the inline paper plane SVG plays its animation perfectly before the main app renders.

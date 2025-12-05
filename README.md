# EMBER Tracker

A wildfire tracking application built with Leaflet and NASA FIRMS satellite data.

## What it does

Displays active fire detections from NASA satellites on an interactive map. Fire markers are sized by intensity and colored by confidence level. Click any fire to zoom in and see details like brightness temperature, radiative power, and detection time.

## Setup

1. Open `wildfire-tracker.html` in a browser
2. The app loads with demo data by default

To use live satellite data:

1. Get a free API key from [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/api/map_key)
2. Open `wildfire-tracker.html` in a text editor
3. Find `const MAP_KEY = 'YOUR_MAP_KEY_HERE'` near the bottom
4. Replace `YOUR_MAP_KEY_HERE` with your key
5. Save and refresh

## Controls

- **Satellite Sensor**: Choose between VIIRS (375m resolution) or MODIS (1km resolution)
- **Time Range**: Number of days to fetch (1-10)
- **Bounding Box**: Geographic region to query. Updates automatically when you pan the map.

## Data sources

- Fire detections: [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/)
- Map tiles: [CARTO](https://carto.com/)
- Satellites: VIIRS (Suomi NPP, NOAA-20, NOAA-21) and MODIS (Terra, Aqua)

## Requirements

- Modern web browser
- Internet connection
- NASA FIRMS API key (for live data)

## License

MIT License. See LICENSE file.

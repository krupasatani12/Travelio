const axios = require('axios');

const DJANGO_URL = process.env.DJANGO_ML_URL || 'http://localhost:8000/api';

const mlClient = axios.create({
  baseURL: DJANGO_URL,
  timeout: 120000, // 2 minutes to allow initial model loading/parsing
  headers: { 'Content-Type': 'application/json' },
});

module.exports = {
  getRecommendations: async (preferences) => {
    const res = await mlClient.post('/recommend/', preferences);
    return res.data;
  },
  getBudgetPrediction: async (params) => {
    const res = await mlClient.post('/budget/predict/', params);
    return res.data;
  },
  getPackageBudgetPrediction: async (params) => {
    const res = await mlClient.post('/budget/package-predict/', params);
    return res.data;
  },
  getSemanticSearch: async (query) => {
    const res = await mlClient.post('/search/semantic/', { query });
    return res.data;
  },
  getSearch: async (query) => {
    const res = await mlClient.get('/search/', { params: { q: query } });
    return res.data;
  },
  getSafetyScore: async (city) => {
    const res = await mlClient.get(`/safety/${encodeURIComponent(city)}/`);
    return res.data;
  },
  getCities: async (query) => {
    // query = { state, sort, page, limit }
    const res = await mlClient.get('/cities/', { params: query });
    return res.data;
  },
  getAllPlaces: async () => {
    const res = await mlClient.get('/all-places/');
    return res.data;
  },
  getAllCities: async () => {
    const res = await mlClient.get('/all-cities/');
    return res.data;
  },
  getCityPlaces: async (cityName, query) => {
    // query = { sort, page, limit }
    const res = await mlClient.get(`/cities/${encodeURIComponent(cityName)}/places/`, { params: query });
    return res.data;
  },
  getNewsAlerts: async (destinations) => {
    const res = await mlClient.get(`/news/alerts/?destinations=${destinations}`);
    return res.data;
  },
  getRoute: async (source, destination, optimize, mode) => {
    let url = `/route/?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&optimize=${optimize}`;
    if (mode) {
      url += `&mode=${mode}`;
    }
    const res = await mlClient.get(url);
    return res.data;
  },
  getSeasonalData: async (destination, month) => {
    const res = await mlClient.get('/seasonal/', {
      params: { destination, month },
    });
    return res.data;
  },
  getCityDetail: async (citySlug) => {
    const res = await mlClient.get(`/cities/${encodeURIComponent(citySlug)}/detail/`);
    return res.data;
  },
  getCityNearby: async (citySlug, limit = 6) => {
    const res = await mlClient.get(`/cities/${encodeURIComponent(citySlug)}/nearby/`, { params: { limit } });
    return res.data;
  },
  getPlaceDetail: async (citySlug, placeSlug) => {
    const res = await mlClient.get(`/cities/${encodeURIComponent(citySlug)}/places/${encodeURIComponent(placeSlug)}/detail/`);
    return res.data;
  },
  getPlacesAutocomplete: async (query, limit = 10) => {
    const res = await mlClient.get('/places/autocomplete/', { params: { q: query, limit } });
    return res.data;
  },
};

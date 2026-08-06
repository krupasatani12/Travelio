import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Gateway URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('travelio_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('travelio_token');
    if (token) {
      try {
        // Set token in headers for initial load
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (error) {
        console.error("Auth fetch error:", error);
        localStorage.removeItem('travelio_token');
        delete api.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('travelio_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('travelio_token');
    delete api.defaults.headers.common['Authorization'];
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const res = await api.put('/auth/preferences', newPrefs);
      setUser(prev => ({ ...prev, preferences: res.data.preferences }));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, updatePreferences, fetchUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

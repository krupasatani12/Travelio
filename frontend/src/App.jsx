import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import TravelBot from './components/chat/TravelBot';
import SplashLoader from './components/common/SplashLoader';
import AuthGate from './components/common/AuthGate';
import { AnimatePresence } from 'framer-motion';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import Dashboard from './pages/Dashboard';
import Places from './pages/Places';
import CityPage from './pages/CityPage';
import PlaceDetailPage from './pages/PlaceDetailPage';

import TripPlanner from './pages/TripPlanner';
import BudgetForecaster from './pages/BudgetForecaster';
import SafetyChecker from './pages/SafetyChecker';
import LandmarkDetector from './pages/LandmarkDetector';
import PackingAssistant from './pages/PackingAssistant';
import NewsAlerts from './pages/NewsAlerts';
import SearchResults from './pages/SearchResults';

import Journal from './pages/Journal';
import AdminDashboard from './pages/AdminDashboard';
import ChatbotPage from './pages/ChatbotPage';

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Show splash screen for 3.5 seconds on initial load to let animation finish
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {initialLoading && <SplashLoader />}
      </AnimatePresence>
      {!initialLoading && (
        <>
          <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/places" element={<Places />} />
        <Route path="/places/:citySlug" element={<CityPage />} />
        <Route path="/places/:citySlug/:placeSlug" element={<PlaceDetailPage />} />
        <Route path="/plan" element={<TripPlanner />} />
        <Route path="/budget" element={<BudgetForecaster />} />
        <Route path="/safety" element={<SafetyChecker />} />
        <Route path="/landmark" element={<LandmarkDetector />} />
        <Route path="/packing" element={<PackingAssistant />} />
        <Route path="/route" element={<PackingAssistant />} />
        <Route path="/news" element={<NewsAlerts />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/journal" element={<Journal />} />
        <Route 
          path="/admin" 
          element={
            <AuthGate mode="page" action="access the Admin Dashboard">
              <AdminDashboard />
            </AuthGate>
          } 
        />
        <Route path="/chatbot" element={<ChatbotPage />} />
      </Routes>
      <Footer />
      {/* Global Chat Widget */}
      <TravelBot />
        </>
      )}
    </Router>
  );
}

export default App;

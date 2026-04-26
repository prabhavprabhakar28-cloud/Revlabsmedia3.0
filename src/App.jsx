import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Layout from './components/Layout';
import CinematicPreloader from './components/CinematicPreloader';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Public pages
import Home          from './pages/Home';
import Services      from './pages/Services';
import Work          from './pages/Work';
import About         from './pages/About';
import Contact       from './pages/Contact';
import Privacy       from './pages/Privacy';
import Terms         from './pages/Terms';

// Auth pages
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';

// Protected pages
import Payment      from './pages/Payment';
import Dashboard   from './pages/Dashboard';
import ReportDetail from './pages/ReportDetail';
import Onboarding   from './pages/Onboarding';

// Components
import ErrorBoundary from './components/ErrorBoundary';

// Admin panel (nested routes handled inside AdminPanel)
import AdminPanel from './pages/admin/AdminPanel';

function App() {
  return (
    <>
      <CinematicPreloader />
      <ErrorBoundary>
        <Layout>
        <Analytics />
        <Routes>
          {/* ── Public ────────────────────────────────────────── */}
          <Route path="/"        element={<Home />} />
          <Route path="/work"    element={<Work />} />
          <Route path="/about"   element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms"   element={<Terms />} />
          <Route path="/services" element={<Services />} />
          <Route path="/welcome"  element={<Onboarding />} />

          {/* ── Auth ──────────────────────────────────────────── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/signup"          element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* ── Protected (must be logged in) ─────────────────── */}
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/report/:id"
            element={
              <ProtectedRoute>
                <ReportDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Admin (must be logged in + role=admin) ─────────── */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
        </Routes>
        </Layout>
      </ErrorBoundary>
    </>
  );
}

export default App;

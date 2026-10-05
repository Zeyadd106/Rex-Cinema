import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import Layout from './components/Layout';
import Splash from './components/Splash';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import ComingSoon from './pages/ComingSoon';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import BookMovie from './pages/BookMovie';
import Bookings from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Payment from './pages/Payment';
import Confirmation from './pages/Confirmation';
import FoodAndDrinks from './pages/FoodAndDrinks';
import WaysToWatch from './pages/WaysToWatch';
import Offers from './pages/Offers';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminMovieForm from './pages/admin/AdminMovieForm';
import AdminBookings from './pages/admin/AdminBookings';
import AdminBookingDetail from './pages/admin/AdminBookingDetail';
import AdminCheckIn from './pages/admin/AdminCheckIn';
import AdminUsers from './pages/admin/AdminUsers';
import AdminShowtimes from './pages/admin/AdminShowtimes';
import AdminCinemas from './pages/admin/AdminCinemas';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const dismissSplash = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => {
      setShowSplash(false);
      document.body.style.overflow = '';
    }, 450);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t1 = window.setTimeout(() => setLeaving(true), 2150);
    const t2 = window.setTimeout(() => {
      setShowSplash(false);
      document.body.style.overflow = '';
    }, 2600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <AuthProvider>
      <LangProvider>
      <BrowserRouter>
        {showSplash && <Splash leaving={leaving} onSkip={dismissSplash} />}
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/food-and-drinks" element={<FoodAndDrinks />} />
            <Route path="/ways-to-watch" element={<WaysToWatch />} />
            <Route path="/ways-to-watch/:slug" element={<WaysToWatch />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset/:token" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/book/:movieId" element={<ProtectedRoute><BookMovie /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
            <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
            <Route path="/pay/:bookingId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
            <Route path="/confirmation/:bookingId" element={<ProtectedRoute><Confirmation /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="movies" element={<AdminMovies />} />
              <Route path="movies/new" element={<AdminMovieForm />} />
              <Route path="movies/:id/edit" element={<AdminMovieForm />} />
              <Route path="showtimes" element={<AdminShowtimes />} />
              <Route path="cinemas" element={<AdminCinemas />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="bookings/:id" element={<AdminBookingDetail />} />
              <Route path="check-in" element={<AdminCheckIn />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  );
}

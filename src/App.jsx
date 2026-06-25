import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import ParentComponent from './pages/Home/ParentComponent';
import LandingPage from './pages/Home/LandingPage';
import HomePage from './pages/Home/HomePage';
import Movie from './pages/Home/Movie/Movie';
import Series from './pages/Home/TV/Series';
import SearchPage from './pages/Home/SearchPage';
import TrendingPage from './pages/Home/TrendingPage';
import AnimationPage from './pages/Home/AnimationPage';
import MovieDetails from './pages/Home/Movie/MovieDetails';
import TvDetails from './pages/Home/TV/TvDetails';
import WatchlistPage from './pages/Home/WatchlistPage';
import AfricaPridePage from './pages/Home/AfricaPridePage';
import BestArtistsPage from './pages/Home/BestArtistsPage';
import UpcomingMoviesPage from './pages/Home/UpcomingMoviesPage';
import ResetPasswordPage from './pages/Home/ResetPasswordPage';
import EmailVerificationPage from './pages/Home/EmailVerificationPage';
import PersonPage from './pages/Home/Person/PersonPage';
import AuthActionPage from './pages/Home/AuthActionPage';
import PreferencesSetup from './pages/Home/PreferencesSetup';
import OnboardingGuard from './components/OnboardingGuard';
import DownloadPage from './pages/Home/DownloadPage';
import IosDownloadPage from './pages/Home/IosDownloadPage';
import AndroidDownloadPage from './pages/Home/AndroidDownloadPage';
import ComputerDownloadPage from './pages/Home/ComputerDownloadPage';
import AdminPage from './pages/Home/AdminPage';
import ProfilePage from './pages/Home/ProfilePage';

function App() {
  useEffect(() => {
    // Request Notification permission automatically on app startup
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
          .then((permission) => {
            console.log(`Notification permission status: ${permission}`);
          })
          .catch((err) => {
            console.warn('Notification permission request failed:', err);
          });
      }
    }

    // Request Geolocation permission automatically on app startup
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location permission granted', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Location permission denied/failed:', error.message);
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
      );
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Custom standalone immersive landing page */}
        <Route path="/" element={<LandingPage />} />

        <Route element={<ParentComponent />}>
          <Route element={<OnboardingGuard />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/movies" element={<Movie />} />
            <Route path="/movies/:genreSlug" element={<Movie />} />
            <Route path="/movies/:genreSlug/:sortSlug" element={<Movie />} />
            <Route path="/series" element={<Series />} />
            <Route path="/series/:genreSlug" element={<Series />} />
            <Route path="/series/:genreSlug/:sortSlug" element={<Series />} />
            <Route path="/animations" element={<AnimationPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/movies/watch/:slug" element={<MovieDetails />} />
            <Route path="/series/watch/:slug" element={<TvDetails />} />
            <Route path="/download/:type/:slug" element={<DownloadPage />} />
            <Route path="/download/:type/:slug/ios" element={<IosDownloadPage />} />
            <Route path="/download/:type/:slug/android" element={<AndroidDownloadPage />} />
            <Route path="/download/:type/:slug/computer" element={<ComputerDownloadPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/person/:id/:slug" element={<PersonPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/best-artists" element={<BestArtistsPage />} />
            <Route path="/upcoming" element={<UpcomingMoviesPage />} />
            <Route path="/africa-pride" element={<AfricaPridePage />} />
            {/* Legacy detail URLs (auto-canonicalized in page components) */}
            <Route path="/movie/:slug" element={<MovieDetails />} />
            <Route path="/tv/:slug" element={<TvDetails />} />
          </Route>
          
          {/* Routes that don't need onboarding checks */}
          <Route path="/setup" element={<PreferencesSetup />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/auth-action" element={<AuthActionPage />} />
        </Route>
      </Routes>
      <Analytics />
      <SpeedInsights />
    </Router>
  );
}

export default App;

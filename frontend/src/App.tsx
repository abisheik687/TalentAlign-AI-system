import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box } from '@mui/material';

import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout/Layout';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

// Pages
import LoginPage from '@/pages/Auth/LoginPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import CandidatesPage from '@/pages/Candidates/CandidatesPage';
import JobsPage from '@/pages/Jobs/JobsPage';
import MatchingPage from '@/pages/Matching/MatchingPage';
import EthicsDashboardPage from '@/pages/Ethics/EthicsDashboardPage';
import ProfilePage from '@/pages/Profile/ProfilePage';
import NotFoundPage from '@/pages/NotFound/NotFoundPage';

function App(): JSX.Element {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <LoadingSpinner />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>TalentAlign AI - Ethical Recruiting Platform</title>
        <meta
          name="description"
          content="Ethical AI recruiting system focused on transparency and bias mitigation"
        />
      </Helmet>

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="candidates/*" element={<CandidatesPage />} />
                  <Route path="jobs/*" element={<JobsPage />} />
                  <Route path="matching/*" element={<MatchingPage />} />
                  <Route path="ethics/*" element={<EthicsDashboardPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
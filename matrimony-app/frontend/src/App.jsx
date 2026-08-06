import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import BrokerPending from './pages/BrokerPending';
import Dashboard from './pages/Dashboard';
import ProfileWizard from './pages/ProfileWizard';
import ProfileDetail from './pages/ProfileDetail';
import Search from './pages/Search';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import BrokerDashboard from './pages/BrokerDashboard';
import Chat from './pages/Chat';


export default function App() {
  return (
    <Routes>
      {/* Public: admin login page only. */}
      <Route path="/admin" element={<AdminLogin />} />

      {/* Protected: every other admin route requires an authenticated admin. */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/brokers"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/profiles"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      {/* Catch-all for any other /admin/* path — still guarded. */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Broker dashboard — full-screen panel with its own sidebar/topbar. */}
      <Route
        path="/broker/dashboard"
        element={
          <ProtectedRoute>
            <BrokerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/broker/profiles"
        element={
          <ProtectedRoute>
            <BrokerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/broker/interests"
        element={
          <ProtectedRoute>
            <BrokerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/broker/shortlist"
        element={
          <ProtectedRoute>
            <BrokerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/broker/messages"
        element={
          <ProtectedRoute>
            <BrokerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/broker/*"
        element={
          <ProtectedRoute>
            <BrokerDashboard />
          </ProtectedRoute>
        }
      />

      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile/:id" element={<ProfileDetail />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/new"
          element={
            <ProtectedRoute>
              <ProfileWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id/edit"
          element={
            <ProtectedRoute>
              <ProfileWizard />
            </ProtectedRoute>
          }
        />



        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:threadId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Landing />} />
      </Route>

      {/* Full-screen auth pages (no navbar/footer) */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/broker-pending" element={<BrokerPending />} />
    </Routes>
  );
}

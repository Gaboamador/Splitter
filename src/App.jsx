import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/layouts/AppLayout';
import CreateExpensePage from '@/pages/CreateExpensePage';
import CreateGroupPage from '@/pages/CreateGroupPage';
import CreatePaymentPage from '@/pages/CreatePaymentPage';
import EditExpensePage from '@/pages/EditExpensePage';
import EditGroupPage from '@/pages/EditGroupPage';
import GroupDetailPage from '@/pages/GroupDetailPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

function ProtectedRoute({ children }) {
  const { authLoading, isAuthenticated } = useAuth();

  if (authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { authLoading } = useAuth();

  if (authLoading) {
    return null;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="/grupos/nuevo" element={<CreateGroupPage />} />
        <Route path="/grupos/:groupId" element={<GroupDetailPage />} />
        <Route path="/grupos/:groupId/editar" element={<EditGroupPage />} />
        <Route path="/grupos/:groupId/gastos/nuevo" element={<CreateExpensePage />} />
        <Route path="/grupos/:groupId/gastos/:expenseId/editar" element={<EditExpensePage />} />
        <Route path="/grupos/:groupId/pagos/nuevo" element={<CreatePaymentPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
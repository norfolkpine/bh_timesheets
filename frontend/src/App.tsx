import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Dashboard (Protected)</div>
            </ProtectedRoute>
          }
        />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App; 
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { canAll } from '../../lib/permissions.js';
import { FullPageSpinner } from '../ui/Spinner.jsx';

export function RequirePermission({ permissions = [], children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-dvh bg-cream-100">
        <FullPageSpinner label="Checking your permissions" />
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!canAll(user, permissions)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export default RequirePermission;

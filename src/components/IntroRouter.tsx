import { Navigate, useLocation } from 'react-router-dom';

export function IntroRouter() {
  const location = useLocation();
  return <Navigate to={`/login${location.search}${location.hash}`} replace />;
}

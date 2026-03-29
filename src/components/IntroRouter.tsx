import { Navigate, useLocation } from 'react-router-dom';
import { BootSequence } from '@/components/boot-sequence';

export function IntroRouter() {
  const hasSeenIntro = localStorage.getItem('hasSeenIntro');
  const location = useLocation();

  if (hasSeenIntro || location.hash.includes('access_token')) {
    return <Navigate to={`/login${location.search}${location.hash}`} replace />;
  }

  return <BootSequence />;
}

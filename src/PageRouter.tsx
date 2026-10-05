import { lazy, Suspense } from 'react';
import App from './App';

const NotFoundPage = lazy(() => import('./components/not-found/NotFoundPage'));

export default function PageRouter() {
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') return <App />;
  return (
    <Suspense fallback={<main className="min-h-dvh bg-canvas" aria-label="Loading page" />}>
      <NotFoundPage />
    </Suspense>
  );
}

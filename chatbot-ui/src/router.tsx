import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const IndexesPage = lazy(() => import('./pages/IndexesPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Wrapper component for lazy-loaded pages
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <Layout>{children}</Layout>
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LazyPage>
        <HomePage />
      </LazyPage>
    ),
  },
  {
    path: '/agents',
    element: (
      <LazyPage>
        <AgentsPage />
      </LazyPage>
    ),
  },
  {
    path: '/documents',
    element: (
      <LazyPage>
        <DocumentsPage />
      </LazyPage>
    ),
  },
  {
    path: '/indexes',
    element: (
      <LazyPage>
        <IndexesPage />
      </LazyPage>
    ),
  },
  {
    path: '/chat',
    element: (
      <LazyPage>
        <ChatPage />
      </LazyPage>
    ),
  },
]);

export default router;

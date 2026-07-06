import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestOnlyRoute } from './GuestOnlyRoute';
import { FullPageSpinner } from '@/components/ui/Spinner';

const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const SearchPage = lazy(() => import('@/features/search/pages/SearchPage'));
const WatchPage = lazy(() => import('@/features/watch/pages/WatchPage'));
const ChannelPage = lazy(() => import('@/features/channel/pages/ChannelPage'));
const UploadPage = lazy(() => import('@/features/upload/pages/UploadPage'));
const EditVideoPage = lazy(() => import('@/features/videoManagement/pages/EditVideoPage'));
const MyPlaylistsPage = lazy(() => import('@/features/playlists/pages/MyPlaylistsPage'));
const PlaylistDetailsPage = lazy(() => import('@/features/playlists/pages/PlaylistDetailsPage'));
const HistoryPage = lazy(() => import('@/features/history/pages/HistoryPage'));
const SubscriptionsPage = lazy(() => import('@/features/subscriptions/pages/SubscriptionsPage'));
const ProfileSettingsPage = lazy(() => import('@/features/profile/pages/ProfileSettingsPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const NotFoundPage = lazy(() => import('@/features/notFound/pages/NotFoundPage'));

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<FullPageSpinner />}>{node}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <GuestOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: withSuspense(<LoginPage />) },
          { path: '/register', element: withSuspense(<RegisterPage />) },
        ],
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: withSuspense(<HomePage />) },
      { path: '/search', element: withSuspense(<SearchPage />) },
      { path: '/watch/:videoId', element: withSuspense(<WatchPage />) },
      { path: '/channel/:username', element: withSuspense(<ChannelPage />) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/upload', element: withSuspense(<UploadPage />) },
          { path: '/manage/:videoId', element: withSuspense(<EditVideoPage />) },
          { path: '/playlists', element: withSuspense(<MyPlaylistsPage />) },
          { path: '/playlists/:playlistId', element: withSuspense(<PlaylistDetailsPage />) },
          { path: '/history', element: withSuspense(<HistoryPage />) },
          { path: '/subscriptions', element: withSuspense(<SubscriptionsPage />) },
          { path: '/settings', element: withSuspense(<ProfileSettingsPage />) },
        ],
      },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}

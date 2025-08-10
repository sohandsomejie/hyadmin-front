import { createBrowserRouter, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import MemberListPage from './pages/members/List';
import MemberDetailPage from './pages/members/Detail';
import MemberEditPage from './pages/members/Edit';
import SessionListPage from './pages/sessions/List';
import SessionDetailPage from './pages/sessions/Detail';
import LeaderboardPage from './pages/reports/Leaderboard';
import ActivitiesOverviewPage from './pages/activities/Overview';
import ActivityTypeSessionsPage from './pages/activities/TypeSessions';
import { useAuthStore } from './store/auth';

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/activities" replace /> },
      { path: 'members', element: <MemberListPage /> },
      { path: 'members/new', element: <MemberEditPage /> },
      { path: 'members/:id', element: <MemberDetailPage /> },
      { path: 'members/:id/edit', element: <MemberEditPage /> },
      { path: 'sessions', element: <SessionListPage /> },
      { path: 'sessions/:id', element: <SessionDetailPage /> },
      { path: 'activities', element: <ActivitiesOverviewPage /> },
      { path: 'activities/:typeId', element: <ActivityTypeSessionsPage /> },
      { path: 'reports', element: <LeaderboardPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);



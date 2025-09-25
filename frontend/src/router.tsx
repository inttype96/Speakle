import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";

// Layout components (loaded immediately)
import RootLayout from "@/components/layout/RootLayout";
import ErrorBoundary from "@/components/common/ErrorBoundary";

// Loading component
import LoadingPage from "@/components/common/LoadingPage";

// Lazy loaded components for better performance
const IndexPage = lazy(() => import("@/pages/common/indexPage"));
const NotFoundPage = lazy(() => import("@/pages/common/notFoundPage"));

// Auth pages
const LoginPage = lazy(() => import("@/pages/auth/loginPage"));
const SignupPage = lazy(() => import("@/pages/auth/signupPage"));

// Learning pages
const QuizPage = lazy(() => import("@/pages/QuizPage"));
const SpeakingPage = lazy(() => import("@/pages/SpeakingPage"));
const DictationPage = lazy(() => import("@/pages/DictationPage"));

// Music/Content pages
const ExplorePage = lazy(() => import("@/pages/ExplorePage"));
const RecommendationsPage = lazy(() => import("@/pages/RecommendationsPage"));
const SongDetailPage = lazy(() => import("@/pages/SongDetailPage"));

// User pages
const MyPage = lazy(() => import("@/pages/user/myPage"));
const DashboardPage = lazy(() => import("@/pages/user/DashboardPage"));
const PlaylistsPage = lazy(() => import("@/pages/user/PlaylistsPage"));
const PlaylistDetailPage = lazy(() => import("@/pages/user/PlaylistDetailPage"));

// Spotify integration pages
const SpotifySetupPage = lazy(() => import("@/pages/spotify/spotify-setup"));
const SpotifyCallbackPage = lazy(() => import("@/pages/spotify/spotify-callback"));

// Wrapper component for lazy loading with error boundary
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingPage />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      // Home page
      {
        index: true,
        element: <LazyRoute><IndexPage /></LazyRoute>,
      },

      // Auth routes
      {
        path: "login",
        element: <LazyRoute><LoginPage /></LazyRoute>,
      },
      {
        path: "signup",
        element: <LazyRoute><SignupPage /></LazyRoute>,
      },

      // Learning routes - grouped under /learn
      {
        path: "learn",
        children: [
          {
            path: "quiz",
            element: <LazyRoute><QuizPage /></LazyRoute>,
          },
          {
            path: "speaking",
            element: <LazyRoute><SpeakingPage /></LazyRoute>,
          },
          {
            path: "dictation",
            element: <LazyRoute><DictationPage /></LazyRoute>,
          },
        ],
      },

      // Music/Content discovery routes
      {
        path: "explore",
        element: <LazyRoute><ExplorePage /></LazyRoute>,
      },
      {
        path: "recommendations",
        element: <LazyRoute><RecommendationsPage /></LazyRoute>,
      },
      {
        path: "search",
        element: <LazyRoute><RecommendationsPage /></LazyRoute>,
      },

      // Song detail
      {
        path: "songs/:songId",
        element: <LazyRoute><SongDetailPage /></LazyRoute>,
      },

      // User-related routes - grouped under user paths
      {
        path: "mypage",
        element: <LazyRoute><MyPage /></LazyRoute>,
      },
      {
        path: "dashboard",
        element: <LazyRoute><DashboardPage /></LazyRoute>,
      },

      // Playlist routes - grouped under /playlists
      {
        path: "playlists",
        children: [
          {
            index: true,
            element: <LazyRoute><PlaylistsPage /></LazyRoute>,
          },
          {
            path: ":playlistId",
            element: <LazyRoute><PlaylistDetailPage /></LazyRoute>,
          },
        ],
      },

      // Spotify integration routes - grouped under /spotify
      {
        path: "spotify",
        children: [
          {
            path: "callback",
            element: <LazyRoute><SpotifyCallbackPage /></LazyRoute>,
          },
        ],
      },
      {
        path: "spotify-setup",
        element: <LazyRoute><SpotifySetupPage /></LazyRoute>,
      },

      // 404 Not Found - should be last
      {
        path: "*",
        element: <LazyRoute><NotFoundPage /></LazyRoute>,
      },
    ],
  },
]);

export default router;
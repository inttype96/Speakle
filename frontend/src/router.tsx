import { createBrowserRouter } from "react-router-dom";

import IndexPage from "@/pages/common/indexPage";
import LoginPage from "@/pages/auth/loginPage";
import QuizPage from "@/pages/QuizPage";
import SpeakingPage from "@/pages/SpeakingPage";
import SignupPage from "@/pages/auth/signupPage";
import SpotifySetupPage from "@/pages/spotify/spotify-setup";
import SpotifyCallbackPage from "@/pages/spotify/spotify-callback";
import MyPage from "@/pages/user/myPage";
import NotFoundPage from "@/pages/common/notFoundPage";
import ExplorePage from "@/pages/ExplorePage"
import RecommendationsPage from "@/pages/RecommendationsPage";
// import InputPage from "@/pages/recommendation/inputPage/inputPage";
// import SongListPage from "@/pages/recommendation/songListPage/songListPage";
// import SongDetailPage from "@/pages/recommendation/songDetailPage/songDetailPage";
import SongDetailPage from "@/pages/SongDetailPage"
import DictationPage from "@/pages/DictationPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <IndexPage />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/learn/quiz",
        element: <QuizPage />,
    },
    {
        path: "/learn/speaking",
        element: <SpeakingPage />,
    },
    {
        path: "/learn/dictation",
        element: <DictationPage />,
    },
    {
        path: "/signup",
        element: <SignupPage />,
    },
    {
        path: "/spotify-setup",
        element: <SpotifySetupPage />,
    },
    {
        path: "/spotify/callback",
        element: <SpotifyCallbackPage />,
    },
    {
        path: "/mypage",
        element: <MyPage />,
    },
    {
        path: "/explore",
        element: <ExplorePage />,
    },
    {
        path: "/recommendations",
        element: <RecommendationsPage />,
    },
    {
        path: "/search",
        element: <RecommendationsPage />,
    },
    {
        path: "/songs/:songId",
        element: <SongDetailPage />,
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);

export default router;
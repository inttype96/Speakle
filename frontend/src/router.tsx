import { createBrowserRouter } from "react-router-dom";

import IndexPage from "@/pages/common/indexPage";
import LoginPage from "@/pages/auth/loginPage";
import QuizPage from "@/pages/QuizPage";
import SpeakingPage from "@/pages/SpeakingPage";
import SignupPage from "@/pages/auth/signupPage";
import SpotifySetupPage from "@/pages/spotify/spotify-setup";
import SpotifyCallbackPage from "@/pages/spotify/spotify-callback";
import MyPage from "@/pages/user/myPage";
import LearnedSongDetailPage from "@/pages/user/learnedSongDetailPage";
import NotFoundPage from "@/pages/common/notFoundPage";

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
        path: "/learned-songs/:learnedSongId",
        element: <LearnedSongDetailPage />,
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);

export default router;
import { createBrowserRouter } from "react-router-dom";

import IndexPage from "@/pages/common/indexPage";
import LoginPage from "@/pages/auth/loginPage";
import QuizPage from "@/pages/QuizPage";
import SpeakingPage from "@/pages/SpeakingPage";
import SignupPage from "@/pages/auth/signupPage";
import TestPage from "@/pages/test/testPage";
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
        path: "/test",
        element: <TestPage />,
    },
]);

export default router;
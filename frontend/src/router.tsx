import { createBrowserRouter } from "react-router-dom";

import IndexPage from "@/pages/common/indexPage";
import LoginPage from "@/pages/auth/loginPage";
import TestPage from "@/pages/test/testPage";
import InputPage from "@/pages/recommendation/inputPage/inputPage";
import SongListPage from "@/pages/recommendation/songListPage/songListPage";
import SongDetailPage from "@/pages/recommendation/songDetailPage/songDetailPage";

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
        path: "/test",
        element: <TestPage />,
    },
    {
        path: "/input",
        element: <InputPage />,
    },
    {
        path: "/songlist",
        element: <SongListPage />,
    },
    {
        path: "/songdetail",
        element: <SongDetailPage />,
    },
]);

export default router;
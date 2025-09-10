import { createBrowserRouter } from "react-router-dom";

import IndexPage from "@/pages/common/indexPage";
import LoginPage from "@/pages/auth/loginPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <IndexPage />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
]);

export default router;
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Username from "./components/Username";
import Reset from "./components/Reset";
import Register from "./components/Register";
import Recovery from "./components/Recovery";
import Profile from "./components/Profile";
import Password from "./components/Password";
import PageNotFound from "./components/PageNotFound";

const router = createBrowserRouter([
  { path: "/pagenotfound", element: <PageNotFound></PageNotFound> },
  { path: "/", element: <Username />},
  { path: "/reset", element: <Reset></Reset> },
  { path: "/register", element: <Register></Register> },
  { path: "/recovery", element: <Recovery></Recovery> },
  { path: "/profile", element: <Profile></Profile> },
  { path: "/password", element: <Password></Password> },
]);

const App = () => {
  return (
    <div>
      <RouterProvider router={router}></RouterProvider>
    </div>
  );
};

export default App;

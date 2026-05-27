import React, { useEffect } from "react";
import Navbar from "../navbar/Navbar";
import { Outlet, useLocation } from "react-router-dom";
import "./Main.css";

// Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
};

const Main = () => {
  return (
    <div>
      <ScrollToTop />
      <Navbar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Main;

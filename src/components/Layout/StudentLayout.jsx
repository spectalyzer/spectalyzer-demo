import React, { useEffect } from "react";
import Navbar from "../navbar/Navbar";
import Sidemenu from "../sidemenu/Sidemenu";
import { Outlet, useLocation } from "react-router-dom";
import "./StudentLayout.css";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
};

const StudentLayout = () => {
  return (
    <div className="student-layout">
      <ScrollToTop />
      <Navbar></Navbar>
      <div className="student-layout__body">
        <Sidemenu></Sidemenu>
        <div className="student-layout__content">
          <Outlet></Outlet>
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;

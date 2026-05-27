import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useRouteError,
  useLocation,
} from "react-router-dom";
import "./index.css";
import Home from "./components/Layout/Home.jsx";
import Main from "./components/Layout/Main.jsx";
import Student from "./pages/register/Student.jsx";
import Login from "./pages/login/Login.jsx";
import Profile from "./pages/profile/Profile.jsx";
import { Provider } from "react-redux";
import { store } from "./app/store.js";
import DataEntry from "./pages/data_entry/DataEntry.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import StudentLayout from "./components/Layout/StudentLayout.jsx";
import DailyData from "./pages/dailydata/DailyData.jsx";
import Students from "./pages/students/Students.jsx";
import Settings from "./pages/settings/Settings.jsx";
import { LoaderProvider } from "./components/loader/Loader.jsx";
import PrivacyPolicy from "./components/privacypolicy/PrivacyPolicy.jsx";
import TherapistDashboard from "./pages/therapist-dashboard/TherapistDashboard.jsx";
import TeacherDashboard from "./pages/teacher-dashboard/TeacherDashboard.jsx";
import DoctorDashboard from "./pages/doctor-dashboard/DoctorDashboard.jsx";
import AssignStudents from "./pages/admin-dashboard/AssignStudents.jsx";
import AdminDashboard from "./pages/admin-dashboard/AdminDashboard.jsx";

const AppRouteError = () => {
  const error = useRouteError();
  const message = error?.statusText || error?.message || "Something went wrong.";
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f8fafc" }}>
      <div style={{ maxWidth: 560, width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "1.25rem 1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.35rem", color: "#0f172a" }}>Page not available</h1>
        <p style={{ margin: "0.65rem 0 1rem", color: "#475569" }}>{message}</p>
        <a href="/studentoverview/dashboard" style={{ display: "inline-block", background: "#1d4ed8", color: "#fff", textDecoration: "none", padding: "0.55rem 0.85rem", borderRadius: 8, fontWeight: 600 }}>
          Go to Dashboard
        </a>
      </div>
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
};

const StudentRouteEntry = () => {
  const hasToken = Boolean(localStorage.getItem("token"));
  return hasToken ? <Navigate to="/studentoverview/profile" /> : <Student />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    errorElement: <AppRouteError />,
    children: [
      { path: "/",             element: <Home /> },
      { path: "/student",      element: <StudentRouteEntry /> },
      { path: "/login",        element: <Login /> },
      { path: "/privacypolicy",element: <PrivacyPolicy /> },
      { path: "*",             element: <Navigate to="/" replace /> },
    ],
  },
  {
    path: "/studentoverview",
    element: <StudentLayout />,
    errorElement: <AppRouteError />,
    children: [
      { path: "dashboard",           element: <Dashboard /> },
      { path: "profile",             element: <Profile /> },
      { path: "dailydata",           element: <DailyData /> },
      { path: "students",            element: <Students /> },
      { path: "settings",            element: <Settings /> },
      { path: "dataentry",           element: <DataEntry /> },
      { path: "therapist-dashboard", element: <TherapistDashboard /> },
      { path: "teacher-dashboard",   element: <TeacherDashboard /> },
      { path: "doctor-dashboard",    element: <DoctorDashboard /> },
      { path: "assign-students",     element: <AssignStudents /> },
      { path: "admin-dashboard",      element: <AdminDashboard /> },
      { path: "*",                   element: <Navigate to="dashboard" replace /> },
    ],
  },
]);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#fef2f2', color: '#991b1b', fontFamily: 'monospace' }}>
          <h2>React Error Boundary Caught an Error!</h2>
          <p><b>{this.state.error && this.state.error.toString()}</b></p>
          <pre style={{ background: '#fff', padding: '1rem', overflow: 'auto' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <LoaderProvider>
          <RouterProvider router={router} />
        </LoaderProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);

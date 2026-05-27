import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faHouse,
  faBook,
  faChartLine,
  faGear,
  faRightFromBracket,
  faDatabase,
  faKeyboard,
  faUserDoctor,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate } from "react-router-dom";
import { getToken, removeToken } from "../../services/LocalStorageService";
import { useGetLoggedUserQuery } from "../../services/userAuthApi";
import { decodeToken, getUserRole, hasAnyRole } from "../../services/tokenService";
import "./Sidemenu.css";

const Sidemenu = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = getToken();
  const userRole = getUserRole();
  const { data: user, isLoading, isError } = useGetLoggedUserQuery(token);
  const decodedUser = decodeToken(token);
  const fallbackName =
    decodedUser?.name ||
    decodedUser?.username ||
    decodedUser?.email ||
    "Student";
  const fallbackEmail = decodedUser?.email || "";
  const displayName = user?.user?.name || fallbackName;
  const displayEmail = user?.user?.email || fallbackEmail || "";
  const initials = String(displayName || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    removeToken("token");
    navigate("/");
  };

  const isCollapsed = !isMobileMenuOpen;

  return (
    <div className={`sidemenu ${isCollapsed ? "is-collapsed" : "is-open"}`}>
      <div className="sidemenu__toggle md:hidden">
        <button
          className="text-slate-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      <div className="flex-grow">
        <div className="sidemenu__title">
          {hasAnyRole(["admin", "superadmin"]) ? "Admin Menu" : "Student Menu"}
        </div>
        <nav className="sidemenu__nav">
          {/* Admin Dashboard - For Admins and SuperAdmins */}
          {hasAnyRole(["admin", "superadmin"]) && (
            <NavLink
              to="/studentoverview/admin-dashboard"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faChartLine} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Admin Dashboard
              </span>
            </NavLink>
          )}

          {/* Profile - For non-admins */}
          {!hasAnyRole(["admin", "superadmin"]) && (
            <NavLink
              to="/studentoverview/profile"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faHouse} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Home
              </span>
            </NavLink>
          )}

          {/* Dashboard - Full Analytics (Available to Everyone except admin who has Admin Dashboard) */}
          {!hasAnyRole(["admin", "superadmin"]) && (
            <NavLink
              to="/studentoverview/dashboard"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faChartLine} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Full Analytics Dashboard
              </span>
            </NavLink>
          )}

          {/* Therapist Dashboard - Only for Therapists */}
          {hasAnyRole(["therapist"]) && (
            <NavLink
              to="/studentoverview/therapist-dashboard"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faUserDoctor} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Therapist Dashboard
              </span>
            </NavLink>
          )}

          {hasAnyRole(["teacher"]) && (
            <NavLink
              to="/studentoverview/teacher-dashboard"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faUserDoctor} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Teacher Dashboard
              </span>
            </NavLink>
          )}

          {hasAnyRole(["doctor"]) && (
            <NavLink
              to="/studentoverview/doctor-dashboard"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faUserDoctor} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Doctor Dashboard
              </span>
            </NavLink>
          )}

          {/* Assign Students - admin/superadmin only */}
          {hasAnyRole(["admin", "superadmin"]) && (
            <NavLink
              to="/studentoverview/assign-students"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faUserGroup} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Assign Students
              </span>
            </NavLink>
          )}

          {/* Students list - therapists/teachers/doctors/admins only */}
          {hasAnyRole(["therapist", "doctor", "teacher", "admin", "superadmin"]) && (
            <NavLink
              to="/studentoverview/students"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faBook} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Students
              </span>
            </NavLink>
          )}

          {/* Data Entry - Only for Students */}
          {hasAnyRole(["student"]) && (
            <NavLink
              to="/studentoverview/dataentry"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faKeyboard} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Data Entry
              </span>
            </NavLink>
          )}

          {/* Daily Entries - Only for Students */}
          {hasAnyRole(["student"]) && (
            <NavLink
              to="/studentoverview/dailydata"
              className={({ isActive }) =>
                `sidemenu__link ${isActive ? "is-active" : ""}`
              }
            >
              <FontAwesomeIcon icon={faDatabase} size="xl" />
              <span
                className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
              >
                Daily Entries
              </span>
            </NavLink>
          )}

          <div className="sidemenu__divider"></div>

          <NavLink
            to="/studentoverview/settings"
            className={({ isActive }) =>
              `sidemenu__link ${isActive ? "is-active" : ""}`
            }
          >
            <FontAwesomeIcon icon={faGear} size="xl" />
            <span
              className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
            >
              Settings
            </span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="sidemenu__link sidemenu__logout"
          >
            <FontAwesomeIcon icon={faRightFromBracket} size="xl" />
            <span
              className={`sidemenu__label ${isCollapsed ? "is-hidden" : ""}`}
            >
              Log out
            </span>
          </button>
        </nav>
      </div>

      <div className="sidemenu__profile md:block hidden">
        <div className="sidemenu__profile-card">
          <div className="sidemenu__avatar">{initials}</div>
          <div>
            {isLoading ? (
              <p className="sidemenu__profile-meta">Loading...</p>
            ) : (
              <>
                <p className="sidemenu__profile-name">{displayName}</p>
                <p className="sidemenu__profile-meta">{displayEmail}</p>
                <p className="sidemenu__profile-meta">
                  Role: {userRole?.toUpperCase() || "N/A"}
                </p>
                {isError && (
                  <p className="sidemenu__profile-meta" style={{ color: "#d97706" }}>
                    Profile sync unavailable
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidemenu;

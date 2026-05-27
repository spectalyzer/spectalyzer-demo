import React, { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBell, faCheckDouble, faTrash } from "@fortawesome/free-solid-svg-icons";
import logo from "../../assets/images/spectalyzer-logo-25_no-bg.png";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { getToken } from "../../services/LocalStorageService";
import { getUserRole } from "../../services/tokenService";
import { useGetNotificationsQuery, useMarkNotificationsReadMutation, useDeleteNotificationMutation } from "../../services/userAuthApi";

const Navbar = () => {
  const token = getToken();
  const userRole = getUserRole();
  const [click, setClick] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Notifications
  const { data: notifData, refetch: refetchNotifs } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
    skip: !token
  });
  const [markRead] = useMarkNotificationsReadMutation();
  const [deleteNotif] = useDeleteNotificationMutation();
  
  const notifications = notifData?.data || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async () => {
    try {
      await markRead().unwrap();
      refetchNotifs();
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await deleteNotif(id).unwrap();
      refetchNotifs();
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleClick = () => setClick(!click);
  const closeMenu = () => setClick(false);

  const onMouseEnter = () => {
    if (window.innerWidth < 960) {
      setDropdown(false);
    } else {
      setDropdown(true);
    }
  };

  const onMouseLeave = () => {
    if (window.innerWidth < 960) {
      setDropdown(false);
    } else {
      setDropdown(false);
    }
  };

  return (
    <div className="header">
      <nav className="navbar">
        <a href="/" className="logo">
          <span className="logo-pill">
            <img src={logo} alt="Spectalyzer" />
          </span>
        </a>
        <div className="hamburger" onClick={handleClick}>
          {click ? (
            <FaTimes size={22} style={{ color: "#475569" }} />
          ) : (
            <FaBars size={22} style={{ color: "#475569" }} />
          )}
        </div>
        <ul className={click ? "nav-menu active" : "nav-menu"}>
          <li className="nav-item">
            <a className="nav-link" href="/" onClick={closeMenu}>
              Home
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/#about" onClick={closeMenu}>
              About Us
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/#how-works" onClick={closeMenu}>
              How It Works
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/#testimonials" onClick={closeMenu}>
              Testimonial
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/#contact-us" onClick={closeMenu}>
              Contact Us
            </a>
          </li>

          {!token && (
            <li className="nav-item">
              <Link className="nav-link" to="/student" onClick={closeMenu}>
                Register
              </Link>
            </li>
          )}

          <li className="nav-item">
            {token ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {userRole}
                </span>

                {/* Notification Bell */}
                <div className="nav-notif-wrapper">
                  <button 
                    className={`nav-notif-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <FontAwesomeIcon icon={faBell} />
                    {unreadCount > 0 && <span className="nav-notif-badge">{unreadCount}</span>}
                  </button>

                  {showNotifications && (
                    <div className="nav-notif-dropdown">
                      <div className="nav-notif-hdr">
                        <span>Notifications</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {unreadCount > 0 && (
                            <button onClick={handleMarkRead} className="nav-notif-read-all" title="Mark all as read">
                              <FontAwesomeIcon icon={faCheckDouble} />
                            </button>
                          )}
                          <button onClick={() => setShowNotifications(false)} className="nav-notif-close" title="Close">
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                      <div className="nav-notif-list">
                        {notifications.length > 0 ? (
                          notifications.map((n, i) => (
                            <div key={i} className={`nav-notif-item ${n.read ? 'read' : 'unread'}`}>
                              <div className="nav-notif-dot"></div>
                              <div className="nav-notif-content">
                                <p className="nav-notif-msg">{n.message}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span className="nav-notif-time">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <button 
                                    className="nav-notif-delete-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNotif(n._id);
                                    }}
                                    title="Delete notification"
                                  >
                                    <FontAwesomeIcon icon={faTrash} size="xs" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="nav-notif-empty">No notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/studentoverview/profile" onClick={closeMenu}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center',
                    width:36, height:36, borderRadius:'50%',
                    background:'linear-gradient(135deg,#6366f1,#4f46e5)',
                    color:'#fff', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }}>
                  <FontAwesomeIcon icon={faUser} size="sm" />
                </Link>
              </div>
            ) : (
              <Link className="nav-link" to="/login" onClick={closeMenu}>
                Login
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;

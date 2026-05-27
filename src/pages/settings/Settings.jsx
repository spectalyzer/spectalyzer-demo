import React, { useState, useEffect } from "react";
import { getToken } from "../../services/LocalStorageService";
import {
  useGetLoggedUserQuery,
  useChangePasswordMutation,
} from "../../services/userAuthApi";
import logo from "../../assets/images/favicon.jpg"; // Adjust path if needed
import "./Settings.css";

const Settings = () => {
  // Local state for user profile form
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
  });

  // Local state for password form
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get token from localStorage
  const token = getToken();

  // 1) Fetch user data with `useGetLoggedUserQuery`
  const {
    data: userDataResponse,
    isLoading: userLoading,
    isError: userError,
  } = useGetLoggedUserQuery(token);

  // 2) Password change mutation
  const [
    changePassword,
    { isLoading: isChanging, isError: changeError, isSuccess: changeSuccess },
  ] = useChangePasswordMutation();

  // 3) Handle success/error for password change
  useEffect(() => {
    if (changeSuccess) {
      // Show success modal
      setShowSuccessModal(true);
      // Reset password fields
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
    if (changeError) {
      setShowErrorModal(true);
    }
  }, [changeSuccess, changeError]);

  // 4) Fake "progress bar" effect while user data is loading
  useEffect(() => {
    let interval;
    if (userLoading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => (prev < 100 ? prev + 10 : 100));
      }, 200);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [userLoading]);

  // 5) Once we have user data, fill the form
  useEffect(() => {
    if (userDataResponse?.user) {
      setFormData({
        fullName: userDataResponse.user.name || "",
        phoneNumber: userDataResponse.user.phone_num || "",
        email: userDataResponse.user.email || "",
        address: userDataResponse.user.address || "",
      });
      setIsLoading(false);
    }
  }, [userDataResponse]);

  // 6) Handlers for the profile form
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 7) Handlers for password form
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    await changePassword({
      token,
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    });
  };

  // 8) If still loading user data, show a "loading" screen
  if (isLoading) {
    return (
      <div className="settings-loading">
        <div className="text-center">
          <img
            src={logo}
            alt="Loading Logo"
            className="mx-auto mb-4 w-48 h-auto"
          />
          <div className="relative w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 h-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // 9) If there's an error fetching user data
  if (userError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-gray-800">404</h1>
          <p className="text-6xl text-gray-600 mt-2">Not Found</p>
        </div>
      </div>
    );
  }

  // 10) Render the Settings page
  return (
    <div className="settings-page">
      <div className="settings-page__container">
        <div className="settings-page__header">
          <div className="settings-page__title">Account Settings</div>
          <div className="settings-page__subtitle">
            Manage your personal details and security settings
          </div>
        </div>

        <div className="settings-page__grid">
          <div className="settings-card">
            <div className="settings-card__title">Personal Information</div>
            <form>
              <div className="settings-field">
                <label className="settings-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="settings-input"
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="settings-input"
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="settings-input"
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="settings-textarea"
                  rows="2"
                ></textarea>
              </div>

              <div className="settings-actions">
                <button type="submit" className="settings-btn">
                  Update
                </button>
              </div>
            </form>
          </div>

          <div className="settings-card">
            <div className="settings-card__title">Change Password</div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="settings-field">
                <label className="settings-label">Current Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  className="settings-input"
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="settings-input"
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="settings-input"
                />
              </div>

              <div className="settings-actions">
                <button type="submit" className="settings-btn">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="settings-modal">
          <div className="settings-modal__content">
            <h3 className="settings-modal__title">Password Changed Successfully</h3>
            <button
              className="settings-modal__button"
              onClick={() => setShowSuccessModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="settings-modal">
          <div className="settings-modal__content">
            <h3 className="settings-modal__title">Current Password Invalid</h3>
            <button
              className="settings-modal__button error"
              onClick={() => setShowErrorModal(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

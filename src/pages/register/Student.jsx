import React, { useEffect, useState } from "react";
import "./Student.css";
import Contact from "../../components/contact/Contact";
import Footer from "../../components/footer/Footer";
import { useNavigate } from "react-router-dom";
import { useRegisterUserMutation, useGetSchoolsQuery } from "./../../services/userAuthApi";
import { storeToken } from "../../services/LocalStorageService";
import TermsModal from "../../components/modals/TermsModal";
import config from "../../config.json";

const CLASS_OPTIONS = ["Autisom -1", "Autisom -2", "Autisom -3", "ECDP -1"];

const ROLES = [
  { value: "student",   label: "Student",   icon: "🎓" },
  { value: "teacher",   label: "Teacher",   icon: "📚" },
  { value: "therapist", label: "Therapist", icon: "🩺" },
  { value: "doctor",    label: "Doctor",    icon: "👨‍⚕️" },
];

const Student = () => {
  const [formData, setFormData] = useState({
    name: "",
    father_name: "",
    mother_name: "",
    date_of_birth: "",
    school: "",
    class: "",
    teacher: "",
    therapist: "",
    doctor: "",
    gender: "",
    phone_num: "",
    address: "",
    email: "",
    password: "",
    password_confirmation: "",
    tc: false,
    role: "student",
  });

  const [error, setError] = useState({ status: false, msg: "", type: "" });
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const { data: schoolsRaw } = useGetSchoolsQuery();
  const schoolDirectory = schoolsRaw?.data || [];
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Scroll to top when registration page loads (fixes scroll-to-bottom glitch)
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    if (name === "school") {
      setFormData({ ...formData, school: nextValue, class: "", teacher: "", therapist: "", doctor: "" });
    } else {
      setFormData({ ...formData, [name]: nextValue });
    }
    if (error.status && error.type === "error") {
      setError({ status: false, msg: "", type: "" });
    }
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role,
      school: "",
      class: "",
      teacher: "",
      therapist: "",
      doctor: "",
      father_name: "",
      mother_name: "",
      date_of_birth: "",
    });
    setError({ status: false, msg: "", type: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name)               return setError({ status: true, msg: "Full name is required", type: "error" });
    if (!formData.email)              return setError({ status: true, msg: "Email is required", type: "error" });
    if (!formData.password)           return setError({ status: true, msg: "Password is required", type: "error" });
    if (!formData.password_confirmation) return setError({ status: true, msg: "Please confirm your password", type: "error" });
    if (!formData.gender)             return setError({ status: true, msg: "Gender is required", type: "error" });
    if (!formData.phone_num)          return setError({ status: true, msg: "Mobile number is required", type: "error" });
    if (!formData.address)            return setError({ status: true, msg: "Address is required", type: "error" });
    if (!formData.tc)                 return setError({ status: true, msg: "You must accept the Terms & Conditions", type: "error" });

    if (formData.role === "student") {
      if (!formData.father_name) return setError({ status: true, msg: "Father's name is required for students", type: "error" });
      if (!formData.mother_name) return setError({ status: true, msg: "Mother's name is required for students", type: "error" });
      if (!formData.date_of_birth) return setError({ status: true, msg: "Date of birth is required for students", type: "error" });
      if (!formData.school)      return setError({ status: true, msg: "School is required for students", type: "error" });
      if (!formData.class)       return setError({ status: true, msg: "Class is required for students", type: "error" });
      if (!formData.teacher)     return setError({ status: true, msg: "Teacher is required for students", type: "error" });
      if (!formData.therapist)   return setError({ status: true, msg: "Therapist is required for students", type: "error" });
      if (!formData.doctor)      return setError({ status: true, msg: "Doctor is required for students", type: "error" });

      const schoolEntry = schoolDirectory.find((s) => s.name === formData.school);
      if (!schoolEntry)                               return setError({ status: true, msg: "Selected school is not valid", type: "error" });
      if (!schoolEntry.teachers.includes(formData.teacher))   return setError({ status: true, msg: "Selected teacher does not belong to this school", type: "error" });
      if (!schoolEntry.therapists.includes(formData.therapist)) return setError({ status: true, msg: "Selected therapist does not belong to this school", type: "error" });
      if (!(schoolEntry.doctors || []).includes(formData.doctor)) return setError({ status: true, msg: "Selected doctor does not belong to this school", type: "error" });
    }

    if (["teacher", "therapist", "doctor"].includes(formData.role)) {
      if (!formData.school) return setError({ status: true, msg: `School is required for ${formData.role}s`, type: "error" });
    }

    if (formData.password !== formData.password_confirmation) {
      return setError({ status: true, msg: "Passwords do not match", type: "error" });
    }

    try {
      const res = await registerUser(formData).unwrap();

      // Backend always returns HTTP 200 — check res.status field
      if (res.status === "success" && res.token) {
        storeToken(res.token);
        setError({ status: true, msg: "Registration successful! You can now log in.", type: "success" });
        setTimeout(() => navigate("/login"), 1800);
      } else {
        // Backend returned a clear error message — show it directly
        setError({
          status: true,
          msg: res.message || "Registration failed. Please check your details and try again.",
          type: "error",
        });
      }
    } catch (err) {
      // Network error or server crash
      const msg = err?.data?.message || err?.message || "Could not connect to the server. Please try again.";
      setError({ status: true, msg, type: "error" });
    }
  };

  const closeModal = () => setError({ status: false, msg: "", type: "" });
  const openModal  = () => setIsModalOpen(true);
  const closeTermsModal = () => setIsModalOpen(false);

  const selectedSchool = schoolDirectory.find((s) => s.name === formData.school);
  const isStudent = formData.role === "student";
  const isStaff   = ["teacher", "therapist", "doctor"].includes(formData.role);

  return (
    <div className="student-reg">
      <div className="reg-page-container">

        {/* ── Page Header ── */}
        <div className="reg-page-header">
          <div className="reg-page-badge">✦ Join Spectalyzer</div>
          <h1 className="reg-page-title">Create Your Account</h1>
          <p className="reg-page-subtitle">
            Select your role and fill in your details to get started
          </p>
        </div>

        {/* ── Role Selector ── */}
        <div className="role-selector">
          {ROLES.map((r) => (
            <div
              key={r.value}
              className={`role-card ${formData.role === r.value ? "selected" : ""}`}
              onClick={() => handleRoleSelect(r.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleRoleSelect(r.value)}
            >
              <span className="role-card-icon">{r.icon}</span>
              <span className="role-card-label">{r.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Basic Info ── */}
          <div className="reg-card">
            <div className="reg-section-title">👤 Basic Information</div>

            <div className="reg-grid">
              <div className="reg-field">
                <label className="reg-label">Full Name <span className="star">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  className="reg-input" placeholder="e.g. Ahmad Hassan" required />
              </div>

              <div className="reg-field">
                <label className="reg-label">Gender <span className="star">*</span></label>
                <div className="reg-select-wrap">
                  <select name="gender" value={formData.gender} onChange={handleChange} className="reg-select" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="reg-field">
                <label className="reg-label">Mobile Number <span className="star">*</span></label>
                <input type="text" name="phone_num" value={formData.phone_num} onChange={handleChange}
                  className="reg-input" placeholder="+880 1234 567890" required />
              </div>

              <div className="reg-field">
                <label className="reg-label">Address <span className="star">*</span></label>
                <input type="text" name="address" value={formData.address} onChange={handleChange}
                  className="reg-input" placeholder="City, Country" required />
              </div>
            </div>
          </div>

          {/* ── Student-only fields ── */}
          {isStudent && (
            <div className="reg-card">
              <div className="reg-section-title">🎓 Student Details</div>

              <div className="role-info-banner">
                <span className="info-icon">ℹ️</span>
                <span>As a student, you need to provide parent information and select your school assignment.</span>
              </div>

              <div className="reg-grid">
                <div className="reg-field">
                  <label className="reg-label">Father's Name <span className="star">*</span></label>
                  <input type="text" name="father_name" value={formData.father_name} onChange={handleChange}
                    className="reg-input" placeholder="Father's full name" required />
                </div>

                <div className="reg-field">
                  <label className="reg-label">Mother's Name <span className="star">*</span></label>
                  <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange}
                    className="reg-input" placeholder="Mother's full name" required />
                </div>

                <div className="reg-field">
                  <label className="reg-label">Date of Birth <span className="star">*</span></label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                    className="reg-input" required />
                </div>

                <div className="reg-field">
                  <label className="reg-label">Class <span className="star">*</span></label>
                  <div className="reg-select-wrap">
                    <select name="class" value={formData.class} onChange={handleChange} className="reg-select" required>
                      <option value="">Select Class</option>
                      {CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="reg-field reg-grid-full">
                  <label className="reg-label">School <span className="star">*</span></label>
                  <div className="reg-select-wrap">
                    <select name="school" value={formData.school} onChange={handleChange} className="reg-select" required>
                      <option value="">Select School</option>
                      {schoolDirectory.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label">Teacher <span className="star">*</span></label>
                  <div className="reg-select-wrap">
                    <select name="teacher" value={formData.teacher} onChange={handleChange}
                      className="reg-select" disabled={!formData.school} required>
                      <option value="">Select Teacher</option>
                      {(selectedSchool?.teachers || []).length > 0 ? (
                        selectedSchool.teachers.map((t) => <option key={t} value={t}>{t}</option>)
                      ) : (
                        <option disabled>No teachers registered for this school yet</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label">Therapist <span className="star">*</span></label>
                  <div className="reg-select-wrap">
                    <select name="therapist" value={formData.therapist} onChange={handleChange}
                      className="reg-select" disabled={!formData.school} required>
                      <option value="">Select Therapist</option>
                      {(selectedSchool?.therapists || []).length > 0 ? (
                        selectedSchool.therapists.map((t) => <option key={t} value={t}>{t}</option>)
                      ) : (
                        <option disabled>No therapists registered for this school yet</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="reg-field">
                  <label className="reg-label">Doctor <span className="star">*</span></label>
                  <div className="reg-select-wrap">
                    <select name="doctor" value={formData.doctor} onChange={handleChange}
                      className="reg-select" disabled={!formData.school} required>
                      <option value="">Select Doctor</option>
                      {(selectedSchool?.doctors || []).length > 0 ? (
                        selectedSchool.doctors.map((d) => <option key={d} value={d}>{d}</option>)
                      ) : (
                        <option disabled>No doctors registered for this school yet</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Staff-only school selector ── */}
          {isStaff && (
            <div className="reg-card">
              <div className="reg-section-title">🏫 School Assignment</div>

              <div className="role-info-banner">
                <span className="info-icon">ℹ️</span>
                <span>As a {formData.role}, select the school you are affiliated with.</span>
              </div>

              <div className="reg-field">
                <label className="reg-label">School <span className="star">*</span></label>
                <div className="reg-select-wrap">
                  <select name="school" value={formData.school} onChange={handleChange} className="reg-select" required>
                    <option value="">Select School</option>
                    {schoolDirectory.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Account Security ── */}
          <div className="reg-card">
            <div className="reg-section-title">🔒 Account & Security</div>

            <div className="reg-grid">
              <div className="reg-field reg-grid-full">
                <label className="reg-label">Email Address <span className="star">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="reg-input" placeholder="you@example.com" required />
              </div>

              <div className="reg-field">
                <label className="reg-label">Password <span className="star">*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className="reg-input" placeholder="Min. 8 characters" required />
              </div>

              <div className="reg-field">
                <label className="reg-label">Confirm Password <span className="star">*</span></label>
                <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange}
                  className="reg-input" placeholder="Repeat password" required />
              </div>

              {/* Terms checkbox */}
              <div className="reg-field reg-grid-full">
                <label className="reg-checkbox-row">
                  <input type="checkbox" name="tc" checked={formData.tc}
                    onChange={(e) => { handleChange(e); if (!formData.tc) openModal(); }} />
                  <span className="custom-checkbox"></span>
                  <span className="reg-check-label">
                    I have read and agree to the&nbsp;
                    <span style={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
                      onClick={(e) => { e.preventDefault(); openModal(); }}>
                      Terms & Conditions
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Single inline alert — no modal, no duplicate ── */}
          {error.status && (
            <div className={`reg-alert reg-alert--${error.type}`} role="alert">
              <span className="reg-alert__icon">{error.type === "error" ? "⚠" : "✓"}</span>
              <span className="reg-alert__msg">{error.msg}</span>
              <button type="button" className="reg-alert__close" onClick={closeModal} aria-label="Dismiss">×</button>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="reg-submit-wrap">
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? "Creating Account…" : `Register as ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} →`}
            </button>
          </div>

        </form>
      </div>

      <TermsModal isOpen={isModalOpen} closeModal={closeTermsModal} />

      <Contact />
      <Footer />
    </div>
  );
};

export default Student;

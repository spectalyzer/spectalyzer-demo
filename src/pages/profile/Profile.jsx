import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCamera, faUpload, faTrashAlt, faTrash } from "@fortawesome/free-solid-svg-icons";
import { getToken } from "../../services/LocalStorageService";
import { 
  useGetLoggedUserQuery, 
  useUpdateProfileMutation,
  useUploadProfilePictureMutation,
  useUploadMedicalRecordMutation,
  useDeleteMedicalRecordMutation,
  useGetSchoolsQuery,
  useRequestVariableChangeMutation,
  useGetMyVariableRequestsQuery,
} from "../../services/userAuthApi";
import { ASSESSMENT_FACTOR_GROUPS } from "../../constants/assessmentFactors";
import config from "../../config.json";
import "./Profile.css";

// Flat list of all available variables (derived from groups)
const ALL_FACTORS = ASSESSMENT_FACTOR_GROUPS.flatMap(g => g.factors);

/* ─── helpers ─── */
const fieldLabel = (key) => ({
  name: "Full Name", father_name: "Father's Name", mother_name: "Mother's Name",
  date_of_birth: "Date of Birth", gender: "Gender", phone_num: "Phone Number",
  address: "Address", email: "Email", school: "School", class: "Class",
  teacher: "Consulting Teacher", therapist: "Consulting Therapist", doctor: "Consulting Doctor",
  profile_picture: "Profile Picture", medical_records: "Medical Records"
}[key] || key);

const CLASS_OPTIONS = ["Autisom -1", "Autisom -2", "Autisom -3", "ECDP -1"];

const STUDENT_FIELDS  = ["profile_picture", "name","father_name","mother_name","date_of_birth","gender","phone_num","address","email","school","class","teacher","therapist","doctor","medical_records"];
const STAFF_FIELDS    = ["profile_picture", "name","phone_num","address","email","school"];

const calcCompletion = (userData, isStaff) => {
  const fields = isStaff ? STAFF_FIELDS : STUDENT_FIELDS;
  const filledCount = fields.filter(f => {
    if (f === "medical_records") return userData[f] && userData[f].length > 0;
    return userData[f] && String(userData[f]).trim() !== "";
  }).length;
  return Math.round((filledCount / fields.length) * 100);
};

const getCompletionColor = (pct) => {
  if (pct >= 100) return "#10b981"; // green only at 100%
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
};



const Profile = () => {
  const token = getToken();
  const { data, isSuccess } = useGetLoggedUserQuery(token);
  const { data: schoolsData, isLoading: schoolsLoading, isError: schoolsError, refetch: refetchSchools } = useGetSchoolsQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [uploadProfilePicture, { isLoading: isUploadingPic }] = useUploadProfilePictureMutation();
  const [uploadMedicalRecord, { isLoading: isUploadingMed }] = useUploadMedicalRecordMutation();
  const [deleteMedicalRecord] = useDeleteMedicalRecordMutation();

  const [userData, setUserData] = useState({
    name: "", father_name: "", mother_name: "", date_of_birth: "",
    gender: "", phone_num: "", address: "", email: "",
    school: "", class: "", teacher: "", therapist: "", doctor: "",
    profile_picture: "", medical_records: [], trackedVariables: []
  });
  const [userRole, setUserRole] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saveMsg, setSaveMsg] = useState(null);

  // Variable request state
  const [showAddVarModal, setShowAddVarModal] = useState(false);
  const [selectedModalCategory, setSelectedModalCategory] = useState(null);
  const [varSearch, setVarSearch] = useState("");
  const [varDescription, setVarDescription] = useState("");
  const [varReqMsg, setVarReqMsg] = useState(null);
  const [requestVariableChange, { isLoading: isRequesting }] = useRequestVariableChangeMutation();
  const { data: myVarReqData, refetch: refetchMyReqs } = useGetMyVariableRequestsQuery();
  const myVarRequests = myVarReqData?.data || [];

  // Profile completion details are collapsed by default on Home page.
  const [showCompletionDetails, setShowCompletionDetails] = useState(false);

  // Profile details are collapsed by default and expand on click.
  const [showDetails, setShowDetails] = useState(false);

  // Medical records are collapsed by default and expand on click.
  const [showMedicalRecords, setShowMedicalRecords] = useState(false);

  // Default variables (matches DataEntry defaults when trackedVariables is empty)
  const DEFAULT_VARIABLES = [
    "wakeUpTime","wakingUp","firstGoOut","firstScreenOn","breakfast","schooling",
    "classActivity","outdoorActivity","therapyAtSchool","therapyType","lunch","eveningSnacks",
    "dinner","goToBedAt","sleepAt","goingToSleep","gettingSleepTime","outgoingTendency",
    "outgoingCount","screenTime","junkFood","makingNoise","walking","showingAnger",
    "glassCrashTendency","pushingTendency","itemThrowTendency","foodWaterThrowTendency",
    "hitWithHand","hitWithHead","cooperateAtSchool","cooperateAtHome","cuttingNails",
    "hairDressing","bedwetting","regularMedication","otherSickness","nameOfSickness",
    "medOtherSickness","listOfMedicine","masturbation","toilet","overnightSleeping",
    "specialActivity"
  ];

  const fileInputRef = useRef(null);
  const medInputRef = useRef(null);

  useEffect(() => {
    if (data && isSuccess) {
      const u = data.user;
      setUserData({
        name: u.name || "", father_name: u.father_name || "",
        mother_name: u.mother_name || "",
        date_of_birth: u.date_of_birth ? new Date(u.date_of_birth).toISOString().split('T')[0] : "",
        gender: u.gender || "", phone_num: u.phone_num || "",
        address: u.address || "", email: u.email || "",
        school: u.school || "", class: u.class || "",
        teacher: u.teacher || "", therapist: u.therapist || "",
        doctor: u.doctor || "",
        profile_picture: u.profile_picture || "",
        medical_records: u.medical_records || [],
        trackedVariables: u.trackedVariables || []
      });
      setUserRole(u.role || "");
    }
  }, [data, isSuccess]);

  const isStaff = ["teacher","therapist","doctor","admin"].includes(userRole);
  const completion = calcCompletion(userData, isStaff);
  const completionColor = getCompletionColor(completion);

  const initials = String(userData.name || "User")
    .split(" ").filter(Boolean).slice(0, 2)
    .map(p => p[0]).join("").toUpperCase();

  const openEdit = () => {
    const init = {};
    currentEditableFields.forEach(f => {
      init[f] = userData[f] || "";
    });
    setEditData(init);
    setSaveMsg(null);
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const payload = {};
      currentEditableFields.forEach(f => { if (editData[f] !== undefined) payload[f] = editData[f]; });
      const res = await updateProfile(payload).unwrap();
      if (res.status === "success") {
        setSaveMsg({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setEditMode(false), 1500);
      } else {
        setSaveMsg({ type: "error", text: res.message || "Update failed." });
      }
    } catch (err) {
      setSaveMsg({ type: "error", text: err?.data?.message || "Update failed." });
    }
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profile_picture", file);
    try {
      await uploadProfilePicture(formData).unwrap();
      setSaveMsg({ type: "success", text: "Profile picture updated!" });
    } catch (err) {
      setSaveMsg({ type: "error", text: "Failed to upload picture." });
    }
  };

  const handleMedUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("medical_records", files[i]);
    }
    // Reset the input so the same file can be re-selected/uploaded again
    if (medInputRef.current) medInputRef.current.value = "";
    try {
      await uploadMedicalRecord(formData).unwrap();
      setSaveMsg({ type: "success", text: "Medical records uploaded successfully!" });
    } catch (err) {
      setSaveMsg({ type: "error", text: "Failed to upload medical records." });
    }
  };

  const handleDeleteMed = async (e, recordId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recordId) {
      setSaveMsg({ type: "error", text: "Record ID missing. Cannot delete." });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this medical record?")) return;
    try {
      await deleteMedicalRecord(recordId).unwrap();
      // Immediately update local state so UI reflects deletion without waiting for refetch
      setUserData(prev => ({
        ...prev,
        medical_records: prev.medical_records.filter(
          r => String(r._id) !== String(recordId) && r.url !== recordId
        )
      }));
      setSaveMsg({ type: "success", text: "Medical record deleted successfully." });
    } catch (err) {
      console.error("Delete error:", err);
      setSaveMsg({ type: "error", text: err?.data?.message || "Failed to delete medical record." });
    }
  };

  const displayFields = isStaff 
    ? ["name", "email", "gender", "phone_num", "address", "school"] 
    : ["name", "email", "gender", "father_name", "mother_name", "date_of_birth", "phone_num", "address", "school", "class", "teacher", "therapist", "doctor"];

  const currentEditableFields = isStaff 
      ? ["name", "email", "gender", "phone_num", "address", "school"] 
      : ["name", "email", "gender", "father_name", "mother_name", "date_of_birth", "phone_num", "address", "school", "class", "teacher", "therapist", "doctor"];

  const schools = schoolsData?.data || [];
  const selectedSchool = schools.find(s => s.name === editData.school);

  return (
    <div className="student-home">
      <div className="student-home__container">

        {/* ── Header ── */}
        <div className="student-home__header">
          <div className="student-home__header-content">
            <div className="student-home__identity">
              <div className="student-home__avatar-wrapper" onClick={() => fileInputRef.current.click()}>
                {userData.profile_picture ? (
                  <img src={`${config.BACKEND_URL}${userData.profile_picture}`} alt="Profile" className="student-home__avatar-img" />
                ) : (
                  <div className="student-home__avatar">{initials}</div>
                )}
                <div className="avatar-edit-overlay">📷</div>
              </div>
              <input type="file" ref={fileInputRef} style={{display:'none'}} accept="image/*" onChange={handlePicUpload} />
              
              <div>
                <p className="student-home__subtitle" style={{textTransform:"capitalize"}}>
                  {userRole || "User"} Profile
                </p>
                <h1 className="student-home__title">Welcome, {userData.name || "User"}</h1>
                <p className="student-home__subtitle">{userData.email || "–"}</p>
              </div>
            </div>
            <div className="student-home__quick-stats">
              <div className="student-home__stat">
                <div className="student-home__stat-label">Phone</div>
                <div className="student-home__stat-value">{userData.phone_num || "–"}</div>
              </div>
              {!isStaff && (
                <div className="student-home__stat">
                  <div className="student-home__stat-label">Gender</div>
                  <div className="student-home__stat-value">{userData.gender || "–"}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isUploadingPic || isUploadingMed ? (
          <div className="prof-msg prof-msg-ok" style={{marginTop:"1rem"}}>Uploading file, please wait...</div>
        ) : null}

        {/* ── Profile Completion Bar ── */}
        <div
          className="prof-completion-card"
          role="button"
          tabIndex={0}
          onClick={() => setShowCompletionDetails(prev => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowCompletionDetails(prev => !prev);
            }
          }}
          aria-expanded={showCompletionDetails}
        >
          <div className="prof-completion-top">
            <div>
              <span className="prof-completion-label">Profile Completion</span>
              {showCompletionDetails && (
                <span className="prof-completion-sub">
                  {completion < 100
                    ? (isStaff ? "Complete your profile to improve accuracy." : "Upload medical records & photo to reach 100%.")
                    : "🎉 Your profile is 100% complete!"}
                </span>
              )}
            </div>
            <div className="prof-completion-pct" style={{color: completionColor}}>
              {completion}%
            </div>
          </div>
          <div className="prof-bar-bg">
            <div
              className="prof-bar-fill"
              style={{width:`${completion}%`, background: completionColor,
                transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}
            />
          </div>
          {showCompletionDetails && (
            <>
              <div className="prof-completion-steps">
                {(isStaff ? STAFF_FIELDS : STUDENT_FIELDS).map(f => {
                  const filled = f === "medical_records"
                    ? (userData[f] && userData[f].length > 0)
                    : (userData[f] && String(userData[f]).trim() !== "");
                  return (
                    <div key={f} className={`prof-step ${filled ? "prof-step-done" : "prof-step-empty"}`}>
                      <span>{filled ? "✅" : "⬜"}</span>
                      <span>{fieldLabel(f)}</span>
                    </div>
                  );
                })}
              </div>
              {completion < 100 && (
                <div style={{display:"flex", gap:"1rem", marginTop:"1rem", flexWrap:"wrap"}} onClick={(e) => e.stopPropagation()}>
                  <button className="prof-complete-btn" onClick={openEdit}>
                    ✏️ Edit Details
                  </button>
                  {!userData.profile_picture && (
                    <button className="prof-complete-btn btn-secondary" onClick={() => fileInputRef.current.click()}>
                      📷 Upload Photo
                    </button>
                  )}
                  {!isStaff && (!userData.medical_records || userData.medical_records.length === 0) && (
                    <button className="prof-complete-btn btn-secondary" onClick={() => medInputRef.current.click()}>
                      📄 Upload Medical Records
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Save feedback ── */}
        {saveMsg && !isUploadingPic && !isUploadingMed && (
          <div className={`prof-msg ${saveMsg.type === "success" ? "prof-msg-ok" : "prof-msg-err"}`}>
            {saveMsg.text}
          </div>
        )}

        {/* ── Edit Modal ── */}
        {editMode && (
          <div className="prof-modal-overlay" onClick={() => setEditMode(false)}>
            <div className="prof-modal" onClick={e => e.stopPropagation()}>
              <div className="prof-modal-hdr">
                <h2 className="prof-modal-title">✏️ Edit Profile</h2>
                <button className="prof-modal-close" onClick={() => setEditMode(false)}>✕</button>
              </div>
              <div className="prof-modal-body">
                {currentEditableFields.map(f => (
                  <div key={f} className="prof-modal-field">
                    <label className="prof-modal-label">{fieldLabel(f)}</label>
                    {f === "gender" ? (
                      <select
                        className="prof-modal-input"
                        value={editData[f] || ""}
                        onChange={e => setEditData(p => ({...p, [f]: e.target.value}))}
                      >
                        <option value="">Select…</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : f === "date_of_birth" ? (
                      <input
                        type="date"
                        className="prof-modal-input"
                        value={editData[f] || ""}
                        onChange={e => setEditData(p => ({...p, [f]: e.target.value}))}
                      />
                    ) : f === "school" ? (
                        <div>
                          <select
                            className="prof-modal-input"
                            value={editData[f] || ""}
                            onChange={e => setEditData(p => ({...p, [f]: e.target.value, teacher: "", therapist: "", doctor: ""}))}
                          >
                            <option value="">Select School…</option>
                            {schools.map(s => <option key={s._id || s.name} value={s.name}>{s.name}</option>)}
                          </select>
                          {(!schools || schools.length === 0) && (
                            <div style={{marginTop:8, fontSize:"0.9rem", color:"#c05621", display:"flex", gap:8, alignItems:"center"}}>
                              <span>No schools loaded.</span>
                              <button type="button" className="prof-cancel-btn" onClick={() => refetchSchools()} style={{padding:"0.25rem 0.5rem"}}>Reload</button>
                            </div>
                          )}
                          {schoolsError && (
                            <div style={{marginTop:8, fontSize:"0.9rem", color:"#dc2626"}}>Failed to load schools.</div>
                          )}
                        </div>
                    ) : f === "class" ? (
                        <select
                          className="prof-modal-input"
                          value={editData[f] || ""}
                          onChange={e => setEditData(p => ({...p, [f]: e.target.value}))}
                        >
                          <option value="">Select Class…</option>
                          {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    ) : (f === "teacher" || f === "therapist" || f === "doctor") ? (
                        <select
                          className="prof-modal-input"
                          value={editData[f] || ""}
                          onChange={e => setEditData(p => ({...p, [f]: e.target.value}))}
                          disabled={!editData.school}
                        >
                          <option value="">Select {fieldLabel(f)}…</option>
                          {(selectedSchool?.[f + "s"] || []).map(staff => <option key={staff} value={staff}>{staff}</option>)}
                        </select>
                    ) : (
                      <input
                        type="text"
                        className="prof-modal-input"
                        placeholder={`Enter ${fieldLabel(f)}…`}
                        value={editData[f] || ""}
                        onChange={e => setEditData(p => ({...p, [f]: e.target.value}))}
                      />
                    )}
                  </div>
                ))}
                {saveMsg && (
                  <div className={`prof-msg ${saveMsg.type === "success" ? "prof-msg-ok" : "prof-msg-err"}`}>
                    {saveMsg.text}
                  </div>
                )}
              </div>
              <div className="prof-modal-footer">
                <button className="prof-cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                <button className="prof-save-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving…" : "💾 Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="prof-grid-wrapper">
          {/* ── Profile Details ── */}
          <div
            className={`student-home__details ${showDetails ? "is-expanded" : "is-collapsed"}`}
            role="button"
            tabIndex={0}
            onClick={() => setShowDetails(v => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowDetails(v => !v);
              }
            }}
            aria-expanded={showDetails}
          >
            <div className="student-home__details-header">
              <h2 className="student-home__details-title">Profile Details</h2>
              <div className="student-home__details-actions">
                <span className="student-home__details-chip-indicator" aria-hidden="true">
                  {showDetails ? "▾" : "▸"}
                </span>
                {showDetails && (
                  <button className="prof-edit-btn" onClick={(e) => { e.stopPropagation(); openEdit(); }}>
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>
            {showDetails && (
              <div className="student-home__grid">
                {displayFields.map(f => (
                  <div key={f} className="student-home__field">
                    <div className="student-home__field-label">{fieldLabel(f)}</div>
                    <div className="student-home__field-value"
                      style={!userData[f] ? {color:"#94a3b8",fontStyle:"italic"} : {}}>
                      {userData[f] || "Not set"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Medical Records ── */}
          {!isStaff && (
            <div
              className={`student-home__details med-records-section ${showMedicalRecords ? "is-expanded" : "is-collapsed"}`}
              role="button"
              tabIndex={0}
              onClick={() => setShowMedicalRecords(v => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowMedicalRecords(v => !v);
                }
              }}
              aria-expanded={showMedicalRecords}
            >
              <div className="student-home__details-header">
                <h2 className="student-home__details-title">Medical Records</h2>
                <div className="student-home__details-actions">
                  <span className="student-home__details-chip-indicator" aria-hidden="true">
                    {showMedicalRecords ? "▾" : "▸"}
                  </span>
                  {showMedicalRecords && (
                    <button className="prof-edit-btn" onClick={(e) => { e.stopPropagation(); medInputRef.current.click(); }}>
                      + Upload New
                    </button>
                  )}
                </div>
                <input type="file" ref={medInputRef} style={{display:'none'}} multiple accept=".pdf,image/*" onChange={handleMedUpload} />
              </div>

              {showMedicalRecords && (userData.medical_records && userData.medical_records.length > 0 ? (
                <div className="med-records-list">
                  {userData.medical_records.map((rec, idx) => (
                    <div key={rec._id || idx} className="med-record-item-row">
                      <a href={`${config.BACKEND_URL}${rec.url}`} target="_blank" rel="noreferrer" className="med-record-item">
                        <div className="med-record-icon">📄</div>
                        <div className="med-record-info">
                          <div className="med-record-name">{rec.filename}</div>
                          <div className="med-record-date">{new Date(rec.uploadedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="med-record-view">View</div>
                      </a>
                      <button 
                        className="med-record-delete-btn" 
                        onClick={(e) => handleDeleteMed(e, rec._id || rec.url)}
                        title="Delete Record"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="med-records-empty">
                  <div className="med-records-empty-icon">📂</div>
                  <p>No medical records uploaded yet.</p>
                  <span className="med-records-empty-sub">Upload your assessments, prescriptions, or therapy notes here.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Add Variable Modal ── */}
        {showAddVarModal && !isStaff && (() => {
          const tvForModal = userData.trackedVariables || [];
          const pkForModal = myVarRequests
            .filter(r => r.status === "pending" || r.status === "partially_approved")
            .map(r => r.variableKey);

          const selectedGroup = ASSESSMENT_FACTOR_GROUPS.find(g => g.category === selectedModalCategory);
          const groupFactors = selectedGroup ? selectedGroup.factors : [];
          const allAvail = groupFactors.filter(f => !tvForModal.includes(f.key) && !pkForModal.includes(f.key));
          const filteredStandardVars = varSearch.trim()
            ? allAvail.filter(f => f.label.toLowerCase().includes(varSearch.toLowerCase()) || (f.desc||"").toLowerCase().includes(varSearch.toLowerCase()))
            : allAvail;

          const standardMatch = allAvail.find(f => f.label.toLowerCase() === varSearch.trim().toLowerCase());
          const isCustom = varSearch.trim() && !standardMatch;

          const handleFormSubmit = async (e) => {
            e.preventDefault();
            const keyToUse = standardMatch ? standardMatch.key : varSearch.trim();
            const labelToUse = standardMatch ? standardMatch.label : varSearch.trim();

            if (!selectedModalCategory) {
              setVarReqMsg({ type: "error", text: "Please select a category first." });
              return;
            }
            if (!keyToUse) {
              setVarReqMsg({ type: "error", text: "Please enter a variable name." });
              return;
            }

            try {
              await requestVariableChange({
                variableKey: keyToUse,
                variableLabel: labelToUse,
                variableCategory: selectedModalCategory,
                variableDescription: varDescription.trim(),
                action: "add"
              }).unwrap();
              setVarReqMsg({ type: "success", text: `Request to add "${labelToUse}" sent for approval.` });
              setShowAddVarModal(false);
              setSelectedModalCategory(null);
              setVarSearch("");
              setVarDescription("");
              refetchMyReqs();
            } catch (err) {
              setVarReqMsg({ type: "error", text: err?.data?.message || "Failed to send request." });
            }
          };

          return (
            <div className="prof-modal-overlay" onClick={() => { setShowAddVarModal(false); setSelectedModalCategory(null); }}>
              <div className="prof-modal var-modal" onClick={e => e.stopPropagation()}>
                <div className="prof-modal-hdr">
                  <h2 className="prof-modal-title">➕ Request Add Variable</h2>
                  <button className="prof-modal-close" onClick={() => { setShowAddVarModal(false); setSelectedModalCategory(null); }}>✕</button>
                </div>
                <form onSubmit={handleFormSubmit} className="prof-modal-body" style={{gap:"1.25rem"}}>
                  
                  {/* Category Dropdown at the top */}
                  <div className="prof-modal-field">
                    <label className="prof-modal-label">Select Variable Category / Class</label>
                    <select
                      className="prof-modal-input"
                      value={selectedModalCategory || ""}
                      onChange={e => {
                        setSelectedModalCategory(e.target.value || null);
                        setVarSearch("");
                      }}
                      required
                    >
                      <option value="">Select Category…</option>
                      {ASSESSMENT_FACTOR_GROUPS.map(g => (
                        <option key={g.category} value={g.category}>{g.category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Variable Name Input */}
                  <div className="prof-modal-field">
                    <label className="prof-modal-label">Variable Name</label>
                    <input
                      className="prof-modal-input"
                      placeholder={selectedModalCategory ? "Type variable name…" : "Please select category first…"}
                      value={varSearch}
                      onChange={e => setVarSearch(e.target.value)}
                      disabled={!selectedModalCategory}
                      required
                    />
                  </div>

                  {/* Note / Description (Optional) */}
                  <div className="prof-modal-field">
                    <label className="prof-modal-label">Note / Description (Optional)</label>
                    <textarea
                      className="prof-modal-input"
                      style={{height: "65px", resize: "none"}}
                      placeholder="Describe what this variable tracks or shows (optional)…"
                      value={varDescription}
                      onChange={e => setVarDescription(e.target.value)}
                      disabled={!selectedModalCategory}
                    />
                  </div>

                  {/* Custom Indicator */}
                  {isCustom && (
                    <div style={{background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "0.65rem 0.85rem", fontSize: "0.78rem", color: "#16a34a"}}>
                      ✨ <strong>Custom Variable Alert:</strong> You are requesting a custom variable outside the standard list. It will be reviewed by your therapist.
                    </div>
                  )}

                  <div className="prof-modal-footer" style={{padding: "0.5rem 0 0", borderTop: "1px solid #f1f5f9"}}>
                    <button type="button" className="prof-cancel-btn" onClick={() => { setShowAddVarModal(false); setSelectedModalCategory(null); }}>Cancel</button>
                    <button type="submit" className="prof-save-btn" disabled={isRequesting || !selectedModalCategory || !varSearch.trim()}>
                      {isRequesting ? "Submitting…" : "💾 Request Variable"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* ── Assessment Variables Panel (student only) ── */}
        {!isStaff && (() => {
          const trackedVariables = userData.trackedVariables?.length > 0
            ? userData.trackedVariables
            : DEFAULT_VARIABLES;

          const pendingRequests = myVarRequests.filter(r => r.status === "pending" || r.status === "partially_approved");

          const handleRequestDelete = async (factor) => {
            if (!factor || !factor.key) return;
            if (!window.confirm(`Request to remove "${factor.label || factor.key}" from your profile? Your therapist must approve.`)) return;
            try {
              const res = await requestVariableChange({
                variableKey: factor.key,
                variableLabel: factor.label || factor.key,
                action: "delete"
              }).unwrap();
              if (res.status === "success") {
                setVarReqMsg({ type: "success", text: `Removal request for "${factor.label || factor.key}" sent to your therapist.` });
                refetchMyReqs();
              }
            } catch (err) {
              setVarReqMsg({ type: "error", text: err?.data?.message || "Failed to send request." });
            }
          };

          // These variables always appear in DataEntry (alwaysShow:true) and must always show in profile
          const ALWAYS_TRACKED_KEYS = [];
          const DEFAULT_FALLBACK_GROUP = "🚿 Self-Care"; // catch-all — NO 'Custom/Additional' section ever

          // Auto-include conditional child variables if their parent variable is tracked
          const extraConditionalKeys = [];
          if (trackedVariables.includes("regularMedication")) extraConditionalKeys.push("medicationReason");
          if (trackedVariables.includes("therapyAtSchool")) extraConditionalKeys.push("therapyType");
          if (trackedVariables.includes("otherSickness")) {
            extraConditionalKeys.push("nameOfSickness");
            extraConditionalKeys.push("medOtherSickness");
          }

          // Merge always-tracked and conditional into the effective list (no duplicates)
          const effectiveVars = [...new Set([...trackedVariables, ...ALWAYS_TRACKED_KEYS, ...extraConditionalKeys])];

          // ── Group by category ──
          const groupedTracked = {};

          effectiveVars.forEach(key => {
            let foundGroup = null;
            let factorDef = null;

            for (const group of ASSESSMENT_FACTOR_GROUPS) {
              // Case-insensitive key match AND label match for robustness
              const f = group.factors.find(fact =>
                fact.key.toLowerCase() === key.toLowerCase() ||
                fact.label.toLowerCase() === key.toLowerCase().replace(/_/g, " ")
              );
              if (f) {
                foundGroup = group.category;
                factorDef = f;
                break;
              }
            }

            if (!foundGroup) {
              // Check stored category from variable requests
              const varReq = myVarRequests.find(r => r.variableKey === key);
              const stored = varReq?.variableCategory || "";
              const matchedGroup = ASSESSMENT_FACTOR_GROUPS.find(g => g.category === stored);
              // Use stored category if it matches a standard group, otherwise Self-Care as catch-all
              foundGroup = matchedGroup ? stored : DEFAULT_FALLBACK_GROUP;
            }

            if (!groupedTracked[foundGroup]) groupedTracked[foundGroup] = [];

            const isAlwaysTracked = ALWAYS_TRACKED_KEYS.includes(key);
            
            // Resolve custom note/description if not standard
            let finalDesc = factorDef ? factorDef.desc : "Custom tracked variable";
            if (!factorDef) {
              const approvedReq = myVarRequests.find(
                r => r.variableKey === key && r.action === "add" && r.status === "approved"
              );
              if (approvedReq && approvedReq.variableDescription) {
                finalDesc = approvedReq.variableDescription;
              }
            }

            groupedTracked[foundGroup].push({
              ...(factorDef || {
                key,
                label: key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                desc: finalDesc,
                type: "slider",
              }),
              _isAlwaysTracked: isAlwaysTracked,
            });
          });

          // Sort in ASSESSMENT_FACTOR_GROUPS order (6 standard groups only — no Additional Variables)
          const orderedGroupNames = ASSESSMENT_FACTOR_GROUPS.map(g => g.category);
          const sortedGroupEntries = Object.entries(groupedTracked).sort(([a], [b]) => {
            const ai = orderedGroupNames.indexOf(a);
            const bi = orderedGroupNames.indexOf(b);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          });

          return (
            <div className="assess-factors-card">
              <div className="assess-factors-header">
                <div>
                  <h2 className="assess-factors-title">📊 My Tracked Variables</h2>
                  <p className="assess-factors-subtitle">
                    These variables are recorded daily. Click <strong>Remove</strong> on any variable to send a removal request to your therapist.
                    {userData.trackedVariables?.length === 0 && (
                      <span style={{display:"block",marginTop:"0.3rem",color:"#f59e0b",fontWeight:700}}>⚠️ Showing default variable set — ask your therapist to configure yours.</span>
                    )}
                  </p>
                </div>
                <div style={{display:"flex",gap:"0.75rem",alignItems:"center",flexWrap:"wrap"}}>
                  <span className="assess-factors-badge">{effectiveVars.length} Active</span>
                  <button className="var-add-btn" onClick={() => { setShowAddVarModal(true); setVarSearch(""); setVarDescription(""); setVarReqMsg(null); }}>+ Add Variable</button>
                </div>
              </div>

              {varReqMsg && (
                <div className={`prof-msg ${varReqMsg.type === "success" ? "prof-msg-ok" : "prof-msg-err"}`} style={{marginBottom:"1rem"}}>
                  {varReqMsg.text}
                </div>
              )}

              {/* Pending requests section */}
              {pendingRequests.length > 0 && (
                <div className="var-pending-section" style={{marginBottom:"1.25rem"}}>
                  <div className="var-pending-title">⏳ Pending Approval</div>
                  <div className="var-pending-list">
                    {pendingRequests.map(r => (
                      <div key={r._id} className="var-pending-chip">
                        <span className={`var-pending-action ${r.action === "add" ? "add" : "del"}`}>
                          {r.action === "add" ? "+" : "−"}
                        </span>
                        <span>{r.variableLabel || r.variableKey}</span>
                        <span className="var-pending-status">awaiting therapist approval</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grouped tracked variable list — 6 standard categories only, no custom section */}
              {effectiveVars.length > 0 ? (
                <div className="assess-factors-grid" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  {sortedGroupEntries.map(([groupName, factors]) => {
                    const groupDef = ASSESSMENT_FACTOR_GROUPS.find(g => g.category === groupName) || {
                      category: groupName, color: "#10b981", bgColor: "#f0fdf4", borderColor: "#a7f3d0"
                    };
                    return (
                      <div key={groupName} className="assess-group-card" style={{ borderColor: groupDef.borderColor, background: "#fff", width: "100%" }}>
                        <div className="assess-group-header" style={{ marginBottom: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: groupDef.color }}></div>
                            <h3 className="assess-group-title" style={{ color: groupDef.color, margin: 0, fontSize: "1.1rem" }}>
                              {groupName}
                            </h3>
                          </div>
                          <span className="assess-group-count" style={{ background: groupDef.bgColor, color: groupDef.color }}>
                            {factors.length}
                          </span>
                        </div>
                        <div className="var-flat-list" style={{ marginBottom: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                          {factors.map(factor => {
                            const req = myVarRequests.find(r => r.variableKey === factor.key && r.action === "delete" && (r.status === "pending" || r.status === "partially_approved"));
                            const pendingDelete = !!req;
                            const isDefault = !userData.trackedVariables?.length;
                            const isAlwaysTracked = !!factor._isAlwaysTracked;

                            return (
                              <div key={factor.key} className={`var-chip ${pendingDelete ? "var-chip--pending" : ""}`} style={{ marginBottom: 0 }}>
                                <div className="var-chip-info">
                                  <span className="var-chip-label">{factor.label}</span>
                                  <div style={{display:"flex",gap:"0.4rem",alignItems:"center",flexWrap:"wrap",marginTop:"0.15rem"}}>
                                    {factor.type && (
                                      <span style={{
                                        fontSize:"0.65rem",fontWeight:700,padding:"0.1rem 0.45rem",borderRadius:"99px",letterSpacing:"0.04em",
                                        background: factor.type==="yesno" ? "#ecfdf5" : factor.type==="slider" ? "#eff6ff" : factor.type==="select" ? "#fff7ed" : "#f8fafc",
                                        color: factor.type==="yesno" ? "#059669" : factor.type==="slider" ? "#3b82f6" : factor.type==="select" ? "#ea580c" : "#64748b",
                                        border: `1px solid ${factor.type==="yesno" ? "#a7f3d0" : factor.type==="slider" ? "#bfdbfe" : factor.type==="select" ? "#fed7aa" : "#e2e8f0"}`,
                                      }}>
                                        {factor.type === "yesno" ? "Yes/No" : factor.type === "slider" ? "0–10" : factor.type === "select" ? "Options" : "Text"}
                                      </span>
                                    )}
                                    <span className="var-chip-desc">{factor.desc}</span>
                                  </div>
                                </div>
                                {isAlwaysTracked ? (
                                  <span style={{fontSize:"0.72rem",color:"#10b981",fontWeight:600,flexShrink:0,display:"flex",alignItems:"center",gap:"3px"}}>🔒 Always</span>
                                ) : pendingDelete ? (
                                  <span className="var-chip-badge">⏳ removal pending</span>
                                ) : isDefault ? (
                                  <span style={{fontSize:"0.72rem",color:"#94a3b8",fontStyle:"italic",flexShrink:0}}>default</span>
                                ) : (
                                  <button
                                    type="button"
                                    className="var-chip-del"
                                    title="Request removal"
                                    onClick={() => handleRequestDelete(factor)}
                                    style={{width: "auto", padding: "0 10px", gap: "4px", fontSize: "0.8rem", fontWeight: "600"}}
                                  >
                                    <FontAwesomeIcon icon={faTrash} /> Remove
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="var-empty">
                  <div className="var-empty-icon">📋</div>
                  <p>No variables tracked yet.</p>
                  <span>Click "+ Add Variable" to request variables to track.</span>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
};

export default Profile;

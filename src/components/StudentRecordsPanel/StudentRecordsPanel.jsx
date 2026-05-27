import React, { useState } from "react";
import { useGetUserEntriesQuery } from "../../services/getEntries";
import { useUpdateTrackedVariablesMutation } from "../../services/userAuthApi";
import { getToken } from "../../services/LocalStorageService";
import { ASSESSMENT_FACTOR_GROUPS } from "../../constants/assessmentFactors";
import "./StudentRecordsPanel.css";

/**
 * StudentRecordsPanel
 * A slide-in side panel that shows a specific student's daily DataEntry records.
 * Props:
 *   student  – { _id, name, class, school, teacher, therapist, doctor }
 *   onClose  – callback to close the panel
 *   role     – 'teacher' | 'therapist' | 'doctor'  (controls which fields are highlighted)
 */
const StudentRecordsPanel = ({ student, onClose, role }) => {
  const token = getToken();
  const [tab, setTab] = useState("records"); 
  const [trackedVars, setTrackedVars] = useState(student?.trackedVariables || []);
  const [customVar, setCustomVar] = useState("");
  const [updateTracked] = useUpdateTrackedVariablesMutation();
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with prop when student changes
  React.useEffect(() => {
    if (student?.trackedVariables) {
      setTrackedVars(student.trackedVariables);
    }
  }, [student?._id]);

  const handleSaveSettings = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateTracked({ id: student._id, trackedVariables: trackedVars }).unwrap();
      alert("Configuration saved successfully!");
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings: " + (err?.data?.message || "Server error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = () => {
    const allPredefined = ASSESSMENT_FACTOR_GROUPS.flatMap(g => g.factors.map(f => f.key));
    const currentCustom = trackedVars.filter(v => !allPredefined.includes(v));
    setTrackedVars([...allPredefined, ...currentCustom]);
  };

  const handleDeselectAll = () => {
    setTrackedVars([]);
  };

  const handleAddCustom = () => {
    if (!customVar.trim()) return;
    if (trackedVars.includes(customVar.trim())) {
      setCustomVar("");
      return;
    }
    setTrackedVars(prev => [...prev, customVar.trim()]);
    setCustomVar("");
  };

  const toggleVar = (key) => {
    setTrackedVars(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const { data, isLoading, isError } = useGetUserEntriesQuery(
    { token, userId: student?._id },
    { skip: !student?._id }
  );

  const entries = (data?.data || [])
    .slice()
    .sort((a, b) => new Date(b.dateOfRecord || b.createdAt) - new Date(a.dateOfRecord || a.createdAt));

  const latest = entries[0] || null;

  // Fields by role
  const roleFields = {
    teacher: [
      { key: "classActivity",    label: "Class Activity",    icon: "📚", max: 10 },
      { key: "cooperateAtSchool",label: "Cooperation",       icon: "🤝", max: 10 },
      { key: "outdoorActivity",  label: "Outdoor Activity",  icon: "🌳", max: 10 },
      { key: "schooling",        label: "Schooling",         icon: "🏫", text: true },
      { key: "showingAnger",     label: "Anger Level",       icon: "😠", max: 10, alert: 7 },
      { key: "makingNoise",      label: "Making Noise",      icon: "📢", max: 10 },
      { key: "therapyAtSchool",  label: "Therapy at School", icon: "💊", text: true },
    ],
    therapist: [
      { key: "therapyType",      label: "Therapy Type",      icon: "🧪", text: true },
      { key: "therapyAtSchool",  label: "Therapy Done",      icon: "✅", text: true },
      { key: "cooperateAtSchool",label: "School Cooperation",icon: "🤝", max: 10 },
      { key: "cooperateAtHome",  label: "Home Cooperation",  icon: "🏠", max: 10 },
      { key: "outgoingTendency", label: "Social Tendency",   icon: "👥", max: 10 },
      { key: "showingAnger",     label: "Anger Level",       icon: "😠", max: 10, alert: 7 },
      { key: "specialActivity",  label: "Special Activity",  icon: "⭐", text: true },
    ],
    doctor: [
      { key: "showingAnger",          label: "Anger",           icon: "😠", max: 10, alert: 7 },
      { key: "hitWithHand",           label: "Hit (Hand)",      icon: "✊", max: 10, alert: 7 },
      { key: "hitWithHead",           label: "Hit (Head)",      icon: "🧠", max: 10, alert: 7 },
      { key: "regularMedication",     label: "Medication",      icon: "💊", text: true },
      { key: "otherSickness",         label: "Other Sickness",  icon: "🤒", text: true },
      { key: "nameOfSickness",        label: "Sickness Name",   icon: "🏥", text: true },
      { key: "listOfMedicine",        label: "Medicines",       icon: "💉", text: true },
      { key: "bedwetting",            label: "Bedwetting",      icon: "🛏️", max: 5 },
      { key: "toilet",                label: "Toilet Issues",   icon: "🚽", max: 5 },
    ],
  };
  
  roleFields.admin = [
      ...roleFields.teacher,
      ...roleFields.therapist.filter(t => !roleFields.teacher.find(f => f.key === t.key)),
      ...roleFields.doctor.filter(d => !roleFields.teacher.find(f => f.key === d.key) && !roleFields.therapist.find(f => f.key === d.key))
  ];

  const fields = roleFields.admin; // Unrestricted access for all roles as requested

  // Summary stats (last 30 entries)
  const recent = entries.slice(0, 30);
  const avg = (key) => {
    const vals = recent.map((e) => Number(e[key] || 0)).filter((v) => !isNaN(v));
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
  };

  const criticalDays = recent.filter(
    (e) => Number(e.showingAnger || 0) >= 7 || Number(e.hitWithHand || 0) >= 7 || Number(e.hitWithHead || 0) >= 7
  ).length;

  const therapySessions = recent.filter((e) => e.therapyAtSchool === "Yes" || e.therapyAtSchool === "yes").length;

  const getScoreColor = (val, max, alertVal) => {
    if (!alertVal) return "#6366f1";
    const pct = val / max;
    if (val >= alertVal) return "#ef4444";
    if (pct >= 0.5) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="srp-overlay" onClick={onClose}>
      <div className="srp-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="srp-header">
          <div className="srp-student-info">
            <div className="srp-avatar">{(student?.name || "S")[0].toUpperCase()}</div>
            <div>
              <h2 className="srp-name">{student?.name}</h2>
              <p className="srp-meta">
                {student?.class || "—"} · {student?.school || "—"}
              </p>
              <p className="srp-meta">
                Teacher: {student?.teacher || "—"} &nbsp;|&nbsp;
                Therapist: {student?.therapist || "—"} &nbsp;|&nbsp;
                Doctor: {student?.doctor || "—"}
              </p>
            </div>
          </div>
          <button className="srp-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="srp-tabs">
          <button className={`srp-tab ${tab === "records" ? "srp-tab-active" : ""}`} onClick={() => setTab("records")}>
            📋 Daily Records ({entries.length})
          </button>
          <button className={`srp-tab ${tab === "summary" ? "srp-tab-active" : ""}`} onClick={() => setTab("summary")}>
            📊 Summary
          </button>
          {(role === "teacher" || role === "therapist" || role === "admin" || role === "superadmin") && (
            <button className={`srp-tab ${tab === "settings" ? "srp-tab-active" : ""}`} onClick={() => setTab("settings")}>
              ⚙️ Settings
            </button>
          )}
        </div>

        <div className="srp-body">
          {isLoading && <div className="srp-loading">⏳ Loading records…</div>}
          {isError  && <div className="srp-error">❌ Failed to load. Check permissions.</div>}

          {!isLoading && !isError && entries.length === 0 && (
            <div className="srp-empty">
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
              <p>No daily records submitted yet.</p>
            </div>
          )}

          {!isLoading && !isError && entries.length > 0 && tab === "summary" && (
            <div className="srp-summary">
              <div className="srp-summary-grid">
                <div className="srp-summary-card srp-sum-blue">
                  <div className="srp-sum-icon">📋</div>
                  <div className="srp-sum-val">{entries.length}</div>
                  <div className="srp-sum-label">Total Records</div>
                </div>
                <div className="srp-summary-card srp-sum-red">
                  <div className="srp-sum-icon">🚨</div>
                  <div className="srp-sum-val">{criticalDays}</div>
                  <div className="srp-sum-label">Critical Days</div>
                </div>
                <div className="srp-summary-card srp-sum-green">
                  <div className="srp-sum-icon">🧪</div>
                  <div className="srp-sum-val">{therapySessions}</div>
                  <div className="srp-sum-label">Therapy Sessions</div>
                </div>
                <div className="srp-summary-card srp-sum-purple">
                  <div className="srp-sum-icon">📅</div>
                  <div className="srp-sum-val">{recent.length}</div>
                  <div className="srp-sum-label">Last 30 Days</div>
                </div>
              </div>

              <h3 className="srp-sum-section">Average Scores (last 30 records)</h3>
              <div className="srp-avg-list">
                {fields.filter((f) => !f.text && f.max).map((f) => {
                  const val = parseFloat(avg(f.key));
                  const pct = isNaN(val) ? 0 : (val / f.max) * 100;
                  const color = getScoreColor(val, f.max, f.alert);
                  return (
                    <div key={f.key} className="srp-avg-item">
                      <span className="srp-avg-icon">{f.icon}</span>
                      <span className="srp-avg-label">{f.label}</span>
                      <div className="srp-avg-bar-bg">
                        <div className="srp-avg-bar" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                      </div>
                      <span className="srp-avg-val" style={{ color }}>{isNaN(val) ? "—" : val.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>

              {latest && (
                <>
                  <h3 className="srp-sum-section">Latest Entry — {latest.dateOfRecord?.split("T")[0] || "—"}</h3>
                  <div className="srp-latest-grid">
                    {fields.map((f) => {
                      const raw = latest[f.key];
                      const display = raw !== undefined && raw !== null && raw !== "" ? String(raw) : "—";
                      const isAlert = !f.text && f.alert && Number(raw) >= f.alert;
                      return (
                        <div key={f.key} className={`srp-latest-item ${isAlert ? "srp-alert-item" : ""}`}>
                          <span className="srp-latest-icon">{f.icon}</span>
                          <span className="srp-latest-label">{f.label}</span>
                          <span className={`srp-latest-val ${isAlert ? "srp-alert-val" : ""}`}>{display}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {!isLoading && !isError && entries.length > 0 && tab === "records" && (
            <div className="srp-records">
              {entries.map((entry, idx) => {
                const dateStr = entry.dateOfRecord
                  ? entry.dateOfRecord.split("T")[0]
                  : new Date(entry.createdAt).toISOString().split("T")[0];
                const isCritical =
                  Number(entry.showingAnger || 0) >= 7 ||
                  Number(entry.hitWithHand || 0) >= 7 ||
                  Number(entry.hitWithHead || 0) >= 7;

                return (
                  <div key={entry._id || idx} className={`srp-record-card ${isCritical ? "srp-record-critical" : ""}`}>
                    <div className="srp-record-header">
                      <span className="srp-record-date">{dateStr}</span>
                      {isCritical && <span className="srp-critical-badge">⚠️ Critical</span>}
                      {entry.therapyType && (
                        <span className="srp-therapy-badge">{entry.therapyType}</span>
                      )}
                    </div>
                    <div className="srp-record-fields">
                      {fields.map((f) => {
                        const raw = entry[f.key];
                        if (raw === undefined || raw === null || raw === "") return null;
                        const display = String(raw);
                        const isAlert = !f.text && f.alert && Number(raw) >= f.alert;
                        return (
                          <div key={f.key} className={`srp-record-field ${isAlert ? "srp-field-alert" : ""}`}>
                            <span className="srp-field-icon">{f.icon}</span>
                            <span className="srp-field-label">{f.label}:</span>
                            <span className={`srp-field-val ${isAlert ? "srp-field-val-alert" : ""}`}>{display}</span>
                            {!f.text && f.max && (
                              <div className="srp-mini-bar-bg">
                                <div
                                  className="srp-mini-bar"
                                  style={{
                                    width: `${Math.min((Number(raw) / f.max) * 100, 100)}%`,
                                    background: getScoreColor(Number(raw), f.max, f.alert),
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {entry.specialActivity && (
                      <div className="srp-special">⭐ {entry.specialActivity}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "settings" && (
            <div className="srp-settings">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Configure Tracked Variables</h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="srp-action-btn" onClick={handleSelectAll}>Check All</button>
                  <button className="srp-action-btn srp-btn-outline" onClick={handleDeselectAll}>Uncheck All</button>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", marginBottom: "1.5rem", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.025em" }}>Add Tracking Factor</div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <select 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !trackedVars.includes(val)) {
                          setTrackedVars([...trackedVars, val]);
                        }
                        e.target.value = "";
                      }}
                      style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1.5px solid #e2e8f0", outline: "none", fontSize: "0.9rem", appearance: "none", background: "#fff" }}
                    >
                      <option value="">Select from standard factors...</option>
                      {ASSESSMENT_FACTOR_GROUPS.flatMap(g => g.factors).map(f => (
                        <option key={f.key} value={f.key} disabled={trackedVars.includes(f.key)}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b" }}>▼</div>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>OR</div>
                  <input 
                    type="text" 
                    placeholder="Type a custom name..." 
                    value={customVar}
                    onChange={(e) => setCustomVar(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                    style={{ flex: 1, padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1.5px solid #e2e8f0", outline: "none", fontSize: "0.9rem" }}
                  />
                  <button 
                    onClick={handleAddCustom}
                    style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                  >Add</button>
                </div>
              </div>

              <div className="srp-settings-grid" style={{ background: "#fff", padding: "1.25rem", border: "1px solid #e2e8f0", borderRadius: "12px", minHeight: "200px" }}>
                {trackedVars.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: "3rem 0" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📋</div>
                    <p>No variables assigned yet. Use the fields above to add some.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                    {trackedVars.map(key => {
                      const predefined = ASSESSMENT_FACTOR_GROUPS.flatMap(g => g.factors).find(f => f.key === key);
                      const label = predefined ? predefined.label : key;

                      return (
                        <div key={key} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "space-between", 
                          gap: "0.5rem", 
                          padding: "0.75rem 1rem", 
                          borderRadius: "10px", 
                          background: "#f8fafc", 
                          border: "1.5px solid #f1f5f9",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                        }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", flex: 1 }}>
                            <input 
                              type="checkbox" 
                              checked={true}
                              readOnly
                              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#4f46e5" }}
                            />
                            <span style={{ fontSize: "0.875rem", color: "#1e293b", fontWeight: 600 }}>{label}</span>
                          </label>
                          <button 
                            onClick={() => setTrackedVars(prev => prev.filter(k => k !== key))} 
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "4px", opacity: 0.6, transition: "opacity 0.2s" }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                            onMouseOut={(e) => e.currentTarget.style.opacity = 0.6}
                            title="Delete this variable"
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                <button 
                  onClick={handleSaveSettings}
                  style={{ background: "#4f46e5", color: "#fff", padding: "0.65rem 1.25rem", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)" }}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRecordsPanel;

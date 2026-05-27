import React, { useState, useEffect } from "react";
import {
  useGetAllStudentsListQuery,
  useGetAllStaffQuery,
  useAssignStudentMutation,
} from "../../services/userAuthApi";
import "./AssignStudents.css";

const AssignStudents = () => {
  const { data: studentsData, isLoading: studentsLoading, refetch: refetchStudents } = useGetAllStudentsListQuery();
  const { data: staffData, isLoading: staffLoading } = useGetAllStaffQuery();

  const students = studentsData?.data?.students || [];
  const allStaff = staffData?.data?.staff || [];

  const teachers   = allStaff.filter((s) => s.role === "teacher");
  const therapists = allStaff.filter((s) => s.role === "therapist");
  const doctors    = allStaff.filter((s) => s.role === "doctor");

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const [assignStudent, { isLoading: assigning }] = useAssignStudentMutation();

  // When a student is selected, prefill current assignments
  useEffect(() => {
    if (selectedStudent) {
      const s = students.find((st) => st._id === selectedStudent);
      if (s) {
        setSelectedTeacher(s.assignedTeacher ? String(s.assignedTeacher) : "");
        setSelectedTherapist(s.assignedTherapist ? String(s.assignedTherapist) : "");
        setSelectedDoctor(s.assignedDoctor ? String(s.assignedDoctor) : "");
      }
    }
  }, [selectedStudent, students]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAssign = async () => {
    if (!selectedStudent) return showToast("Please select a student first.", "error");

    const body = { studentId: selectedStudent };
    if (selectedTeacher !== undefined) body.teacherId = selectedTeacher || null;
    if (selectedTherapist !== undefined) body.therapistId = selectedTherapist || null;
    if (selectedDoctor !== undefined) body.doctorId = selectedDoctor || null;

    try {
      const res = await assignStudent(body).unwrap();
      if (res.status === "success") {
        showToast("Student assigned successfully! ✅");
        refetchStudents();
        setSelectedStudent("");
        setSelectedTeacher("");
        setSelectedTherapist("");
        setSelectedDoctor("");
      } else {
        showToast(res.message || "Assignment failed.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStaffName = (role, nameStr) => {
    if (!nameStr) return <span className="as-unassigned">Unassigned</span>;
    return <span className="as-assigned-name">{nameStr}</span>;
  };

  const isLoading = studentsLoading || staffLoading;

  return (
    <div className="assign-students">
      {/* Toast */}
      {toast && (
        <div className={`as-toast ${toast.type === "error" ? "as-toast-error" : "as-toast-success"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="as-header">
        <div className="as-header-left">
          <div className="as-role-badge">🔗 Admin</div>
          <h1 className="as-title">Assign Students to Staff</h1>
          <p className="as-subtitle">
            Select a student and assign them to a Teacher, Therapist, and/or Doctor.
          </p>
        </div>
      </div>

      {/* Assignment Form */}
      <div className="as-form-card">
        <h2 className="as-form-title">📋 New Assignment</h2>
        {isLoading ? (
          <div className="as-loading">Loading data from database…</div>
        ) : (
          <div className="as-form-grid">
            {/* Student Selector */}
            <div className="as-field as-field-full">
              <label className="as-label">👨‍🎓 Select Student *</label>
              <select
                className="as-select as-select-highlight"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">— Choose registered student —</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.email}) — {s.school || "No School"} / {s.class || "No Class"}
                  </option>
                ))}
              </select>
              {students.length === 0 && (
                <p className="as-field-hint">No registered students found in your school.</p>
              )}
            </div>

            {/* Teacher */}
            <div className="as-field">
              <label className="as-label">👨‍🏫 Assign Teacher</label>
              <select className="as-select as-select-teacher" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                <option value="">— No change / Remove —</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.school || "—"})</option>
                ))}
              </select>
              {teachers.length === 0 && <p className="as-field-hint">No teachers registered yet.</p>}
            </div>

            {/* Therapist */}
            <div className="as-field">
              <label className="as-label">🧑‍⚕️ Assign Therapist</label>
              <select className="as-select as-select-therapist" value={selectedTherapist} onChange={(e) => setSelectedTherapist(e.target.value)}>
                <option value="">— No change / Remove —</option>
                {therapists.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.school || "—"})</option>
                ))}
              </select>
              {therapists.length === 0 && <p className="as-field-hint">No therapists registered yet.</p>}
            </div>

            {/* Doctor */}
            <div className="as-field">
              <label className="as-label">🩺 Assign Doctor</label>
              <select className="as-select as-select-doctor" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                <option value="">— No change / Remove —</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} ({d.school || "—"})</option>
                ))}
              </select>
              {doctors.length === 0 && <p className="as-field-hint">No doctors registered yet.</p>}
            </div>

            {/* Submit */}
            <div className="as-field as-field-full as-submit-row">
              <button
                className="as-submit-btn"
                onClick={handleAssign}
                disabled={assigning || !selectedStudent}
              >
                {assigning ? "⏳ Saving…" : "✅ Save Assignment"}
              </button>
              <button
                className="as-cancel-btn"
                onClick={() => {
                  setSelectedStudent("");
                  setSelectedTeacher("");
                  setSelectedTherapist("");
                  setSelectedDoctor("");
                }}
              >
                ✖ Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current Assignments Table */}
      <div className="as-table-card">
        <div className="as-table-header">
          <h2 className="as-form-title">📊 Current Assignments</h2>
          <input
            type="text"
            placeholder="Search student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="as-search"
          />
        </div>

        {studentsLoading ? (
          <div className="as-loading">Loading assignments…</div>
        ) : filteredStudents.length === 0 ? (
          <div className="as-empty">
            <div>👨‍🎓</div>
            <p>No students found.</p>
          </div>
        ) : (
          <div className="as-table-wrapper">
            <table className="as-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>School / Class</th>
                  <th>Teacher</th>
                  <th>Therapist</th>
                  <th>Doctor</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr key={s._id || i}>
                    <td className="as-num">{i + 1}</td>
                    <td>
                      <div className="as-student-cell">
                        <div className="as-avatar">{(s.name || "S")[0].toUpperCase()}</div>
                        <div>
                          <div className="as-student-name">{s.name}</div>
                          <div className="as-student-email">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="as-school">{s.school || "—"}</div>
                      <div className="as-class">{s.class || "—"}</div>
                    </td>
                    <td>{getStaffName("teacher", s.teacher)}</td>
                    <td>{getStaffName("therapist", s.therapist)}</td>
                    <td>{getStaffName("doctor", s.doctor)}</td>
                    <td>
                      <button
                        className="as-edit-btn"
                        onClick={() => {
                          setSelectedStudent(s._id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignStudents;

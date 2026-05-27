import React, { useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getToken } from "../../services/LocalStorageService";
import { decodeToken } from "../../services/tokenService";
import { useGetAdminDashboardQuery, useGetLoggedUserQuery, useGetAllStudentsListQuery, useGetAllStaffQuery, useGetPendingVariableRequestsQuery, useReviewVariableRequestMutation } from "../../services/userAuthApi";
import AssignStudents from "./AssignStudents";
import StudentRecordsPanel from "../../components/StudentRecordsPanel/StudentRecordsPanel";
import "./AdminDashboard.css";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ef4444", "#1d4ed8", "#eab308"];

const SectionCard = ({ title, children }) => (
  <section className="admin-section-card">
    <h2 className="admin-section-title">{title}</h2>
    {children}
  </section>
);

const SummaryCard = ({ title, primary, secondary }) => (
  <div className="admin-summary-card">
    <p className="admin-summary-title">{title}</p>
    <p className="admin-summary-primary">{primary}</p>
    {secondary ? <p className="admin-summary-secondary">{secondary}</p> : null}
  </div>
);

const SummaryColumnCard = ({ title, items = [] }) => (
  <div className="admin-summary-card">
    <p className="admin-summary-title">{title}</p>
    <div className="admin-summary-lines">
      {items.map((item) => (
        <p key={`${title}-${item.label}`} className="admin-summary-line">
          <span className="admin-summary-line-label">{item.label}:</span> {item.value}
        </p>
      ))}
    </div>
  </div>
);

const DoughnutCard = ({ title, data }) => (
  <SectionCard title={title}>
    <div className="admin-chart-wrap">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={`${title}-${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </SectionCard>
);

const formatDate = (dateValue) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue || "-");
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const AdminDashboard = () => {
  const token = getToken();
  const decodedToken = decodeToken(token);
  const userRole = decodedToken?.role || "admin";
  const isSuperAdmin = userRole === "superadmin";
  
  const [activeTab, setActiveTab] = useState("overview"); // overview, assign, students, staff
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: loggedUser } = useGetLoggedUserQuery(token, { skip: !token });
  const { data, isLoading, isError } = useGetAdminDashboardQuery(token, { skip: !token });
  const { data: allStudentsData, isLoading: loadingStudents } = useGetAllStudentsListQuery(undefined, { skip: activeTab !== "students" });
  const { data: allStaffData, isLoading: loadingStaff } = useGetAllStaffQuery(undefined, { skip: activeTab !== "staff" });

  // Variable Requests
  const { data: varReqData, refetch: refetchVarReqs } = useGetPendingVariableRequestsQuery();
  const [reviewRequest, { isLoading: isReviewing }] = useReviewVariableRequestMutation();
  const pendingRequests = varReqData?.data?.filter(r => r.status === "pending") || [];

  const handleReview = async (id, decision) => {
    try {
      await reviewRequest({ id, decision }).unwrap();
      refetchVarReqs();
    } catch (err) {
      alert("Failed to review request: " + (err?.data?.message || "Unknown error"));
    }
  };

  const payload = data?.data || {};
  const attendance = payload.attendance || { totalStudents: 0, present: 0, absent: 0 };
  const activeTherapy = payload.activeTherapyCases || { PT: 0, OT: 0, SLT: 0 };
  const staffStatus = payload.staffStatus || { totalStaff: 0, teachers: 0, therapists: 0, doctors: 0 };
  const criticalAlerts = payload.criticalAlerts || { count: 0, status: "None" };

  const classDistribution = Array.isArray(payload.classDistribution) ? payload.classDistribution : [];
  const groupDistribution = Array.isArray(payload.groupDistribution) ? payload.groupDistribution : [];
  const classComparison = Array.isArray(payload.classComparison) ? payload.classComparison : [];
  const schoolsDirectory = Array.isArray(payload.schoolsDirectory) ? payload.schoolsDirectory : [];
  const staffAssignments = Array.isArray(payload.staffAssignments) ? payload.staffAssignments : [];
  const therapySchedule = Array.isArray(payload.therapySchedule) ? payload.therapySchedule : [];

  const studentsList = allStudentsData?.data?.students || [];
  const staffList = allStaffData?.data?.staff || [];

  if (isLoading) {
    return <div className="admin-dashboard"><div className="admin-loading">Loading master admin panel...</div></div>;
  }
  if (isError) {
    return <div className="admin-dashboard"><div className="admin-error">Unable to load admin dashboard data.</div></div>;
  }

  const filteredStudents = studentsList.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staffList.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-dashboard" style={{ background:"#f8fafc", padding:"1.5rem", minHeight:"100vh" }}>
      {selectedStudent && <StudentRecordsPanel student={selectedStudent} onClose={() => setSelectedStudent(null)} role="admin" />}

      {/* ─── Header ─── */}
      <div className="admin-header" style={{
        background:"linear-gradient(135deg, #0f172a, #334155)", padding:"1.5rem 2rem",
        borderRadius:"16px", color:"#fff", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem",
        boxShadow:"0 10px 25px rgba(15,23,42,0.15)"
      }}>
        <div>
          <span style={{background:"rgba(255,255,255,0.2)", padding:"4px 10px", borderRadius:"20px", fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"1px"}}>🛡️ Master Admin</span>
          <h1 style={{margin:"0.5rem 0 0.2rem", fontSize:"1.6rem", fontWeight:800}}>System Administration</h1>
          <p style={{margin:0, color:"#cbd5e1", fontSize:"0.85rem"}}>Welcome back, {loggedUser?.user?.name || "Admin"}</p>
        </div>
        <div style={{background:criticalAlerts.count>0?"rgba(239,68,68,0.2)":"rgba(16,185,129,0.2)", border:criticalAlerts.count>0?"1px solid #ef4444":"1px solid #10b981", padding:"0.5rem 1rem", borderRadius:"12px", textAlign:"right"}}>
          <div style={{fontSize:"0.75rem", color:criticalAlerts.count>0?"#fca5a5":"#a7f3d0", fontWeight:700, textTransform:"uppercase"}}>System Status</div>
          <div style={{fontSize:"1rem", color:"#fff", fontWeight:800}}>{criticalAlerts.count > 0 ? `${criticalAlerts.count} Critical Alerts` : "All Systems Normal"}</div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{display:"flex", gap:"0.5rem", marginBottom:"1.5rem", background:"#fff", padding:"0.5rem", borderRadius:"12px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
        {[
          { id:"overview", label:"📊 Platform Overview" },
          { id:"assign", label:"🔗 Assign Students" },
          { id:"students", label:"👨‍🎓 Master Student Explorer" },
          { id:"staff", label:"👥 Staff Directory" }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex:1, padding:"0.75rem", border:"none", borderRadius:"8px", fontSize:"0.85rem", fontWeight:700, cursor:"pointer",
            background:activeTab===t.id?"#0f172a":"transparent", color:activeTab===t.id?"#fff":"#64748b", transition:"all 0.2s"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === "overview" && (
        <div className="admin-tab-content">
          <div className="admin-summary-grid">
            <SummaryColumnCard title="Total Students & Attendance" items={[{ label: "Total Students", value: attendance.totalStudents }, { label: "Present", value: attendance.present }, { label: "Absent", value: attendance.absent }]} />
            <SummaryColumnCard title="Active Therapy Cases" items={[{ label: "PT", value: activeTherapy.PT }, { label: "OT", value: activeTherapy.OT }, { label: "SLT", value: activeTherapy.SLT }]} />
            <SummaryColumnCard title="Staff Status" items={[{ label: "Total", value: staffStatus.totalStaff }, { label: "Teachers", value: staffStatus.teachers }, { label: "Therapists", value: staffStatus.therapists }, { label: "Doctors", value: staffStatus.doctors }]} />
            <SummaryCard title="Critical Alerts" primary={criticalAlerts.status} secondary={`Critical case entries: ${criticalAlerts.count}`} />
          </div>

          {/* ── Variable Requests Approval ── */}
          {pendingRequests.length > 0 && (
            <div className="admin-section-card" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 className="admin-section-title" style={{ margin: 0 }}>⏳ Pending Variable Changes</h2>
                <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.7rem", fontWeight: 800, padding: "4px 10px", borderRadius: "20px" }}>{pendingRequests.length} Requests</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {pendingRequests.map(req => (
                  <div key={req._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", color: "#64748b" }}><strong>{req.student?.name}</strong> ({req.student?.email})</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: req.action === "add" ? "#059669" : "#dc2626", marginTop: "0.2rem" }}>
                        {req.action === "add" ? "➕ Add" : "➖ Remove"} variable: <strong>{req.variableLabel}</strong>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.3rem" }}>Requested on {new Date(req.requestedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => handleReview(req._id, "approved")}
                        disabled={isReviewing}
                        style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", padding: "0.45rem 1rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                      >Approve</button>
                      <button 
                        onClick={() => handleReview(req._id, "rejected")}
                        disabled={isReviewing}
                        style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "0.45rem 1rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                      >Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="admin-two-column">
            <DoughnutCard title="Count of Total Students by Class" data={classDistribution} />
            <DoughnutCard title="Count of Students by Total Student Group" data={groupDistribution} />
          </div>

          <SectionCard title="Student Distribution by School & Class">
            <div className="admin-chart-wrap">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={classComparison} layout="vertical" margin={{ top: 8, right: 24, left: 36, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={240} interval={0} />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="value" name="Total Students" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Schools & Classes Management">
            <div className="admin-table-wrap">
              {schoolsDirectory.length > 0 ? (
                <table className="admin-table">
                  <thead><tr><th>School Name</th><th>Classes</th><th>Students</th><th>Teachers</th><th>Therapists</th><th>Doctors</th></tr></thead>
                  <tbody>
                    {schoolsDirectory.map((school, index) => (
                      <tr key={school._id || index}>
                        <td><strong>{school.name}</strong></td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {(school.classStats || []).length ? (school.classStats || []).map((cls, idx) => (
                              <span key={idx} style={{ background: "#dbeafe", color: "#1e40af", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>{cls.name} ({cls.students})</span>
                            )) : <span style={{ color: "#64748b", fontSize: "0.85rem" }}>No class data</span>}
                          </div>
                        </td>
                        <td>{school.studentsCount || 0}</td>
                        <td>{(school.teachers || []).length}</td>
                        <td>{(school.therapists || []).length}</td>
                        <td>{(school.doctors || []).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p style={{ padding: "1rem", color: "#64748b" }}>No schools found.</p>}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ─── TAB 2: ASSIGN STUDENTS ─── */}
      {activeTab === "assign" && (
        <div style={{background:"#fff", padding:"1.5rem", borderRadius:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
          <AssignStudents />
        </div>
      )}

      {/* ─── TAB 3: MASTER DATA EXPLORER ─── */}
      {activeTab === "students" && (
        <div style={{background:"#fff", padding:"1.5rem", borderRadius:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem"}}>
            <div>
              <h2 style={{margin:0, fontSize:"1.25rem", color:"#0f172a", fontWeight:800}}>Master Student Directory</h2>
              <p style={{margin:"0.2rem 0 0", fontSize:"0.85rem", color:"#64748b"}}>Click "View Full Data" to access a student's complete daily records and behavioral profile.</p>
            </div>
            <input type="text" placeholder="Search student name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
              style={{padding:"0.6rem 1rem", border:"1.5px solid #e2e8f0", borderRadius:"10px", width:"300px", outline:"none", fontFamily:"inherit", fontSize:"0.85rem"}} />
          </div>

          {loadingStudents ? <div style={{padding:"2rem", textAlign:"center", color:"#64748b"}}>Loading directory...</div> : (
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:"1rem"}}>
              {filteredStudents.map(student => (
                <div key={student._id} style={{border:"1px solid #e2e8f0", borderRadius:"12px", padding:"1.25rem", background:"#f8fafc", transition:"all 0.2s"}}>
                  <div style={{display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem"}}>
                    <div style={{width:"48px", height:"48px", borderRadius:"50%", background:"linear-gradient(135deg, #3b82f6, #2563eb)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", fontWeight:800}}>
                      {student.name ? student.name[0].toUpperCase() : "S"}
                    </div>
                    <div>
                      <div style={{fontWeight:800, color:"#0f172a", fontSize:"1.05rem"}}>{student.name}</div>
                      <div style={{fontSize:"0.75rem", color:"#64748b"}}>{student.email}</div>
                    </div>
                  </div>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem", marginBottom:"1rem"}}>
                    <div style={{background:"#fff", padding:"0.5rem", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:"0.65rem", color:"#64748b", fontWeight:700, textTransform:"uppercase"}}>School</div>
                      <div style={{fontSize:"0.8rem", fontWeight:600, color:"#0f172a"}}>{student.school || "—"}</div>
                    </div>
                    <div style={{background:"#fff", padding:"0.5rem", borderRadius:"8px", border:"1px solid #e2e8f0"}}>
                      <div style={{fontSize:"0.65rem", color:"#64748b", fontWeight:700, textTransform:"uppercase"}}>Class</div>
                      <div style={{fontSize:"0.8rem", fontWeight:600, color:"#0f172a"}}>{student.class || "—"}</div>
                    </div>
                  </div>
                  <div style={{display:"flex", gap:"0.4rem", flexWrap:"wrap", marginBottom:"1rem"}}>
                    {student.assignedTeacher && <span style={{fontSize:"0.7rem", padding:"0.2rem 0.6rem", background:"#dbeafe", color:"#1d4ed8", borderRadius:"999px", fontWeight:700}}>👨‍🏫 Assigned</span>}
                    {student.assignedDoctor && <span style={{fontSize:"0.7rem", padding:"0.2rem 0.6rem", background:"#fee2e2", color:"#b91c1c", borderRadius:"999px", fontWeight:700}}>🩺 Assigned</span>}
                    {student.assignedTherapist && <span style={{fontSize:"0.7rem", padding:"0.2rem 0.6rem", background:"#f3e8ff", color:"#7e22ce", borderRadius:"999px", fontWeight:700}}>🧑‍⚕️ Assigned</span>}
                  </div>
                  <button onClick={() => setSelectedStudent(student)} style={{
                    width:"100%", padding:"0.65rem", background:"#0f172a", color:"#fff", border:"none", borderRadius:"8px",
                    fontWeight:700, fontSize:"0.85rem", cursor:"pointer", transition:"all 0.2s"
                  }}>
                    🔍 View Full Data Explorer
                  </button>
                </div>
              ))}
              {filteredStudents.length === 0 && <div style={{gridColumn:"1/-1", padding:"3rem", textAlign:"center", color:"#64748b"}}>No students found matching your search.</div>}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: STAFF DIRECTORY ─── */}
      {activeTab === "staff" && (
        <div style={{background:"#fff", padding:"1.5rem", borderRadius:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
           <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem"}}>
            <div>
              <h2 style={{margin:0, fontSize:"1.25rem", color:"#0f172a", fontWeight:800}}>Staff Directory & Caseloads</h2>
              <p style={{margin:"0.2rem 0 0", fontSize:"0.85rem", color:"#64748b"}}>Overview of all registered Doctors, Teachers, and Therapists.</p>
            </div>
            <input type="text" placeholder="Search staff name or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
              style={{padding:"0.6rem 1rem", border:"1.5px solid #e2e8f0", borderRadius:"10px", width:"300px", outline:"none", fontFamily:"inherit", fontSize:"0.85rem"}} />
          </div>

          {loadingStaff ? <div style={{padding:"2rem", textAlign:"center", color:"#64748b"}}>Loading staff directory...</div> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Staff Member</th><th>Role</th><th>School / Organization</th><th>Email Contact</th></tr></thead>
                <tbody>
                  {filteredStaff.map((staff, idx) => {
                    const roleColors = {
                      doctor: { bg: "#fee2e2", color: "#b91c1c", icon: "🩺" },
                      teacher: { bg: "#dbeafe", color: "#1d4ed8", icon: "👨‍🏫" },
                      therapist: { bg: "#f3e8ff", color: "#7e22ce", icon: "🧑‍⚕️" },
                      admin: { bg: "#f1f5f9", color: "#475569", icon: "🛡️" }
                    };
                    const rc = roleColors[staff.role] || roleColors.admin;
                    return (
                      <tr key={staff._id || idx}>
                        <td>
                          <div style={{display:"flex", alignItems:"center", gap:"0.75rem"}}>
                            <div style={{width:"36px", height:"36px", borderRadius:"50%", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0f172a"}}>
                              {staff.name ? staff.name[0].toUpperCase() : "?"}
                            </div>
                            <strong style={{color:"#0f172a"}}>{staff.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span style={{background:rc.bg, color:rc.color, padding:"0.3rem 0.75rem", borderRadius:"999px", fontSize:"0.75rem", fontWeight:800, textTransform:"uppercase"}}>
                            {rc.icon} {staff.role}
                          </span>
                        </td>
                        <td style={{color:"#475569", fontWeight:500}}>{staff.school || "—"}</td>
                        <td style={{color:"#64748b", fontSize:"0.85rem"}}>{staff.email}</td>
                      </tr>
                    );
                  })}
                  {filteredStaff.length === 0 && <tr><td colSpan={4} style={{textAlign:"center", padding:"2rem", color:"#64748b"}}>No staff found matching search.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

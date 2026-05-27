import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useGetLoggedUserQuery, useGetMyStudentsQuery } from "../../services/userAuthApi";
import { getToken } from "../../services/LocalStorageService";
import {
  useGetshowingAngerLineChartDataQuery, useGethitWithHandLineChartDataQuery,
  useGetSleepingLineChartDataQuery, useGetsicknessDoughnutChartDataQuery,
  useGettherapyTypeDoughnutChartDataQuery, useGetscreenTimeBarChartDataQuery,
  useGetFoodBarChartDataQuery, useGethitWithHeadLineChartDataQuery,
  useGetglassCrashLineChartDataQuery, useGetpushingTendencyLineChartDataQuery,
  useGettoiletLineChartDataQuery, useGetmasturbationLineChartDataQuery,
  useGetbedwettingDoughnutChartDataQuery, useGetgoingToSleepBarChartDataQuery,
  useGetcuttingNailsLineChartDataQuery, useGetwakingUpBarChartDataQuery,
  useGetrequiredSleepTimeLineChartDataQuery, useGetcooperateAtHomeLineChartDataQuery,
  useGetcooperateAtSchoolLineChartDataQuery
} from "../../services/graphDataService";
import { useGetFinalScoreQuery } from "../../services/finalScoreService";
import { useGetUserEntriesQuery } from "../../services/getEntries";
import StudentRecordsPanel from "../../components/StudentRecordsPanel/StudentRecordsPanel";
import "./DoctorDashboard.css";

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const today = getLocalDateString();
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const CHART_COLORS = ["#3b82f6","#10b981","#f97316","#8b5cf6","#ef4444","#06b6d4","#eab308"];

const SEV = {
  critical:{ label:"Critical",   bg:"#fef2f2", border:"#ef4444", badge:"#ef4444" },
  moderate:{ label:"Monitoring", bg:"#fffbeb", border:"#f59e0b", badge:"#f59e0b" },
  stable:  { label:"Stable",     bg:"#f0fdf4", border:"#10b981", badge:"#10b981" },
};

const APPOINTMENTS = [
  { time:"08:30", name:"Riya Akter",       type:"Consultation",      status:"confirmed", room:"OPD-1" },
  { time:"09:15", name:"Ahmed Hassan",      type:"Behavioral Review", status:"confirmed", room:"OPD-2" },
  { time:"10:00", name:"Sadia Islam",       type:"Medication Review", status:"pending",   room:"OPD-1" },
  { time:"11:00", name:"Tanvir Hossain",   type:"Family Counseling", status:"confirmed", room:"Conf-A" },
  { time:"12:30", name:"Fatema Begum",      type:"Progress Eval",     status:"pending",   room:"OPD-3" },
  { time:"02:00", name:"Karim Molla",       type:"Follow-Up",         status:"confirmed", room:"OPD-2" },
  { time:"03:30", name:"Multi-disciplinary",type:"Case Conference",   status:"done",      room:"Conf-B" },
];

const MEDICATIONS = [
  { name:"Risperidone",  dose:"0.5mg", freq:"Once daily — morning", purpose:"Behavioral", patients:3 },
  { name:"Melatonin",    dose:"3mg",   freq:"Bedtime",              purpose:"Sleep",      patients:5 },
  { name:"Folic Acid",   dose:"5mg",   freq:"Once daily",           purpose:"Supplement", patients:7 },
  { name:"Sertraline",   dose:"25mg",  freq:"Morning with food",    purpose:"Anxiety",    patients:2 },
  { name:"Atomoxetine",  dose:"10mg",  freq:"Twice daily",          purpose:"Focus/ADHD", patients:4 },
];

const DIAGNOSES = [
  { label:"ASD Level 1", count:3, color:"#10b981" },
  { label:"ASD Level 2", count:5, color:"#3b82f6" },
  { label:"ASD Level 3", count:2, color:"#f97316" },
  { label:"ECDP",        count:4, color:"#8b5cf6" },
];

const normLine = (raw) => {
  const ds = raw?.data?.last7day;
  if (!ds) return [];
  return (ds.labels||[]).map((d,i)=>({ date:d, value:ds.datasets?.[0]?.data?.[i]??0 }));
};
const normPie = (raw) => {
  const d = raw?.data;
  if (!d) return [];
  return (d.labels||[]).map((name,i)=>({ name, value:d.datasets?.[0]?.data?.[i]??0 }));
};
const normFood = (raw) => {
  const ds = raw?.data?.last7day;
  if (!ds) return [];
  return (ds.labels||[]).map((d,i)=>({
    date:d,
    Breakfast:ds.datasets?.[0]?.data?.[i]??0,
    Lunch:ds.datasets?.[1]?.data?.[i]??0,
    Dinner:ds.datasets?.[2]?.data?.[i]??0,
  }));
};

const Tip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}>
      <p style={{color:"#64748b",margin:0,fontSize:11}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,margin:"2px 0",fontSize:12,fontWeight:700}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const DoctorDashboard = () => {
  const token = getToken();
  const { data: loggedUserData } = useGetLoggedUserQuery(token);
  const user = loggedUserData?.user;
  const { data: myData, isLoading } = useGetMyStudentsQuery();
  const patients = myData?.data?.students || [];

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [graphPatientId, setGraphPatientId]   = useState(null);
  const [graphDate, setGraphDate] = useState(getLocalDateString);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState({});
  const [tab, setTab] = useState("patients");
  const [clinicalNotes, setClinicalNotes] = useState([
    { id:1, patient:"Riya Akter",   sev:"moderate", note:"ASD Level 2 – dosage review pending. OT 2×/week recommended. Monitor food intake closely.", date:"2026-05-04" },
    { id:2, patient:"Ahmed Hassan", sev:"stable",   note:"Reduction in SIB observed. Melatonin effective. Continue current plan.", date:"2026-05-03" },
    { id:3, patient:"Sadia Islam",  sev:"critical",  note:"Anger score 9/10 two consecutive days. Behavioral intervention started. Parent meeting scheduled.", date:"2026-05-02" },
  ]);
  const [noteText, setNoteText] = useState("");
  const [notePatient, setNotePatient] = useState("");
  const [noteSev, setNoteSev] = useState("stable");

  useEffect(() => {
    if (!graphPatientId && patients.length > 0) {
      setGraphPatientId(patients[0]._id);
    }
  }, [patients, graphPatientId]);

  // Auto-populate notePatient when graphPatientId changes
  useEffect(() => {
    if (graphPatientId) {
      const found = patients.find(p => p._id === graphPatientId);
      if (found) setNotePatient(found.name);
    }
  }, [graphPatientId, patients]);

  const args = graphPatientId ? { userId: graphPatientId, selectedDate: graphDate } : undefined;
  const { data: angerRaw }   = useGetshowingAngerLineChartDataQuery(args);
  const { data: hitRaw }     = useGethitWithHandLineChartDataQuery(args);
  const { data: sleepRaw }   = useGetSleepingLineChartDataQuery(args);
  const { data: sickRaw }    = useGetsicknessDoughnutChartDataQuery(args);
  const { data: therapyRaw } = useGettherapyTypeDoughnutChartDataQuery(args);
  const { data: screenRaw }  = useGetscreenTimeBarChartDataQuery(args);
  const { data: foodRaw }    = useGetFoodBarChartDataQuery(args);
  
  // New Deep Dive Queries
  const { data: hitHeadRaw } = useGethitWithHeadLineChartDataQuery(args);
  const { data: glassRaw }   = useGetglassCrashLineChartDataQuery(args);
  const { data: pushRaw }    = useGetpushingTendencyLineChartDataQuery(args);
  const { data: toiletRaw }  = useGettoiletLineChartDataQuery(args);
  const { data: mastRaw }    = useGetmasturbationLineChartDataQuery(args);
  const { data: bedWRaw }    = useGetbedwettingDoughnutChartDataQuery(args);
  const { data: goSleepRaw } = useGetgoingToSleepBarChartDataQuery(args);
  const { data: nailsRaw }   = useGetcuttingNailsLineChartDataQuery(args);
  const { data: wakingRaw }  = useGetwakingUpBarChartDataQuery(args);
  const { data: reqSleepRaw }= useGetrequiredSleepTimeLineChartDataQuery(args);
  const { data: coopHomeRaw }= useGetcooperateAtHomeLineChartDataQuery(args);
  const { data: coopSchRaw } = useGetcooperateAtSchoolLineChartDataQuery(args);
  const { data: finalScoreRaw } = useGetFinalScoreQuery(args);
  const { data: entriesData }   = useGetUserEntriesQuery(
    { userId: graphPatientId },
    { skip: !graphPatientId }
  );

  const angerData   = normLine(angerRaw);
  const hitData     = normLine(hitRaw);
  const sleepData   = normLine(sleepRaw);
  const screenData  = normLine(screenRaw);
  const sickData    = normPie(sickRaw);
  const therapyData = normPie(therapyRaw);
  const foodData    = normFood(foodRaw);

  const hitHeadData = normLine(hitHeadRaw);
  const glassData   = normLine(glassRaw);
  const pushData    = normLine(pushRaw);
  const toiletData  = normLine(toiletRaw);
  const mastData    = normLine(mastRaw);
  const bedWData    = normPie(bedWRaw);
  const goSleepData = normLine(goSleepRaw);
  const nailsData   = normLine(nailsRaw);
  const wakingData  = normLine(wakingRaw);
  const reqSleepData= normLine(reqSleepRaw);
  const coopHomeData= normLine(coopHomeRaw);
  const coopSchData = normLine(coopSchRaw);

  const rawScores = finalScoreRaw?.data || [];
  const scoreData = rawScores.slice(-14).map(s => ({ date: s.date ? new Date(s.date).toISOString().split('T')[0] : "", Score: s.finalScore ?? 0 }));

  const behaviorData = angerData.map((d,i)=>({ date:d.date, Anger:d.value, Hitting:hitData[i]?.value??0 }));
  const severeIncidents = hitHeadData.map((d,i)=>({ date:d.date, HeadHit:d.value, Glass:glassData[i]?.value??0, Push:pushData[i]?.value??0 }));
  const hygieneData = toiletData.map((d,i)=>({ date:d.date, Toilet:d.value, Masturbation:mastData[i]?.value??0 }));
  const coopData = coopHomeData.map((d,i)=>({ date:d.date, Home:d.value, School:coopSchData[i]?.value??0 }));
  const sleepMetricsData = wakingData.map((d,i)=>({ date:d.date, Waking:d.value, Latency:reqSleepData[i]?.value??0 }));

  const getStatus = (p) => statuses[p._id]||"stable";
  const setStatus = (id,s) => setStatuses(p=>({...p,[id]:s}));
  const critCnt = patients.filter(p=>getStatus(p)==="critical").length;
  const monCnt  = patients.filter(p=>getStatus(p)==="moderate").length;
  const filtered = patients.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()));
  const selName = graphPatientId ? (patients.find(p=>p._id===graphPatientId)?.name||"Patient") : "All Patients";

  const saveNote = () => {
    if (noteText.trim()) {
      setClinicalNotes(p=>[{ id:Date.now(), patient:notePatient||"General", sev:noteSev, note:noteText, date:today },...p]);
      setNoteText("");
    }
  };

  const todayAppts = APPOINTMENTS.filter(a=>a.status!=="done");

  return (
    <div className="doc doctor-theme">
      {selectedPatient && <StudentRecordsPanel student={selectedPatient} onClose={()=>setSelectedPatient(null)} role="doctor" />}

      {/* ─── Header ─── */}
      <div className="doc-hdr">
        <div>
          <span className="doc-badge">🩺 Doctor Dashboard</span>
          <h1 className="doc-title">Dr. {user?.name||"Doctor"} — Clinical Management</h1>
          <p className="doc-sub">{user?.school||"Hospital/School"} &nbsp;·&nbsp; {DAY_NAMES[new Date().getDay()]}, {today}</p>
        </div>
        <div className="doc-alert-pills">
          {critCnt>0 && <span className="doc-alert-pill doc-alert-red">🚨 {critCnt} Critical Cases</span>}
          {monCnt>0  && <span className="doc-alert-pill doc-alert-amber">⚠️ {monCnt} Monitoring</span>}
          <span className="doc-alert-pill doc-alert-green">📅 {todayAppts.length} Appointments Today</span>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="doc-stats">
        {[
          { icon:"👥", val:patients.length,                                    label:"Total Patients",     cls:"doc-s-blue"   },
          { icon:"🚨", val:critCnt,                                             label:"Critical",           cls:"doc-s-red"    },
          { icon:"⚠️", val:monCnt,                                              label:"Monitoring",         cls:"doc-s-amber"  },
          { icon:"✅", val:patients.length-critCnt-monCnt,                     label:"Stable",             cls:"doc-s-green"  },
          { icon:"📅", val:APPOINTMENTS.length,                                 label:"Appts Today",        cls:"doc-s-teal"   },
          { icon:"📋", val:clinicalNotes.length,                               label:"Clinical Notes",     cls:"doc-s-purple" },
        ].map((s,i)=>(
          <div key={i} className={`doc-stat ${s.cls}`}>
            <div className="doc-si">{s.icon}</div>
            <div><div className="doc-sv">{s.val}</div><div className="doc-sl">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="doc-quick-actions">
        {[
          { icon:"📝", label:"New Clinical Note" },
          { icon:"💊", label:"Prescribe Medication" },
          { icon:"📅", label:"Schedule Appointment" },
          { icon:"📊", label:"Generate Report" },
          { icon:"📞", label:"Contact Parent" },
          { icon:"🔄", label:"Refer to Specialist" },
        ].map((a,i)=>(
          <button key={i} className="doc-qa-btn">
            <span className="doc-qa-icon">{a.icon}</span>{a.label}
          </button>
        ))}
      </div>

      {/* ─── Today's Appointment Schedule ─── */}
      <div className="doc-section">
        <h2 className="doc-sec-title">📅 Today's Appointment Schedule</h2>
        <div className="doc-appt-list">
          {APPOINTMENTS.map((a,i)=>(
            <div key={i} className={`doc-appt-row ${a.status==="pending"?"doc-appt-pending":""}`}>
              <div className="doc-appt-time">{a.time}</div>
              <div className="doc-appt-body">
                <div className="doc-appt-name">{a.name}</div>
                <div className="doc-appt-type">{a.type} &nbsp;·&nbsp; <span style={{color:"#3b82f6",fontWeight:700}}>{a.room}</span></div>
              </div>
              <span className={`doc-appt-status ${a.status==="confirmed"?"doc-appt-conf":a.status==="done"?"doc-appt-done":"doc-appt-pend"}`}>
                {a.status==="confirmed"?"✅ Confirmed":a.status==="done"?"✔ Done":"⏳ Pending"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Graph Patient Selector ─── */}
      <div className="doc-graph-selector">
        <div className="doc-gs-item">
          <span className="doc-gs-label">📊 Patient Data View:</span>
          <select className="doc-gs-select" value={graphPatientId||""} onChange={e=>setGraphPatientId(e.target.value||null)}>
            <option value="">All / Overview</option>
            {patients.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        {graphPatientId && (
          <div className="doc-gs-item">
            <span className="doc-gs-label">📅 Analytics Date:</span>
            <input 
              type="date" 
              className="doc-gs-date" 
              value={graphDate} 
              onChange={e=>setGraphDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        )}
        <span className="doc-gs-badge">📋 {selName}</span>
      </div>

      {/* ─── Charts Row 1 ─── */}
      <div className="doc-charts-row">
        <div className="doc-chart-card">
          <h3 className="doc-chart-title">📈 Behavioral Trend — Anger & Hitting (7 Days)</h3>
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={behaviorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
              <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{fontSize:12}} />
              <Bar dataKey="Anger" fill="#ef4444" radius={[4,4,0,0]} opacity={0.85} />
              <Line dataKey="Hitting" stroke="#8b5cf6" strokeWidth={2.5} dot={{r:4}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="doc-chart-card">
          <h3 className="doc-chart-title">😴 Overnight Sleep Hours (7 Days)</h3>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={sleepData}>
              <defs>
                <linearGradient id="slGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
              <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,12]} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="value" name="Sleep (hrs)" stroke="#3b82f6" fill="url(#slGrad)" strokeWidth={2.5} dot={{r:4}} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Charts Row 2 ─── */}
      <div className="doc-charts-row doc-charts-row-3">
        <div className="doc-chart-card">
          <h3 className="doc-chart-title">🤒 Sickness Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sickData} cx="50%" cy="50%" outerRadius={72} innerRadius={34} dataKey="value"
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {sickData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="doc-chart-card">
          <h3 className="doc-chart-title">💊 Therapy Sessions (7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={therapyData} cx="50%" cy="50%" outerRadius={72} innerRadius={34} dataKey="value"
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {therapyData.map((_,i)=><Cell key={i} fill={CHART_COLORS[(i+2)%CHART_COLORS.length]}/>)}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="doc-chart-card">
          <h3 className="doc-chart-title">📱 Screen Time (hrs/day)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={screenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
              <YAxis tick={{fill:"#94a3b8",fontSize:11}} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Screen Time">
                {screenData.map((d,i)=><Cell key={i} fill={d.value>4?"#ef4444":d.value>2?"#f97316":"#22c55e"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Charts Row 3: Food ─── */}
      <div className="doc-charts-row">
        <div className="doc-chart-card">
          <h3 className="doc-chart-title">🍽️ Daily Nutrition (Meals Consumed)</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={foodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
              <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{fontSize:11}} />
              <Bar dataKey="Breakfast" fill="#f97316" radius={[3,3,0,0]} />
              <Bar dataKey="Lunch"     fill="#22c55e" radius={[3,3,0,0]} />
              <Bar dataKey="Dinner"    fill="#3b82f6" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="doc-chart-card">
          <h3 className="doc-chart-title">🏥 Diagnosis Distribution</h3>
          <div className="doc-diag-grid" style={{marginTop:".5rem"}}>
            {DIAGNOSES.map(d=>(
              <div key={d.label} className="doc-diag-row">
                <div className="doc-diag-dot" style={{background:d.color}}/>
                <span className="doc-diag-label">{d.label}</span>
                <div className="doc-diag-bar-bg">
                  <div className="doc-diag-bar" style={{width:`${(d.count/10)*100}%`,background:d.color}}/>
                </div>
                <span className="doc-diag-cnt">{d.count}</span>
              </div>
            ))}
          </div>
          <div className="doc-alert-box" style={{marginTop:"1rem"}}>
            <span className="doc-alert-icon">ℹ️</span>
            <span className="doc-alert-text">Counts reflect current registered patients. Update from official case records monthly.</span>
          </div>
        </div>
      </div>

      {/* ─── NEW: DEEP DIVE CLINICAL CHARTS ─── */}
      {graphPatientId && (
        <>
          <div className="doc-section">
            <div className="doc-sec-hdr" style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>
              <h2 className="doc-sec-title">🧬 Clinical Deep Dive Profile: {selName}</h2>
              <span className="doc-alert-pill doc-alert-purple">Patient-Specific Analytics</span>
            </div>
          </div>
          
          <div className="doc-charts-row">
            <div className="doc-chart-card">
              <h3 className="doc-chart-title">⚠️ Severe Incident Tracking (Head Hit, Glass, Pushing)</h3>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={severeIncidents}>
                  <defs>
                    <linearGradient id="hhGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                  <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Area type="monotone" dataKey="HeadHit" name="Hit with Head" stroke="#ef4444" fill="url(#hhGrad)" strokeWidth={2.5} dot={{r:3}} />
                  <Line type="monotone" dataKey="Glass" name="Glass Crash" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" dot={{r:3}} />
                  <Line type="monotone" dataKey="Push" name="Pushing Tendency" stroke="#f59e0b" strokeWidth={2} dot={{r:3}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="doc-chart-card">
              <h3 className="doc-chart-title">🧻 Hygiene & Personal Care Patterns</h3>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={hygieneData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                  <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="Toilet" name="Toilet Independence" fill="#06b6d4" radius={[3,3,0,0]} />
                  <Bar dataKey="Masturbation" name="Masturbation Tendency" fill="#c026d3" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="doc-charts-row doc-charts-row-3">
            <div className="doc-chart-card">
              <h3 className="doc-chart-title">🛏️ Bedwetting Frequency</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bedWData} cx="50%" cy="50%" outerRadius={72} innerRadius={34} dataKey="value"
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {bedWData.map((_,i)=><Cell key={i} fill={["#3b82f6","#ef4444","#10b981"][i%3]}/>)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="doc-chart-card">
              <h3 className="doc-chart-title">😴 Difficulty Going to Sleep</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={goSleepData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                  <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="value" name="Difficulty Score" fill="#8b5cf6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="doc-chart-card">
              <h3 className="doc-chart-title">✂️ Sensory: Nail Cutting Coop.</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={nailsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                  <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Line type="stepAfter" dataKey="value" name="Cooperation Score" stroke="#10b981" strokeWidth={3} dot={{r:4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="doc-charts-row">
            <div className="doc-chart-card">
              <h3 className="doc-chart-title">🧠 AI Spectalyzer Score Trend (14 Days)</h3>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={scoreData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                  <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Area type="step" dataKey="Score" name="Spectalyzer Base Score" stroke="#10b981" fill="url(#scoreGrad)" strokeWidth={2.5} dot={{r:4}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="doc-chart-card">
              <h3 className="doc-chart-title">🤝 Cooperation: Home vs School</h3>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={coopData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                  <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Line type="monotone" dataKey="Home" stroke="#3b82f6" strokeWidth={2.5} dot={{r:3}} />
                  <Line type="monotone" dataKey="School" stroke="#8b5cf6" strokeWidth={2.5} dot={{r:3}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="doc-charts-row">
            <div className="doc-chart-card" style={{ flex: 1 }}>
              <h3 className="doc-chart-title">⏰ Advanced Sleep Metrics</h3>
              <ResponsiveContainer width="100%" height={210}>
                <ComposedChart data={sleepMetricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                  <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="Waking" name="Difficulty Waking Up" fill="#f59e0b" radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="Latency" name="Hours to Fall Asleep" stroke="#6366f1" strokeWidth={2.5} dot={{r:4}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ─── Tabs: Patients / Medications / Notes ─── */}
      <div className="doc-tabs">
        {[["patients","👥 My Patients"],["medications","💊 Medications"],["notes","📝 Clinical Notes"]].map(([k,l])=>(
          <button key={k} className={`doc-tab ${tab===k?"doc-tab-active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="patients" && (
        <div className="doc-section">
          <div className="doc-sec-hdr">
            <h2 className="doc-sec-title">👥 Patient Health Status</h2>
            <input className="doc-search" placeholder="Search patient…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="doc-admin-note">ℹ️ Patient assignments are managed by the administrator. Contact admin to add or reassign patients.</div>
          {isLoading ? <div className="doc-loading">Loading patients…</div> :
           filtered.length===0 ? <div className="doc-empty"><div>🩺</div><p>No patients assigned yet.</p></div> : (
            <div className="doc-patient-list">
              {filtered.map((p,i)=>{
                const st=getStatus(p); const sc=SEV[st];
                return (
                  <div key={p._id||i} className="doc-patient-row" style={{background:sc.bg,borderColor:sc.border}}>
                    <div className="doc-pr-left">
                      <div className="doc-pr-num">{i+1}</div>
                      <div className="doc-pr-av">{(p.name||"P")[0].toUpperCase()}</div>
                      <div>
                        <div className="doc-pr-name">{p.name}</div>
                        <div className="doc-pr-meta">{p.class||"—"} &nbsp;·&nbsp; {p.school||"—"} &nbsp;·&nbsp; Age: {p.age||"—"}</div>
                        <div className="doc-pr-staff">
                          {p.teacher   && <span className="doc-chip doc-chip-indigo">👨‍🏫 {p.teacher}</span>}
                          {p.therapist && <span className="doc-chip doc-chip-teal">🧑‍⚕️ {p.therapist}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="doc-pr-right">
                      <div className="doc-status-btns">
                        <button className={`doc-sbtn ${st==="stable"?"doc-sbtn-stable":""}`}   onClick={()=>setStatus(p._id,"stable")}>✅ Stable</button>
                        <button className={`doc-sbtn ${st==="moderate"?"doc-sbtn-watch":""}`}  onClick={()=>setStatus(p._id,"moderate")}>⚠️ Watch</button>
                        <button className={`doc-sbtn ${st==="critical"?"doc-sbtn-critical":""}`}onClick={()=>setStatus(p._id,"critical")}>🚨 Critical</button>
                      </div>
                      <div style={{display:"flex",gap:".4rem",marginTop:".4rem"}}>
                        <button className="doc-graph-btn" onClick={()=>setGraphPatientId(p._id===graphPatientId?null:p._id)}>
                          {p._id===graphPatientId?"📊 Hide":"📊 Graphs"}
                        </button>
                        <button className="doc-view-btn" onClick={()=>setSelectedPatient(p)}>📋 Full Records</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab==="medications" && (
        <div className="doc-section">
          <h2 className="doc-sec-title">💊 Active Medication Protocols</h2>
          <div className="doc-med-note">⚠️ Always verify individual patient prescriptions before dispensing. Dosages listed are standard starting doses only.</div>
          <div className="doc-med-list">
            {MEDICATIONS.map((m,i)=>(
              <div key={i} className="doc-med-row">
                <div className="doc-med-icon">💊</div>
                <div className="doc-med-body">
                  <div className="doc-med-name">{m.name} <span style={{fontSize:".7rem",color:"#94a3b8",fontWeight:500}}>({m.dose})</span></div>
                  <div className="doc-med-meta">🕐 {m.freq}</div>
                  <div className="doc-med-patient">👥 {m.patients} patient{m.patients!==1?"s":""} currently prescribed</div>
                </div>
                <span className="doc-med-purpose">{m.purpose}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="notes" && (
        <div className="doc-section">
          <h2 className="doc-sec-title">📝 Clinical Notes</h2>
          <div className="doc-notes-editor">
          {graphPatientId && notePatient && (
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"0.5rem 0.85rem",marginBottom:"0.5rem",fontSize:"0.82rem",color:"#16a34a",fontWeight:700,display:"flex",alignItems:"center",gap:"0.4rem"}}>
              ✅ Clinical note for: <strong>{notePatient}</strong>
              <button onClick={()=>setNotePatient("")} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:"0.75rem"}}>Change</button>
            </div>
          )}
          <div className="doc-notes-row">
            <select className="doc-select" value={notePatient} onChange={e=>setNotePatient(e.target.value)}>
                <option value="">Select patient…</option>
                {patients.map(p=><option key={p._id} value={p.name}>{p.name}</option>)}
              </select>
              <select className="doc-select doc-sel-sev" value={noteSev} onChange={e=>setNoteSev(e.target.value)}>
                <option value="stable">Stable</option>
                <option value="moderate">Monitoring</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <textarea className="doc-note-ta" rows={4}
              placeholder="Clinical observation, diagnosis update, medication change, referral notes, parent communication…"
              value={noteText} onChange={e=>setNoteText(e.target.value)}/>
            <button className="doc-save-btn" onClick={saveNote}>💾 Save Clinical Note</button>
          </div>
          <div className="doc-notes-list">
            {clinicalNotes.map(n=>{
              const sc=SEV[n.sev]||SEV.stable;
              return (
                <div key={n.id} className="doc-note-card" style={{borderLeftColor:sc.border}}>
                  <div className="doc-nc-hdr">
                    <span className="doc-nc-patient">{n.patient}</span>
                    <span className="doc-nc-sev" style={{background:sc.badge}}>{sc.label}</span>
                    <span className="doc-nc-date">{n.date}</span>
                  </div>
                  <p className="doc-nc-text">{n.note}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default DoctorDashboard;

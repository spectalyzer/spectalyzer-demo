import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from "recharts";
import { useGetLoggedUserQuery, useGetMyStudentsQuery, useGetPendingVariableRequestsQuery, useReviewVariableRequestMutation } from "../../services/userAuthApi";
import { getToken } from "../../services/LocalStorageService";
import {
  useGettherapyTypeDoughnutChartDataQuery, useGetcooperateAtHomeLineChartDataQuery,
  useGetcooperateAtSchoolLineChartDataQuery, useGetSleepingLineChartDataQuery,
  useGetrequiredSleepTimeLineChartDataQuery, useGetshowingAngerLineChartDataQuery,
  useGethitWithHandLineChartDataQuery, useGetoutgoingTendencyLineChartDataQuery,
  useGetfirstGoOutLineChartDataQuery, useGetoutgoingCountLineChartDataQuery,
  useGethairDressingLineChartDataQuery, useGetcuttingNailsLineChartDataQuery,
  useGetpushingTendencyLineChartDataQuery, useGetglassCrashLineChartDataQuery,
  useGettoiletLineChartDataQuery, useGetmasturbationLineChartDataQuery
} from "../../services/graphDataService";
import { useGetFinalScoreQuery } from "../../services/finalScoreService";
import StudentRecordsPanel from "../../components/StudentRecordsPanel/StudentRecordsPanel";
import "./TherapistDashboard.css";

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const today = getLocalDateString();
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAYS = ["SAT","SUN","MON","TUE","WED","THU","FRI"];
const todayDay = DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay()];

const THERAPY_TYPES = {
  SLT:{ label:"Speech & Language", color:"#9333ea" },
  OT: { label:"Occupational",       color:"#10b981" },
  PT: { label:"Physical",           color:"#f59e0b" },
};

const CHART_COLORS = ["#9333ea","#10b981","#f59e0b","#3b82f6","#ef4444","#06b6d4","#a855f7"];

const WEEKLY_SESSIONS = {
  SAT:[{time:"10:00 AM",type:"SLT",patient:"Riya Akter",desc:"Articulation Practice",room:"Therapy 1"},{time:"11:15 AM",type:"OT",patient:"Ahmed Hassan",desc:"Sensory Integration",room:"Therapy 2"}],
  SUN:[{time:"10:00 AM",type:"PT",patient:"Sadia Islam",desc:"Balance & Motor",room:"Gym"},{time:"11:15 AM",type:"SLT",patient:"Tanvir Hossain",desc:"Expressive Language",room:"Therapy 1"}],
  MON:[{time:"10:00 AM",type:"OT",patient:"Riya Akter",desc:"Fine Motor Skills",room:"Therapy 2"},{time:"11:15 AM",type:"PT",patient:"Karim Molla",desc:"Gross Motor Play",room:"Gym"}],
  TUE:[{time:"10:00 AM",type:"SLT",patient:"Group A",desc:"Group Communication",room:"Conf Room"},{time:"11:15 AM",type:"OT",patient:"Ahmed Hassan",desc:"Daily Living Skills",room:"Therapy 2"}],
  WED:[{time:"10:00 AM",type:"PT",patient:"Sadia Islam",desc:"Coordination Drill",room:"Gym"},{time:"11:15 AM",type:"SLT",patient:"Riya Akter",desc:"Social Language",room:"Therapy 1"}],
  THU:[{time:"10:00 AM",type:"OT",patient:"Karim Molla",desc:"Sensory Diet Plan",room:"Therapy 2"},{time:"11:15 AM",type:"PT",patient:"Ahmed Hassan",desc:"Strength Training",room:"Gym"}],
  FRI:[{time:"10:00 AM",type:"SLT",patient:"Tanvir Hossain",desc:"Progress Review",room:"Therapy 1"},{time:"11:15 AM",type:"OT",patient:"Sadia Islam",desc:"Parent Coaching",room:"Conf Room"}],
};

const MILESTONES = [
  { key:"speech",  label:"Speech Clarity",    icon:"🗣️", color:"#9333ea" },
  { key:"social",  label:"Social Interaction", icon:"🤝", color:"#10b981" },
  { key:"motor",   label:"Motor Skills",       icon:"🏃", color:"#3b82f6" },
  { key:"emotion", label:"Emotion Regulation", icon:"😊", color:"#f59e0b" },
  { key:"daily",   label:"Daily Living",       icon:"🏠", color:"#8b5cf6" },
];

const normLine = raw => {
  const ds = raw?.data?.last7day;
  if (!ds) return [];
  return (ds.labels||[]).map((d,i)=>({ date:d, value:ds.datasets?.[0]?.data?.[i]??0 }));
};
const normPie = raw => {
  const d = raw?.data;
  if (!d) return [];
  return (d.labels||[]).map((name,i)=>({ name, value:d.datasets?.[0]?.data?.[i]??0 }));
};

const Tip = ({ active, payload, label }) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 12px",boxShadow:"0 4px 12px rgba(0,0,0,.1)"}}>
      <p style={{color:"#64748b",margin:0,fontSize:11}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color,margin:"2px 0",fontSize:12,fontWeight:700}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const TherapistDashboard = () => {
  const token = getToken();
  const { data: loggedUserData } = useGetLoggedUserQuery(token);
  const user = loggedUserData?.user;
  const { data: myData, isLoading } = useGetMyStudentsQuery();
  const patients = myData?.data?.students || [];

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [graphPatientId, setGraphPatientId]   = useState(null);
  const [graphDate, setGraphDate] = useState(getLocalDateString);

  // Variable Requests
  const { data: varReqData, refetch: refetchVarReqs } = useGetPendingVariableRequestsQuery();
  const [reviewRequest, { isLoading: isReviewing }] = useReviewVariableRequestMutation();
  const pendingRequests = varReqData?.data?.filter(r => r.status === "pending" || r.status === "partially_approved") || [];

  const handleReview = async (id, decision) => {
    try {
      await reviewRequest({ id, decision }).unwrap();
      refetchVarReqs();
    } catch (err) {
      alert("Failed to review request: " + (err?.data?.message || "Unknown error"));
    }
  };
  const [search, setSearch] = useState("");

  // Auto-populate notePatient when graphPatientId changes
  useEffect(() => {
    if (graphPatientId) {
      const found = patients.find(p => p._id === graphPatientId);
      if (found) setNotePatient(found.name);
    }
  }, [graphPatientId, patients]);

  const DEFAULT_VARIABLES = [
    "wakingUp", "firstGoOut", "firstScreenOn", "breakfast", "schooling", 
    "classActivity", "outdoorActivity", "therapyAtSchool", "therapyType", "lunch", "eveningSnacks", 
    "dinner", "goingToSleep", "goToBedAt", "sleepAt", "gettingSleepTime", "outgoingTendency", 
    "outgoingCount", "screenTime", "junkFood", "makingNoise", "walking", "showingAnger", 
    "glassCrashTendency", "pushingTendency", "itemThrowTendency", "foodWaterThrowTendency", 
    "hitWithHand", "hitWithHead", "cooperateAtSchool", "cooperateAtHome", "cuttingNails", 
    "hairDressing", "bedwetting", "regularMedication", "otherSickness", "nameOfSickness", 
    "medOtherSickness", "listOfMedicine", "masturbation", "toilet", "overnightSleeping", 
    "specialActivity"
  ];

  const isVisible = (key) => {
    if (!graphPatientId) return true; // Show all for "Caseload Overview"
    const patient = patients.find(p => p._id === graphPatientId);
    const tracked = patient?.trackedVariables || [];
    if (tracked.length === 0) return DEFAULT_VARIABLES.includes(key);
    return tracked.includes(key);
  };

  const [sessionNotes, setSessionNotes] = useState([
    { id:1, patient:"Riya Akter", type:"SLT", note:"Improved bilabial sound articulation. Assigned oral motor exercises for home.", date:"2026-05-04" },
    { id:2, patient:"Ahmed Hassan", type:"OT",  note:"New tactile textures introduced. High tolerance observed.",  date:"2026-05-03" },
    { id:3, patient:"Sadia Islam", type:"PT",  note:"Walked 10 steps without support — major milestone!", date:"2026-05-02" },
  ]);
  const [noteText, setNoteText] = useState("");
  const [notePatient, setNotePatient] = useState("");
  const [noteType, setNoteType] = useState("SLT");
  const [milestones, setMilestones] = useState({ speech:75, social:60, motor:68, emotion:50, daily:82 });

  useEffect(() => {
    if (!graphPatientId && patients.length > 0) {
      setGraphPatientId(patients[0]._id);
    }
  }, [patients, graphPatientId]);

  const args = graphPatientId ? { userId: graphPatientId, selectedDate: graphDate } : undefined;
  const { data: therapyRaw } = useGettherapyTypeDoughnutChartDataQuery(args);
  const { data: cHomeRaw }   = useGetcooperateAtHomeLineChartDataQuery(args);
  const { data: cSchoolRaw } = useGetcooperateAtSchoolLineChartDataQuery(args);
  const { data: sleepRaw }   = useGetSleepingLineChartDataQuery(args);
  const { data: latencyRaw } = useGetrequiredSleepTimeLineChartDataQuery(args);
  const { data: angerRaw }   = useGetshowingAngerLineChartDataQuery(args);
  const { data: hitRaw }     = useGethitWithHandLineChartDataQuery(args);
  const { data: outRaw }     = useGetoutgoingTendencyLineChartDataQuery(args);

  // Deep Dive Queries
  const { data: firstOutRaw } = useGetfirstGoOutLineChartDataQuery(args);
  const { data: outCountRaw } = useGetoutgoingCountLineChartDataQuery(args);
  const { data: hairRaw }     = useGethairDressingLineChartDataQuery(args);
  const { data: nailsRaw }    = useGetcuttingNailsLineChartDataQuery(args);
  const { data: pushRaw }     = useGetpushingTendencyLineChartDataQuery(args);
  const { data: glassRaw }    = useGetglassCrashLineChartDataQuery(args);
  const { data: toiletRaw }   = useGettoiletLineChartDataQuery(args);
  const { data: mastRaw }     = useGetmasturbationLineChartDataQuery(args);
  const { data: finalScoreRaw } = useGetFinalScoreQuery(args);

  const therapyData = normPie(therapyRaw);
  const cHome       = normLine(cHomeRaw);
  const cSchool     = normLine(cSchoolRaw);
  const sleep       = normLine(sleepRaw);
  const latency     = normLine(latencyRaw);
  const anger       = normLine(angerRaw);
  const hit         = normLine(hitRaw);
  const out         = normLine(outRaw);

  const firstOutData = normLine(firstOutRaw);
  const outCountData = normLine(outCountRaw);
  const hairData     = normLine(hairRaw);
  const nailsData    = normLine(nailsRaw);
  const pushData     = normLine(pushRaw);
  const glassData    = normLine(glassRaw);
  const toiletData   = normLine(toiletRaw);
  const mastData     = normLine(mastRaw);

  const rawScores = finalScoreRaw?.data || [];
  const scoreData = rawScores.slice(-14).map(s => ({ date: s.date ? new Date(s.date).toISOString().split('T')[0] : "", Score: s.finalScore ?? 0 }));

  const coopData = cHome.map((d,i)=>({ date:d.date, Home:d.value, School:cSchool[i]?.value??0 }));
  const behaviorData = anger.map((d,i)=>({ date:d.date, Anger:d.value, Hitting:hit[i]?.value??0, Outgoing:out[i]?.value??0 }));
  const severeBehaviorData = pushData.map((d,i)=>({ date:d.date, Pushing:d.value, GlassCrash:glassData[i]?.value??0 }));
  const hygieneData = toiletData.map((d,i)=>({ date:d.date, Toilet:d.value, Masturbation:mastData[i]?.value??0 }));
  const elopementData = firstOutData.map((d,i)=>({ date:d.date, FirstOut:d.value, TotalOut:outCountData[i]?.value??0 }));
  const sensoryData = hairData.map((d,i)=>({ date:d.date, Haircut:d.value, Nails:nailsData[i]?.value??0 }));
  const sleepData = sleep.map((d,i)=>({ date:d.date, Sleep:d.value, Latency:latency[i]?.value??0 }));
  const radarData = MILESTONES.map(m=>({ subject:m.label, value:milestones[m.key] }));

  const saveNote = () => {
    if(noteText.trim()){
      setSessionNotes(p=>[{ id:Date.now(), patient:notePatient||"General", type:noteType, note:noteText, date:today },...p]);
      setNoteText("");
    }
  };

  const todaySessions = WEEKLY_SESSIONS[todayDay] || WEEKLY_SESSIONS.MON;
  const filtered = patients.filter(p=>p.name?.toLowerCase().includes(search.toLowerCase()));
  const selName = graphPatientId ? (patients.find(p=>p._id===graphPatientId)?.name||"Patient") : "Caseload Overview";

  return (
    <div className="thr therapist-theme">
      {selectedPatient && <StudentRecordsPanel student={selectedPatient} onClose={()=>setSelectedPatient(null)} role="therapist" />}

      {/* ─── Header ─── */}
      <div className="thr-hdr">
        <div>
          <span className="thr-badge">🧑‍⚕️ Therapist Dashboard</span>
          <h1 className="thr-title">Therapy Caseload & Goal Tracking</h1>
          <p className="thr-sub">{user?.name||"Therapist"} &nbsp;·&nbsp; {user?.school||"School/Clinic"} &nbsp;·&nbsp; {DAY_NAMES[new Date().getDay()]}, {today}</p>
        </div>
        <div className="thr-type-pills">
          <span className="thr-pill thr-pill-slt">SLT — Speech Language Therapy</span>
          <span className="thr-pill thr-pill-ot">OT — Occupational Therapy</span>
          <span className="thr-pill thr-pill-pt">PT — Physical Therapy</span>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="thr-stats">
        {[
          { icon:"👥", val:patients.length, label:"Active Patients", cls:"thr-s-purple" },
          { icon:"📅", val:todaySessions.length, label:"Sessions Today", cls:"thr-s-teal" },
          { icon:"📝", val:sessionNotes.length, label:"Session Notes", cls:"thr-s-amber" },
          { icon:"🏆", val:Object.values(milestones).filter(v=>v>=70).length, label:"Goals Met (≥70%)", cls:"thr-s-green" },
        ].map((s,i)=>(
          <div key={i} className={`thr-stat ${s.cls}`}>
            <div className="thr-si">{s.icon}</div>
            <div><div className="thr-sv">{s.val}</div><div className="thr-sl">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="thr-quick-actions">
        <button className="thr-qa-btn"><span className="thr-qa-icon">📝</span> Write Session Note</button>
        <button className="thr-qa-btn"><span className="thr-qa-icon">🎯</span> Update IEP Goals</button>
        <button className="thr-qa-btn"><span className="thr-qa-icon">🗓️</span> Reschedule Patient</button>
        <button className="thr-qa-btn"><span className="thr-qa-icon">📊</span> Export Progress Report</button>
      </div>

      {/* ─── Graph Selector ─── */}
      <div className="thr-graph-selector">
        <div className="thr-gs-item">
          <span className="thr-gs-label">📊 Analytics View:</span>
          <select className="thr-gs-select" value={graphPatientId||""} onChange={e=>setGraphPatientId(e.target.value||null)}>
            <option value="">Caseload Overview (All Patients)</option>
            {patients.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        {graphPatientId && (
          <div className="thr-gs-item">
            <span className="thr-gs-label">📅 Analytics Date:</span>
            <input 
              type="date" 
              className="thr-gs-date" 
              value={graphDate} 
              onChange={e=>setGraphDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        )}
        <span className="thr-gs-badge">📋 {selName}</span>
      </div>

      {/* ─── Charts Row 1 ─── */}
      <div className="thr-charts-row">
        {isVisible("therapyType") && (
          <div className="thr-chart-card">
            <h3 className="thr-chart-title">💊 Therapy Type Distribution</h3>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={therapyData} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value"
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {therapyData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {(isVisible("cooperateAtHome") || isVisible("cooperateAtSchool")) && (
          <div className="thr-chart-card">
            <h3 className="thr-chart-title">🤝 Cooperation Transfer: Home vs School</h3>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={coopData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Bar dataKey="Home" fill="#9333ea" radius={[3,3,0,0]} />
                <Bar dataKey="School" fill="#10b981" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── Charts Row 2 ─── */}
      <div className="thr-charts-row">
        {(isVisible("overnightSleeping") || isVisible("gettingSleepTime")) && (
          <div className="thr-chart-card">
            <h3 className="thr-chart-title">😴 Sleep Architecture (Hours vs Latency)</h3>
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={sleepData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                <YAxis yAxisId="left" tick={{fill:"#94a3b8",fontSize:11}} />
                <YAxis yAxisId="right" orientation="right" tick={{fill:"#94a3b8",fontSize:11}} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Bar yAxisId="right" dataKey="Latency" name="Latency (hrs)" fill="#f59e0b" radius={[3,3,0,0]} barSize={20} opacity={0.7} />
                <Line yAxisId="left" dataKey="Sleep" name="Total Sleep (hrs)" stroke="#3b82f6" strokeWidth={2.5} dot={{r:4}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {(isVisible("showingAnger") || isVisible("hitWithHand") || isVisible("outgoingTendency")) && (
          <div className="thr-chart-card">
            <h3 className="thr-chart-title">⚡ Self-Injurious & Challenging Behaviors</h3>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={behaviorData}>
                <defs>
                  <linearGradient id="angGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                {isVisible("showingAnger") && <Area type="monotone" dataKey="Anger" name="Anger Episodes" stroke="#ef4444" fill="url(#angGrad)" strokeWidth={2} />}
                {isVisible("hitWithHand") && <Line type="monotone" dataKey="Hitting" name="Hitting (SIB)" stroke="#8b5cf6" strokeWidth={2.5} dot={{r:4}} />}
                {isVisible("outgoingTendency") && <Line type="monotone" dataKey="Outgoing" name="Elopement Risk" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{r:3}} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── Charts Row 3: Milestones ─── */}
      <div className="thr-charts-row">
        <div className="thr-chart-card">
          <h3 className="thr-chart-title">🏆 Developmental Milestone Radar</h3>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart cx="50%" cy="50%" outerRadius={70} data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{fill:"#64748b",fontSize:11,fontWeight:600}} />
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} />
              <Radar name="Progress %" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

      {/* ─── NEW: DEEP DIVE THERAPEUTIC CHARTS ─── */}
      {graphPatientId && (
        <>
          <div className="thr-section">
            <div className="thr-sec-hdr" style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>
              <h2 className="thr-sec-title">🧬 Therapeutic Deep Dive Profile: {selName}</h2>
              <span className="thr-alert-pill thr-alert-purple">Patient-Specific Analytics</span>
            </div>
          </div>
          
          <div className="thr-charts-row">
            {(isVisible("firstGoOut") || isVisible("outgoingCount")) && (
              <div className="thr-chart-card">
                <h3 className="thr-chart-title">🏃 Elopement Dynamics (1st Time Out vs Total Count)</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <ComposedChart data={elopementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                    <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    {isVisible("outgoingCount") && <Bar dataKey="TotalOut" name="Total Times Out" fill="#f59e0b" radius={[3,3,0,0]} opacity={0.8} />}
                    {isVisible("firstGoOut") && <Line dataKey="FirstOut" name="Urge to Go Out" stroke="#ef4444" strokeWidth={2.5} dot={{r:3}} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            {(isVisible("hairDressing") || isVisible("cuttingNails")) && (
              <div className="thr-chart-card">
                <h3 className="thr-chart-title">✂️ Sensory Processing & Grooming Tolerance</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={sensoryData}>
                    <defs>
                      <linearGradient id="sensGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                    <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    {isVisible("cuttingNails") && <Area type="monotone" dataKey="Nails" name="Nail Cutting Coop." stroke="#10b981" fill="url(#sensGrad)" strokeWidth={2.5} />}
                    {isVisible("hairDressing") && <Line type="monotone" dataKey="Haircut" name="Hairdressing Coop." stroke="#3b82f6" strokeWidth={2.5} dot={{r:4}} />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="thr-charts-row">
            <div className="thr-chart-card">
              <h3 className="thr-chart-title">🧠 AI Spectalyzer Score Trend (14 Days)</h3>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={scoreData}>
                  <defs>
                    <linearGradient id="thrScoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                  <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Area type="step" dataKey="Score" name="Therapeutic Base Score" stroke="#8b5cf6" fill="url(#thrScoreGrad)" strokeWidth={2.5} dot={{r:4}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {(isVisible("pushingTendency") || isVisible("glassCrashTendency")) && (
              <div className="thr-chart-card">
                <h3 className="thr-chart-title">💥 Severe Behaviors (Pushing & Glass)</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <ComposedChart data={severeBehaviorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                    <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    {isVisible("pushingTendency") && <Bar dataKey="Pushing" name="Pushing Tendency" fill="#f59e0b" radius={[4,4,0,0]} opacity={0.85} />}
                    {isVisible("glassCrashTendency") && <Line dataKey="GlassCrash" name="Glass Crashing" stroke="#ef4444" strokeWidth={2.5} dot={{r:4}} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="thr-charts-row">
            {(isVisible("toilet") || isVisible("masturbation")) && (
              <div className="thr-chart-card" style={{ flex: 1 }}>
                <h3 className="thr-chart-title">🧻 Hygiene & Developmental Milestones</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={hygieneData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                    <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    {isVisible("toilet") && <Bar dataKey="Toilet" name="Toilet Independence" fill="#06b6d4" radius={[4,4,0,0]} />}
                    {isVisible("masturbation") && <Bar dataKey="Masturbation" name="Masturbation Tendency" fill="#c026d3" radius={[4,4,0,0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

        <div className="thr-chart-card">
          <h3 className="thr-chart-title">📊 Milestone Progress (Manual Update)</h3>
          <div className="thr-milestones">
            {MILESTONES.map(m=>(
              <div key={m.key}>
                <div className="thr-ml-top">
                  <span style={{fontSize:"1.1rem"}}>{m.icon}</span>
                  <span className="thr-ml-label">{m.label}</span>
                  <span className="thr-ml-pct">{milestones[m.key]}%</span>
                </div>
                <div className="thr-ml-bar-bg">
                  <div className="thr-ml-bar" style={{width:`${milestones[m.key]}%`,background:m.color}}/>
                </div>
                <input type="range" min={0} max={100} value={milestones[m.key]}
                  onChange={e=>setMilestones(p=>({...p,[m.key]:Number(e.target.value)}))}
                  className="thr-slider" style={{"--accent":m.color}} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Today's Sessions & Weekly ─── */}
      <div className="thr-two-col">
        <div className="thr-section">
          <h2 className="thr-sec-title">📅 Today's Appointments — <span className="thr-day-tag">{todayDay}</span></h2>
          <div className="thr-sessions-list">
            {todaySessions.map((s,i)=>{
              const t = THERAPY_TYPES[s.type];
              return (
                <div key={i} className="thr-session-card" style={{borderLeftColor:t.color}}>
                  <span className="thr-type-badge" style={{background:`${t.color}20`,color:t.color}}>{s.type}</span>
                  <div style={{flex:1}}>
                    <div className="thr-session-desc">{s.desc}</div>
                    <div className="thr-session-time">{s.time} &nbsp;·&nbsp; {s.room}</div>
                  </div>
                  <div style={{fontSize:".8rem",fontWeight:700,color:"#0f172a",textAlign:"right"}}>{s.patient}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="thr-section">
          <h2 className="thr-sec-title">📅 Weekly Therapy Schedule</h2>
          <div className="thr-week-grid">
            {DAYS.map(day=>(
              <div key={day} className={`thr-wday ${day===todayDay?"thr-wday-today":""}`}>
                <div className="thr-wday-lbl">{day}</div>
                {WEEKLY_SESSIONS[day].map((s,i)=>{
                  const t = THERAPY_TYPES[s.type];
                  return (
                    <div key={i} className="thr-wday-sess" style={{borderLeftColor:t.color}}>
                      <span className="thr-wday-type" style={{color:t.color}}>{s.type}</span>
                      <span className="thr-wday-time">{s.time}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Variable Requests Approval (Therapist only) ─── */}
      {pendingRequests.length > 0 && (
        <div className="thr-section var-req-approval-section">
          <div className="thr-sec-hdr">
            <h2 className="thr-sec-title">⏳ Pending Variable Changes</h2>
            <span className="thr-alert-pill thr-alert-amber">{pendingRequests.length} Requests Awaiting Approval</span>
          </div>
          <div className="var-req-list">
            {pendingRequests.map(req => {
              const teacherApproved = req.teacherApproval?.status === "approved";
              const therapistApproved = req.therapistApproval?.status === "approved";
              
              return (
                <div key={req._id} className="var-req-card">
                  <div className="var-req-info">
                    <div className="var-req-student"><strong>{req.student?.name}</strong> wants to:</div>
                    <div className={`var-req-action-label ${req.action}`}>
                      {req.action === "add" ? "➕ Add" : "➖ Remove"} variable: <strong>{req.variableLabel}</strong>
                    </div>
                    <div className="var-req-date">Requested on {new Date(req.requestedAt).toLocaleDateString()}</div>
                    {teacherApproved && (
                      <div className="var-req-status-inline">✅ Teacher Approved</div>
                    )}
                  </div>
                  <div className="var-req-btns">
                    {therapistApproved ? (
                      <span className="var-req-approved-label">You Approved</span>
                    ) : (
                      <>
                        <button 
                          className="var-approve-btn" 
                          onClick={() => handleReview(req._id, "approved")}
                          disabled={isReviewing}
                        >Approve</button>
                        <button 
                          className="var-reject-btn" 
                          onClick={() => handleReview(req._id, "rejected")}
                          disabled={isReviewing}
                        >Reject</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── My Patients ─── */}
      <div className="thr-section">
        <div className="thr-sec-hdr">
          <h2 className="thr-sec-title">👥 Therapy Caseload</h2>
          <input className="thr-search" placeholder="Search patient…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="thr-admin-note">ℹ️ Caseload assignments are managed by administration. Select a patient to view full behavioral history.</div>
        {isLoading ? <div className="thr-loading">Loading caseload…</div> :
         filtered.length===0 ? <div className="thr-empty"><div>🧑‍⚕️</div><p>No patients assigned.</p></div> : (
          <div className="thr-patient-grid">
            {filtered.map((p,i)=>(
              <div key={p._id||i} className="thr-patient-card">
                <div style={{display:"flex",gap:".75rem",alignItems:"center"}}>
                  <div className="thr-pc-av">{(p.name||"P")[0].toUpperCase()}</div>
                  <div>
                    <div className="thr-pc-name">{p.name}</div>
                    <div className="thr-pc-meta">{p.class||"—"} &nbsp;·&nbsp; {p.school||"—"}</div>
                  </div>
                </div>
                <div className="thr-pc-staff">
                  {p.teacher && <span className="thr-chip thr-chip-blue">👨‍🏫 {p.teacher}</span>}
                  {p.doctor  && <span className="thr-chip thr-chip-red">🩺 {p.doctor}</span>}
                </div>
                <div style={{display:"flex",gap:".4rem",marginTop:".5rem"}}>
                  <button className="thr-graph-btn" onClick={()=>setGraphPatientId(p._id===graphPatientId?null:p._id)} style={{flex:1}}>
                    {p._id===graphPatientId?"📊 Hide":"📊 Graphs"}
                  </button>
                  <button className="thr-view-btn" onClick={()=>setSelectedPatient(p)}>📋 Records</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Session Notes ─── */}
      <div className="thr-section">
        <h2 className="thr-sec-title">📝 Clinical Session Notes</h2>
        <div className="thr-note-editor">
          {graphPatientId && notePatient && (
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"0.5rem 0.85rem",marginBottom:"0.5rem",fontSize:"0.82rem",color:"#16a34a",fontWeight:700,display:"flex",alignItems:"center",gap:"0.4rem"}}>
              ✅ Note will be added for: <strong>{notePatient}</strong>
              <button onClick={()=>setNotePatient("")} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:"0.75rem"}}>Change</button>
            </div>
          )}
          <div className="thr-note-row">
            <select className="thr-select" value={notePatient} onChange={e=>setNotePatient(e.target.value)}>
              <option value="">Select patient…</option>
              {patients.map(p=><option key={p._id} value={p.name}>{p.name}</option>)}
            </select>
            <select className="thr-select thr-sel-type" value={noteType} onChange={e=>setNoteType(e.target.value)}>
              <option value="SLT">SLT — Speech</option>
              <option value="OT">OT — Occupational</option>
              <option value="PT">PT — Physical</option>
            </select>
          </div>
          <textarea className="thr-note-ta" rows={4} placeholder="Session observation, interventions used, response to therapy, homework assigned…" value={noteText} onChange={e=>setNoteText(e.target.value)}/>
          <button className="thr-save-btn" onClick={saveNote}>💾 Save Session Note</button>
        </div>
        <div className="thr-notes-list">
          {sessionNotes.map(n=>{
            const t = THERAPY_TYPES[n.type] || THERAPY_TYPES.SLT;
            return (
              <div key={n.id} className="thr-note-item" style={{borderLeftColor:t.color}}>
                <div className="thr-note-hdr">
                  <span className="thr-note-patient">{n.patient}</span>
                  <span className="thr-type-sm" style={{background:t.color}}>{n.type}</span>
                  <span className="thr-note-date">{n.date}</span>
                </div>
                <p className="thr-note-text">{n.note}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default TherapistDashboard;

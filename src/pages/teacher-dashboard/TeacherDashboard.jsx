import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from "recharts";
import { useGetLoggedUserQuery, useGetMyStudentsQuery, useGetPendingVariableRequestsQuery, useReviewVariableRequestMutation } from "../../services/userAuthApi";
import { getToken } from "../../services/LocalStorageService";
import {
  useGetclassActivityLineChartDataQuery, useGetschoolingPieChartDataQuery,
  useGetcooperateAtSchoolLineChartDataQuery, useGetFoodBarChartDataQuery,
  useGetwakingUpBarChartDataQuery, useGetscreenTimeBarChartDataQuery,
  useGetSleepingLineChartDataQuery, useGetmakingNoiseBarChartDataQuery,
  useGetitemThrowLineChartDataQuery, useGetfoodWaterThrowLineChartDataQuery,
  useGetoutdoorActivityLineChartDataQuery, useGetwalkingLineChartDataQuery,
  useGetoutgoingTendencyLineChartDataQuery, useGetcooperateAtHomeLineChartDataQuery,
  useGetjunkFoodLineChartDataQuery, useGethitWithHandLineChartDataQuery,
  useGetshowingAngerLineChartDataQuery
} from "../../services/graphDataService";
import { useGetFinalScoreQuery } from "../../services/finalScoreService";
import StudentRecordsPanel from "../../components/StudentRecordsPanel/StudentRecordsPanel";
import "./TeacherDashboard.css";

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

const CHART_COLORS = ["#4f46e5","#10b981","#f59e0b","#ef4444","#06b6d4","#8b5cf6","#f97316"];

const WEEKLY_PLAN = {
  SAT:[{time:"10:00",act:"Morning Circle",type:"Group",room:"Rm 101"},{time:"11:15",act:"Behavior Check-In",type:"1-on-1",room:"Rm 102"},{time:"01:00",act:"Free Play",type:"Outdoor",room:"Playground"}],
  SUN:[{time:"10:00",act:"Art & Craft",type:"Creative",room:"Art Room"},{time:"11:15",act:"Social Skills",type:"Group",room:"Rm 101"},{time:"01:00",act:"Physical Activity",type:"Outdoor",room:"Gym"}],
  MON:[{time:"10:00",act:"Literacy",type:"Academic",room:"Rm 101"},{time:"11:15",act:"Motor Skills",type:"Activity",room:"Gym"},{time:"01:00",act:"Music & Rhythm",type:"Creative",room:"Music Rm"}],
  TUE:[{time:"10:00",act:"Math Concepts",type:"Academic",room:"Rm 101"},{time:"11:15",act:"Peer Interaction",type:"Group",room:"Rm 102"},{time:"01:00",act:"Craft Work",type:"Creative",room:"Art Room"}],
  WED:[{time:"10:00",act:"Story Time",type:"Group",room:"Library"},{time:"11:15",act:"Communication",type:"Academic",room:"Rm 101"},{time:"01:00",act:"P.E.",type:"Outdoor",room:"Gym"}],
  THU:[{time:"10:00",act:"Science Activity",type:"Academic",room:"Lab"},{time:"11:15",act:"Daily Living",type:"Life Skills",room:"Rm 103"},{time:"01:00",act:"Cooking Class",type:"Life Skills",room:"Kitchen"}],
  FRI:[{time:"10:00",act:"Weekly Review",type:"Academic",room:"Rm 101"},{time:"11:15",act:"Parent Meetings",type:"Admin",room:"Office"},{time:"01:00",act:"Progress Report",type:"Admin",room:"Office"}],
};

const IEP_GOALS = [
  { goal:"Improve verbal communication", progress:75, owner:"SLT", color:"#4f46e5" },
  { goal:"Reduce disruptive behavior",   progress:60, owner:"Behavior", color:"#ef4444" },
  { goal:"Increase class participation", progress:85, owner:"Teacher", color:"#10b981" },
  { goal:"Self-regulation (transitions)",progress:45, owner:"OT", color:"#f59e0b" },
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
const normFood = raw => {
  const ds = raw?.data?.last7day;
  if (!ds) return [];
  return (ds.labels||[]).map((d,i)=>({ date:d, Breakfast:ds.datasets?.[0]?.data?.[i]??0, Lunch:ds.datasets?.[1]?.data?.[i]??0, Snacks:ds.datasets?.[3]?.data?.[i]??0 }));
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

const TeacherDashboard = () => {
  const token = getToken();
  const { data: loggedUserData } = useGetLoggedUserQuery(token);
  const user = loggedUserData?.user;
  const { data: myData, isLoading } = useGetMyStudentsQuery();
  const students = myData?.data?.students || [];

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [graphStudentId, setGraphStudentId]   = useState(null);
  const [graphDate, setGraphDate] = useState(getLocalDateString);

  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState({});
  const [notes, setNotes] = useState([
    { id:1, student:"General", text:"Class showed excellent cooperation during morning circle.", tag:"Behavior", date:"2026-05-04", tagColor:"#10b981" },
    { id:2, student:"Riya Akter", text:"Riya struggled during outdoor activity — extra support needed tomorrow.", tag:"Alert", date:"2026-05-03", tagColor:"#ef4444" },
    { id:3, student:"Ahmed Hassan", text:"Ahmed made great progress in communication exercises today.", tag:"Progress", date:"2026-05-02", tagColor:"#4f46e5" },
  ]);
  const [noteText, setNoteText] = useState("");
  const [noteStudent, setNoteStudent] = useState("");
  const [noteTag, setNoteTag] = useState("Progress");

  useEffect(() => {
    if (!graphStudentId && students.length > 0) {
      setGraphStudentId(students[0]._id);
    }
  }, [students, graphStudentId]);

  // Auto-populate noteStudent when graphStudentId changes
  useEffect(() => {
    if (graphStudentId) {
      const found = students.find(s => s._id === graphStudentId);
      if (found) setNoteStudent(found.name);
    }
  }, [graphStudentId, students]);

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
    if (!graphStudentId) return true; // Show all for "Class Average"
    const student = students.find(s => s._id === graphStudentId);
    const tracked = student?.trackedVariables || [];
    if (tracked.length === 0) return DEFAULT_VARIABLES.includes(key);
    return tracked.includes(key);
  };

  const args = graphStudentId ? { userId: graphStudentId, selectedDate: graphDate } : undefined;
  const { data: classActRaw }  = useGetclassActivityLineChartDataQuery(args);
  const { data: schoolingRaw } = useGetschoolingPieChartDataQuery(args);
  const { data: coopRaw }      = useGetcooperateAtSchoolLineChartDataQuery(args);
  const { data: foodRaw }      = useGetFoodBarChartDataQuery(args);
  const { data: wakeRaw }      = useGetwakingUpBarChartDataQuery(args);
  const { data: screenRaw }    = useGetscreenTimeBarChartDataQuery(args);
  const { data: sleepRaw }     = useGetSleepingLineChartDataQuery(args);
  
  const { data: noiseRaw }     = useGetmakingNoiseBarChartDataQuery(args);
  const { data: throwObjRaw }  = useGetitemThrowLineChartDataQuery(args);
  const { data: throwFoodRaw } = useGetfoodWaterThrowLineChartDataQuery(args);
  const { data: outdoorRaw }   = useGetoutdoorActivityLineChartDataQuery(args);
  const { data: walkingRaw }   = useGetwalkingLineChartDataQuery(args);
  const { data: outgoingRaw }  = useGetoutgoingTendencyLineChartDataQuery(args);
  const { data: coopHomeRaw }  = useGetcooperateAtHomeLineChartDataQuery(args);
  const { data: junkFoodRaw }  = useGetjunkFoodLineChartDataQuery(args);
  const { data: hitHandRaw }   = useGethitWithHandLineChartDataQuery(args);
  const { data: angerRaw }     = useGetshowingAngerLineChartDataQuery(args);
  const { data: finalScoreRaw } = useGetFinalScoreQuery(args);

  const actData    = normLine(classActRaw);
  const schoolData = normPie(schoolingRaw);
  const coopData   = normLine(coopRaw);
  const foodData   = normFood(foodRaw);
  const wakeData   = normLine(wakeRaw);
  const screenData = normLine(screenRaw);
  const sleepData  = normLine(sleepRaw);

  const noiseData     = normLine(noiseRaw);
  const throwObjData  = normLine(throwObjRaw);
  const throwFoodData = normLine(throwFoodRaw);
  const outdoorData   = normLine(outdoorRaw);
  const walkingData   = normLine(walkingRaw);
  const outgoingData  = normLine(outgoingRaw);
  const coopHomeData  = normLine(coopHomeRaw);
  const junkFoodData  = normLine(junkFoodRaw);
  const hitHandData   = normLine(hitHandRaw);
  const angerData     = normLine(angerRaw);

  const rawScores = finalScoreRaw?.data || [];
  const scoreData = rawScores.slice(-14).map(s => ({ date: s.date ? new Date(s.date).toISOString().split('T')[0] : "", Score: s.finalScore ?? 0 }));

  const radarData = IEP_GOALS.map(g=>({ subject:g.owner, value:g.progress }));
  const screenVsSleep = screenData.map((d,i)=>({ date:d.date, ScreenTime:d.value, Sleep:sleepData[i]?.value??0 }));
  const disruptData = noiseData.map((d,i)=>({ date:d.date, Noise:d.value, ItemThrow:throwObjData[i]?.value??0, FoodThrow:throwFoodData[i]?.value??0 }));
  const movementData = outdoorData.map((d,i)=>({ date:d.date, Outdoor:d.value, Walking:walkingData[i]?.value??0, Elopement:outgoingData[i]?.value??0 }));
  const coopComparisonData = coopHomeData.map((d,i)=>({ date:d.date, Home:d.value, School:coopData[i]?.value??0 }));
  const behaviorData = angerData.map((d,i)=>({ date:d.date, Anger:d.value, Hitting:hitHandData[i]?.value??0 }));

  const toggleAtt = (id,v) => setAttendance(p=>({...p,[id]:p[id]===v?undefined:v}));
  const saveNote = () => {
    if(noteText.trim()){
      const colors = { Progress:"#4f46e5", Alert:"#ef4444", Behavior:"#10b981", General:"#64748b" };
      setNotes(p=>[{ id:Date.now(), student:noteStudent||"General", text:noteText, tag:noteTag, date:today, tagColor:colors[noteTag] },...p]);
      setNoteText("");
    }
  };

  const filtered = students.filter(s=>s.name?.toLowerCase().includes(search.toLowerCase()));
  const pCnt = Object.values(attendance).filter(v=>v==="present").length;
  const aCnt = Object.values(attendance).filter(v=>v==="absent").length;
  const lCnt = Object.values(attendance).filter(v=>v==="late").length;
  const tPlan = WEEKLY_PLAN[todayDay] || WEEKLY_PLAN.MON;
  const selName = graphStudentId ? (students.find(s=>s._id===graphStudentId)?.name||"Student") : "Class Average";

  return (
    <div className="td teacher-theme">
      {selectedStudent && <StudentRecordsPanel student={selectedStudent} onClose={()=>setSelectedStudent(null)} role="teacher" />}

      {/* ─── Header ─── */}
      <div className="td-hdr">
        <div>
          <span className="td-badge">👨‍🏫 Teacher Dashboard</span>
          <h1 className="td-title">Classroom Performance & Attendance</h1>
          <p className="td-sub">{user?.name||"Teacher"} &nbsp;·&nbsp; {user?.school||"School"} &nbsp;·&nbsp; {DAY_NAMES[new Date().getDay()]}, {today}</p>
        </div>
        <div className="td-hdr-info">
          <div className="td-hdr-pill">🏫 Room 101</div>
          <div className="td-hdr-pill">👥 {students.length} Students Assigned</div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="td-stats">
        {[
          { icon:"👨‍🎓", val:students.length, label:"Total Students", cls:"td-s-indigo" },
          { icon:"✅", val:pCnt, label:"Present Today", cls:"td-s-green" },
          { icon:"❌", val:aCnt, label:"Absent Today", cls:"td-s-red" },
          { icon:"🕐", val:lCnt, label:"Late Arrivals", cls:"td-s-amber" },
          { icon:"📅", val:tPlan.length, label:"Classes Today", cls:"td-s-teal" },
          { icon:"📝", val:notes.length, label:"Class Notes", cls:"td-s-purple" },
        ].map((s,i)=>(
          <div key={i} className={`td-stat ${s.cls}`}>
            <div className="td-si">{s.icon}</div>
            <div><div className="td-sv">{s.val}</div><div className="td-sl">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="td-quick-actions">
        <button className="td-qa-btn"><span className="td-qa-icon">✅</span> Mark All Present</button>
        <button className="td-qa-btn"><span className="td-qa-icon">📝</span> Add Class Note</button>
        <button className="td-qa-btn"><span className="td-qa-icon">📊</span> Export Attendance</button>
        <button className="td-qa-btn"><span className="td-qa-icon">👨‍👩‍👧</span> Message Parents</button>
      </div>

      {/* ─── Graph Selector ─── */}
      <div className="td-graph-selector">
        <div className="td-gs-item">
          <span className="td-gs-label">📊 Analytics View:</span>
          <select className="td-gs-select" value={graphStudentId||""} onChange={e=>setGraphStudentId(e.target.value||null)}>
            <option value="">Class Average (All Students)</option>
            {students.map(s=><option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        
        {graphStudentId && (
          <div className="td-gs-item">
            <span className="td-gs-label">📅 Analytics Date:</span>
            <input 
              type="date" 
              className="td-gs-date" 
              value={graphDate} 
              onChange={e=>setGraphDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        )}
        <span className="td-gs-badge">📋 {selName}</span>
      </div>

      {/* ─── Charts Row 1 ─── */}
      <div className="td-charts-row">
        {isVisible("classActivity") && (
          <div className="td-chart-card">
            <h3 className="td-chart-title">📚 Class Activity & Participation Trend</h3>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={actData}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="value" name="Activity Score" stroke="#4f46e5" fill="url(#actGrad)" strokeWidth={2.5} dot={{r:4}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {isVisible("schooling") && (
          <div className="td-chart-card">
            <h3 className="td-chart-title">🏫 Schooling Environment Preference</h3>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={schoolData} cx="50%" cy="50%" outerRadius={75} innerRadius={35} dataKey="value"
                  label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {schoolData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── Charts Row 2 ─── */}
      <div className="td-charts-row">
        {(isVisible("cooperateAtSchool") || isVisible("wakingUp")) && (
          <div className="td-chart-card">
            <h3 className="td-chart-title">🤝 Cooperation at School vs Wake Difficulty</h3>
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={coopData.map((d,i)=>({date:d.date,Coop:d.value,Wake:wakeData[i]?.value??0}))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Bar dataKey="Wake" name="Wake Difficulty" fill="#f59e0b" radius={[3,3,0,0]} opacity={0.8} barSize={20} />
                <Line dataKey="Coop" name="Cooperation" stroke="#10b981" strokeWidth={2.5} dot={{r:4}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {(isVisible("screenTime") || isVisible("overnightSleeping")) && (
          <div className="td-chart-card">
            <h3 className="td-chart-title">📱 Screen Time vs Sleep Impact</h3>
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={screenVsSleep}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                <YAxis tick={{fill:"#94a3b8",fontSize:11}} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Bar dataKey="ScreenTime" name="Screen Time (hrs)" fill="#06b6d4" radius={[3,3,0,0]} />
                <Line dataKey="Sleep" name="Sleep (hrs)" stroke="#8b5cf6" strokeWidth={2.5} dot={{r:4}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── Charts Row 3 ─── */}
      <div className="td-charts-row">
        {(isVisible("lunch") || isVisible("breakfast") || isVisible("eveningSnacks")) && (
          <div className="td-chart-card">
            <h3 className="td-chart-title">🍽️ School Meals Consumed</h3>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={foodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{fontSize:11}} />
                <Bar dataKey="Breakfast" fill="#f97316" radius={[3,3,0,0]} />
                <Bar dataKey="Lunch" fill="#22c55e" radius={[3,3,0,0]} />
                <Bar dataKey="Snacks" fill="#4f46e5" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="td-chart-card">
          <h3 className="td-chart-title">🎯 IEP Goals Overview (Radar)</h3>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{fill:"#64748b",fontSize:10}} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:"#94a3b8",fontSize:9}} />
              <Radar name={selName} dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip content={<Tip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── NEW: DEEP DIVE ACADEMIC/BEHAVIORAL CHARTS ─── */}
      {graphStudentId && (
        <>
          <div className="td-section">
            <div className="td-sec-hdr" style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>
              <h2 className="td-sec-title">🧠 Academic & Behavioral Deep Dive Profile: {selName}</h2>
              <span className="td-alert-pill td-alert-purple">Student-Specific Analytics</span>
            </div>
          </div>
          
          <div className="td-charts-row">
            {(isVisible("makingNoise") || isVisible("itemThrowTendency") || isVisible("foodWaterThrowTendency")) && (
              <div className="td-chart-card">
                <h3 className="td-chart-title">📢 Disruptive Behavior (Noise, Throwing)</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={disruptData}>
                    <defs>
                      <linearGradient id="noiseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                    <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    {isVisible("makingNoise") && <Area type="monotone" dataKey="Noise" name="Making Noise" stroke="#ef4444" fill="url(#noiseGrad)" strokeWidth={2.5} dot={{r:3}} />}
                    {isVisible("itemThrowTendency") && <Line type="monotone" dataKey="ItemThrow" name="Throwing Items" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{r:3}} />}
                    {isVisible("foodWaterThrowTendency") && <Line type="monotone" dataKey="FoodThrow" name="Throwing Food/Water" stroke="#06b6d4" strokeWidth={2} dot={{r:3}} />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            {(isVisible("outdoorActivity") || isVisible("walking") || isVisible("outgoingTendency")) && (
              <div className="td-chart-card">
                <h3 className="td-chart-title">🏃 Activity & Elopement Risk</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <ComposedChart data={movementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#94a3b8",fontSize:10}} />
                    <YAxis tick={{fill:"#94a3b8",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    {isVisible("outdoorActivity") && <Bar dataKey="Outdoor" name="Outdoor Activity" fill="#10b981" radius={[3,3,0,0]} opacity={0.8} />}
                    {isVisible("walking") && <Line dataKey="Walking" name="Pacing/Walking" stroke="#8b5cf6" strokeWidth={2.5} dot={{r:3}} />}
                    {isVisible("outgoingTendency") && <Line dataKey="Elopement" name="Running Away" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="3 3" dot={{r:4}} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="td-charts-row">
            {(isVisible("cooperateAtHome") || isVisible("cooperateAtSchool")) && (
              <div className="td-chart-card">
                <h3 className="td-chart-title">🤝 Cooperation: Home vs School</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={coopComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:10}} />
                    <YAxis tick={{fill:"#64748b",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    {isVisible("cooperateAtHome") && <Line type="monotone" dataKey="Home" name="Cooperation at Home" stroke="#3b82f6" strokeWidth={2.5} dot={{r:3}} />}
                    {isVisible("cooperateAtSchool") && <Line type="monotone" dataKey="School" name="Cooperation at School" stroke="#10b981" strokeWidth={2.5} dot={{r:3}} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {isVisible("junkFood") && (
              <div className="td-chart-card">
                <h3 className="td-chart-title">🍔 Junk Food Consumption Impact</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={junkFoodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:10}} />
                    <YAxis tick={{fill:"#64748b",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    <Bar dataKey="value" name="Junk Food Frequency" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="td-charts-row">
            <div className="td-chart-card">
              <h3 className="td-chart-title">🧠 AI Spectalyzer Score Trend</h3>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={scoreData}>
                  <defs>
                    <linearGradient id="tScoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:10}} />
                  <YAxis tick={{fill:"#64748b",fontSize:11}} domain={[0,10]} />
                  <Tooltip content={<Tip />} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Area type="step" dataKey="Score" name="Overall Spectalyzer Score" stroke="#4f46e5" fill="url(#tScoreGrad)" strokeWidth={2.5} dot={{r:4}} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {(isVisible("showingAnger") || isVisible("hitWithHand")) && (
              <div className="td-chart-card">
                <h3 className="td-chart-title">⚠️ Behavioral Baseline (Anger & Hitting)</h3>
                <ResponsiveContainer width="100%" height={210}>
                  <ComposedChart data={behaviorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:10}} />
                    <YAxis tick={{fill:"#64748b",fontSize:11}} domain={[0,10]} />
                    <Tooltip content={<Tip />} />
                    <Legend wrapperStyle={{fontSize:11}} />
                    {isVisible("showingAnger") && <Bar dataKey="Anger" fill="#ef4444" radius={[4,4,0,0]} opacity={0.85} />}
                    {isVisible("hitWithHand") && <Line dataKey="Hitting" stroke="#8b5cf6" strokeWidth={2.5} dot={{r:4}} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── Schedule & IEP Goals ─── */}
      <div className="td-two-col">
        <div className="td-section">
          <h2 className="td-sec-title">📅 Today's Class Schedule — <span className="td-day-badge">{todayDay}</span></h2>
          <div className="td-sched-list">
            {tPlan.map((s,i)=>(
              <div key={i} className="td-sched-item">
                <div className="td-sched-icon">⏰</div>
                <div style={{flex:1}}>
                  <div className="td-sched-act">{s.act}</div>
                  <div className="td-sched-time">{s.time} &nbsp;·&nbsp; {s.room}</div>
                </div>
                <div className="td-sched-type" style={{background:"#e0e7ff",color:"#4338ca"}}>{s.type}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="td-section">
          <h2 className="td-sec-title">🎯 Class IEP Goals Progress</h2>
          <div className="td-iep-list">
            {IEP_GOALS.map((g,i)=>(
              <div key={i} className="td-iep-item">
                <div className="td-iep-top">
                  <span className="td-iep-goal">{g.goal}</span>
                  <span className="td-iep-owner" style={{background:`${g.color}20`,color:g.color}}>{g.owner}</span>
                  <span className="td-iep-pct" style={{color:g.color}}>{g.progress}%</span>
                </div>
                <div className="td-iep-bar-bg">
                  <div className="td-iep-bar" style={{width:`${g.progress}%`,background:g.color}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Variable Requests removed - Therapist only feature */}

      {/* ─── Students ─── */}
      <div className="td-section">
        <div className="td-sec-hdr">
          <h2 className="td-sec-title">👨‍🎓 Student Attendance & Roster</h2>
          <input className="td-search" placeholder="Search student…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="td-admin-note">ℹ️ Student assignments are managed by administration. Use the buttons below to log daily attendance.</div>
        {isLoading ? <div className="td-loading">Loading roster…</div> :
         filtered.length===0 ? <div className="td-empty"><div>👨‍🎓</div><p>No students assigned.</p></div> : (
          <div className="td-student-list">
            {filtered.map((s,i)=>{
              const att = attendance[s._id];
              return (
                <div key={s._id||i} className={`td-student-row ${att==="absent"?"td-row-absent":att==="present"?"td-row-present":""}`}>
                  <div className="td-st-left">
                    <div className="td-st-num">{i+1}</div>
                    <div className="td-st-av">{(s.name||"S")[0].toUpperCase()}</div>
                    <div>
                      <div className="td-st-name">{s.name}</div>
                      <div className="td-st-meta">{s.class||"—"} &nbsp;·&nbsp; IEP Active</div>
                    </div>
                  </div>
                  <div className="td-st-right">
                    <div className="td-att-btns">
                      <button className={`td-att ${att==="present"?"td-att-p":""}`} onClick={()=>toggleAtt(s._id,"present")}>✅ Present</button>
                      <button className={`td-att ${att==="late"?"td-att-l":""}`}    onClick={()=>toggleAtt(s._id,"late")}>🕐 Late</button>
                      <button className={`td-att ${att==="absent"?"td-att-a":""}`}  onClick={()=>toggleAtt(s._id,"absent")}>❌ Absent</button>
                    </div>
                    <div className="td-chips" style={{margin:"0 .5rem"}}>
                      {s.therapist && <span className="td-chip td-chip-green">🧑‍⚕️ {s.therapist}</span>}
                    </div>
                    <div style={{display:"flex",gap:".4rem"}}>
                      <button className="td-graph-btn" onClick={()=>setGraphStudentId(s._id===graphStudentId?null:s._id)}>
                        {s._id===graphStudentId?"📊 Hide":"📊 Graphs"}
                      </button>
                      <button className="td-view-btn" onClick={()=>setSelectedStudent(s)}>📋 Records</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Notes & Week Plan ─── */}
      <div className="td-two-col">
        <div className="td-section">
          <h2 className="td-sec-title">📝 Daily Class Notes</h2>
          <div className="td-note-editor">
            {graphStudentId && noteStudent && (
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"0.5rem 0.85rem",marginBottom:"0.5rem",fontSize:"0.82rem",color:"#16a34a",fontWeight:700,display:"flex",alignItems:"center",gap:"0.4rem"}}>
                ✅ Note will be added for: <strong>{noteStudent}</strong>
                <button onClick={()=>setNoteStudent("")} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:"0.75rem"}}>Change</button>
              </div>
            )}
            <div style={{display:"flex", gap:"0.5rem", marginBottom:"0.5rem"}}>
              <select className="td-note-select" value={noteStudent} onChange={e=>setNoteStudent(e.target.value)} style={{flex:1}}>
                <option value="">Select student (optional)…</option>
                {students.map(s=><option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
              <select className="td-note-select" value={noteTag} onChange={e=>setNoteTag(e.target.value)} style={{flex:1}}>
                <option>Progress</option><option>Alert</option><option>Behavior</option><option>General</option>
              </select>
            </div>
            <textarea className="td-note-ta" rows={3} placeholder="Add observation, incident report, or parent note…" value={noteText} onChange={e=>setNoteText(e.target.value)}/>
            <button className="td-save-note" onClick={saveNote}>💾 Save Note</button>
          </div>
          <div className="td-notes-list">
            {notes.map(n=>(
              <div key={n.id} className="td-note-item" style={{borderLeftColor:n.tagColor}}>
                <div className="td-note-hdr">
                  <span style={{fontSize:"0.85rem",fontWeight:700,color:"#0f172a"}}>{n.student}</span>
                  <span className="td-note-tag" style={{background:n.tagColor, marginLeft:"0.5rem"}}>{n.tag}</span>
                  <span className="td-note-date" style={{marginLeft:"auto"}}>{n.date}</span>
                </div>
                <p className="td-note-text">{n.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="td-section">
          <h2 className="td-sec-title">📅 Weekly Lesson Plan</h2>
          <div className="td-week-grid">
            {DAYS.map(day=>(
              <div key={day} className={`td-wday ${day===todayDay?"td-wday-today":""}`}>
                <div className="td-wday-lbl">{day}</div>
                {WEEKLY_PLAN[day].map((s,i)=>(
                  <div key={i} className="td-wday-act">{s.time} - {s.act.split(" ")[0]}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default TeacherDashboard;

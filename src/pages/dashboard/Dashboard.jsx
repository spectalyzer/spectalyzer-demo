import React, { useState, useEffect, useMemo, useRef } from "react";
import "../dashboard/Dashboard.css";
import Footer from "../../components/footer/Footer";
import AdminDashboard from "../admin-dashboard/AdminDashboard";
import { useGetLoggedUserQuery, useGetStudentProfileQuery } from "../../services/userAuthApi";
import { getUserRole, hasAnyRole } from "../../services/tokenService";
import { useGetStudentsQuery } from "../../services/studentsApi";
import {
  useGetSleepingLineChartDataQuery,
  useGetscreenTimeBarChartDataQuery,
  useGetmakingNoiseBarChartDataQuery,
  useGetwalkingLineChartDataQuery,
  useGetwakingUpBarChartDataQuery,
  useGetfirstGoOutLineChartDataQuery,
  useGetcooperateAtHomeLineChartDataQuery,
  useGetcooperateAtSchoolLineChartDataQuery,
  useGetitemThrowLineChartDataQuery,
  useGetfoodWaterThrowLineChartDataQuery,
  useGetoutgoingTendencyLineChartDataQuery,
  useGetoutgoingCountLineChartDataQuery,
  useGetrequiredSleepTimeLineChartDataQuery,
  useGetpushingTendencyLineChartDataQuery,
  useGethitWithHandLineChartDataQuery,
  useGethitWithHeadLineChartDataQuery,
  useGetglassCrashLineChartDataQuery,
  useGettoiletLineChartDataQuery,
  useGetmasturbationLineChartDataQuery,
  useGetshowingAngerLineChartDataQuery,
  useGetcuttingNailsLineChartDataQuery,
  useGethairDressingLineChartDataQuery,
  useGetsicknessDoughnutChartDataQuery,
  useGettherapyTypeDoughnutChartDataQuery,
  useGetbedwettingDoughnutChartDataQuery,
  useGetgoingToSleepBarChartDataQuery,
  useGetclassActivityLineChartDataQuery,
  useGetoutdoorActivityLineChartDataQuery,
  useGetschoolingPieChartDataQuery,
  useGetAllCustomVariablesChartDataQuery,
} from "../../services/graphDataService";
import TherapyCalendar from "../../components/therapy/TherapyCalendar";

import { useGetFinalScoreQuery } from "../../services/finalScoreService";
import { useGetUserEntriesQuery } from "../../services/getEntries";
import { ASSESSMENT_FACTOR_GROUPS } from "../../constants/assessmentFactors";

const Dashboard = () => {
  const trace = () => {};
  useEffect(() => {
    trace("mount", { resolvedStudentId, currentPageDefsKey });
    return () => {
      trace("unmount", { resolvedStudentId, currentPageDefsKey });
    };
  }, []);

  const token = localStorage.getItem("token");
  const queryParams = new URLSearchParams(window.location.search);
  const queryUserId = queryParams.get("userId") || undefined;
  const queryStudentName = queryParams.get("studentName") || "";

  const role = getUserRole();
  // Redirect admins to AdminDashboard ONLY if no specific student (userId) is requested
  if ((role === "admin" || role === "superadmin") && !queryUserId) {
    return <AdminDashboard />;
  }

  const { data: loggedUserData, isSuccess } = useGetLoggedUserQuery(token);
  const resolvedStudentId = queryUserId || (role === "student" ? loggedUserData?.user?._id : undefined);
  const { data: studentProfileData } = useGetStudentProfileQuery(resolvedStudentId, { skip: !resolvedStudentId });
  const studentProfile = studentProfileData?.data;

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const shiftLocalDate = (isoDate, deltaDays) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-").map(Number);
    if (!year || !month || !day) return "";
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + deltaDays);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
    const nextDay = String(date.getDate()).padStart(2, "0");
    return `${nextYear}-${nextMonth}-${nextDay}`;
  };

  const normalizeDateOnly = (value) => {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isDateWithinSelectedRange = (value, startDate, endDate) => {
    const normalized = normalizeDateOnly(value);
    if (!normalized || !startDate || !endDate) return false;
    return normalized >= startDate && normalized <= endDate;
  };

  const sliceSeriesToSelectedRange = (series, startDate, endDate) => {
    if (!series || !Array.isArray(series.labels)) return series;
    const labelDates = series.labels.map((label) => normalizeDateOnly(label));
    const hasDateLabels = labelDates.some(Boolean);
    if (!hasDateLabels) return series;

    const keepIndices = labelDates
      .map((labelDate, index) => (isDateWithinSelectedRange(labelDate, startDate, endDate) ? index : -1))
      .filter((index) => index >= 0);

    if (!keepIndices.length) return series;

    return {
      ...series,
      labels: keepIndices.map((index) => series.labels[index]),
      datasets: (series.datasets || []).map((dataset) => ({
        ...dataset,
        data: keepIndices.map((index) => dataset?.data?.[index]),
      })),
    };
  };

  const getDateRangeDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return Math.max(1, diffDays);
  };

  const normalizeRange = (startDate, endDate) => {
    if (!startDate || !endDate) return { startDate, endDate };
    return startDate <= endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate };
  };

  const [userData, setUserData] = useState({ id: "", name: "" });
  const [activeDate, setActiveDate] = useState(getLocalDateString);
  const [selectedDate, setSelectedDate] = useState(() => shiftLocalDate(getLocalDateString(), -29));
  const maxLookbackDays = 29;
  // range in days for charts, derived from the selected date interval
  const rangeDays = useMemo(() => getDateRangeDays(selectedDate, activeDate), [selectedDate, activeDate]);
  const rangeLimitStartDate = useMemo(() => shiftLocalDate(activeDate, -maxLookbackDays), [activeDate]);
  const startOffsetDays = useMemo(() => {
    if (!selectedDate || !activeDate) return 0;
    const start = new Date(`${selectedDate}T00:00:00`);
    const end = new Date(`${activeDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(maxLookbackDays, diffDays));
  }, [selectedDate, activeDate, maxLookbackDays]);
  const sliderStartDate = selectedDate;
  const sliderEndDate = activeDate;
  const [chartPage, setChartPage] = useState(0);
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [showDailyScorePanel, setShowDailyScorePanel] = useState(true);
  // removed graphIndex: show all charts in a grid instead of carousel

  const DEFAULT_VARIABLES = [
    "wakingUp", "firstGoOut", "firstScreenOn", "breakfast", "schooling",
    "classActivity", "outdoorActivity", "therapyAtSchool", "therapyType", "lunch", "eveningSnacks",
    "dinner", "goingToSleep", "gettingSleepTime", "outgoingTendency",
    "outgoingCount", "screenTime", "junkFood", "makingNoise", "walking", "showingAnger",
    "glassCrashTendency", "pushingTendency", "itemThrowTendency", "foodWaterThrowTendency",
    "hitWithHand", "hitWithHead", "cooperateAtSchool", "cooperateAtHome", "cuttingNails",
    "hairDressing", "bedwetting", "regularMedication", "otherSickness", "nameOfSickness",
    "medOtherSickness", "listOfMedicine", "masturbation", "toilet", "overnightSleeping",
    "specialActivity"
  ];

  // YES_NO_CHART_KEYS: these should render as doughnut (counted from entries), NOT as line/bar
  const YES_NO_CHART_KEYS = ["therapyAtSchool", "regularMedication", "medOtherSickness"];
  // Keys already shown in the hardcoded doughnut section — excluded from paginated section
  const HARDCODED_DOUGHNUT_KEYS = ["schooling", "sickness", "therapy", "bedwetting", "overnightSleeping", "otherSickness", "therapyType"];

  const DOUGHNUT_OPTION_MAP = {
    schooling: ["Yes", "No"],
    therapyAtSchool: ["Yes", "No"],
    regularMedication: ["Yes", "No"],
    otherSickness: ["Yes", "No"],
    medOtherSickness: ["Yes", "No"],
    therapyType: ["OT", "PT", "DR", "SLT", "Others"],
    bedwetting: ["0", "1", "2"],
  };

  const behavioralCharts = [
    // ── Numerical 0-10 variables ──────────────────────────────────
    { key: "firstGoOut",             label: "1st Time Want To Go Out",          color: "#06b6d4",  type: "line", yMax: 10, yTitle: "Rating (0-10)" },
    { key: "firstScreenOn",          label: "First Screen On",                  color: "#f472b6",  type: "bar",  yMax: 10 },
    { key: "cooperateAtHome",        label: "Cooperative Attitude at Home",     color: "#16a34a",  type: "line", yMax: 10 },
    { key: "cooperateAtSchool",      label: "Cooperative Attitude at School",   color: "#84cc16",  type: "line", yMax: 10 },
    { key: "classActivity",          label: "Class Activity",                   color: "#6366f1",  type: "line", yMax: 10 },
    { key: "outdoorActivity",        label: "Outdoor Activity",                 color: "#84cc16",  type: "line", yMax: 10 },
    { key: "itemThrowTendency",      label: "Other Item Throwing",              color: "#ef4444",  type: "line", yMax: 10 },
    { key: "foodWaterThrowTendency", label: "Food/Drink Item Throwing",         color: "#f97316",  type: "line", yMax: 10 },
    { key: "outgoingTendency",       label: "Outgoing Tendency",                color: "#0ea5e9",  type: "line", yMax: 10 },
    { key: "outgoingCount",          label: "Number of Outgoing",               color: "#0f766e",  type: "line", yMax: 10 },
    { key: "gettingSleepTime",       label: "Required Time to Get Sleep",       color: "#6366f1",  type: "line", yMax: 10, yTitle: "Hours" },
    { key: "pushingTendency",        label: "Pushing Tendency",                 color: "#db2777",  type: "line", yMax: 10 },
    { key: "hitWithHand",            label: "Hit by Hand",                      color: "#9333ea",  type: "line", yMax: 10 },
    { key: "hitWithHead",            label: "Hit by Head",                      color: "#7c3aed",  type: "line", yMax: 10 },
    { key: "glassCrashTendency",     label: "Glassware Crashing",               color: "#ea580c",  type: "line", yMax: 10 },
    { key: "toilet",                 label: "Toilet",                           color: "#0284c7",  type: "line", yMax: 10 },
    { key: "masturbation",           label: "Inappropriate Behavior",           color: "#c026d3",  type: "line", yMax: 10 },
    { key: "showingAnger",           label: "Showing Anger",                    color: "#b91c1c",  type: "line", yMax: 10 },
    { key: "cuttingNails",           label: "Cooperative with Cutting Nails",   color: "#22c55e",  type: "line", yMax: 10 },
    { key: "hairDressing",           label: "Cooperative with Cutting Hair",    color: "#06b6d4",  type: "line", yMax: 10 },
    { key: "goingToSleep",           label: "Going to Sleep",                   color: "#6610f2",  type: "bar",  yMax: 10 },
    { key: "screenTime",             label: "Screen Time",                      color: "#3f51b5",  type: "bar",  yMax: 10 },
    { key: "makingNoise",            label: "Making Noise",                     color: "#6f42c1",  type: "bar",  yMax: 10 },
    { key: "walking",                label: "Restless Walking",                 color: "#14b8a6",  type: "line", yMax: 10 },
    { key: "junkFood",               label: "Junk Food",                        color: "#f97316",  type: "bar",  yMax: 10 },
    { key: "breakfast",              label: "Breakfast",                        color: "#10b981",  type: "bar",  yMax: 10 },
    { key: "lunch",                  label: "Lunch",                            color: "#22c55e",  type: "bar",  yMax: 10 },
    { key: "dinner",                 label: "Dinner",                           color: "#f59e0b",  type: "bar",  yMax: 10 },
    { key: "eveningSnacks",          label: "Evening Snacks",                   color: "#f59e0b",  type: "bar",  yMax: 10 },
    { key: "bedwetting",             label: "Bedwetting",                       color: "#a855f7",  doughnutLabels: DOUGHNUT_OPTION_MAP.bedwetting },
    // ── Yes/No categorical variables → rendered as doughnut ────────
    { key: "therapyAtSchool",    label: "Therapy at School",    doughnutLabels: DOUGHNUT_OPTION_MAP.therapyAtSchool },
    { key: "regularMedication",  label: "Regular Medication",  doughnutLabels: DOUGHNUT_OPTION_MAP.regularMedication },
    { key: "medOtherSickness",   label: "Medication for Sickness", doughnutLabels: DOUGHNUT_OPTION_MAP.medOtherSickness },
  ].filter(chart => {
    const rawVars = (role === "student" ? loggedUserData?.user?.trackedVariables : studentProfile?.trackedVariables) || [];
    // If empty, show if it's a default variable
    if (rawVars.length === 0) return DEFAULT_VARIABLES.includes(chart.key);
    
    // Auto-include conditional child variables if their parent variable is tracked
    const trackedVars = [...rawVars];
    if (rawVars.includes("regularMedication") && !trackedVars.includes("medicationReason")) trackedVars.push("medicationReason");
    if (rawVars.includes("therapyAtSchool") && !trackedVars.includes("therapyType")) trackedVars.push("therapyType");
    if (rawVars.includes("otherSickness")) {
      if (!trackedVars.includes("nameOfSickness")) trackedVars.push("nameOfSickness");
      if (!trackedVars.includes("medOtherSickness")) trackedVars.push("medOtherSickness");
    }

    return trackedVars.includes(chart.key);
  });

  // Refs for all charts
  const doughnutRefs = useRef([]);
  const pageRefs = useRef([]);
  const dailyScoreRef = useRef(null);
  const overnightLineRef = useRef(null);
  const chartsInitialized = useRef(false);
  const doughnutChartsRef = useRef([]);
  const pageChartsRef = useRef([]);
  const dailyChartRef = useRef(null);
  const overnightChartRef = useRef(null);

  const queryArgs = {
    userId: resolvedStudentId,
    selectedDate: activeDate,
    startDate: selectedDate,
    endDate: activeDate,
    rangeDays,
  };
  const { data: entriesData, isLoading: entriesLoading } = useGetUserEntriesQuery(
    { token, userId: resolvedStudentId },
    { skip: !token || !resolvedStudentId }
  );
  const { data: finalScoreData } = useGetFinalScoreQuery(
    { token, userId: resolvedStudentId, selectedDate: activeDate, startDate: selectedDate, endDate: activeDate, rangeDays },
    { skip: !token || !resolvedStudentId }
  );
  const skipQuery = !token || !resolvedStudentId;
  const { data: schoolingPieData } = useGetschoolingPieChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: sleepingData } = useGetSleepingLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: screenTimeData } = useGetscreenTimeBarChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: noiseData } = useGetmakingNoiseBarChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: walkingData } = useGetwalkingLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: wakingUpData } = useGetwakingUpBarChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: firstGoOutData } = useGetfirstGoOutLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: cooperateAtHomeData } = useGetcooperateAtHomeLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: cooperateAtSchoolData } = useGetcooperateAtSchoolLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: itemThrowData } = useGetitemThrowLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: foodWaterThrowData } = useGetfoodWaterThrowLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: outgoingTendencyData } = useGetoutgoingTendencyLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: outgoingCountData } = useGetoutgoingCountLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: requiredSleepTimeData } = useGetrequiredSleepTimeLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: pushingTendencyData } = useGetpushingTendencyLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: hitWithHandData } = useGethitWithHandLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: hitWithHeadData } = useGethitWithHeadLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: glassCrashData } = useGetglassCrashLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: toiletData } = useGettoiletLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: masturbationData } = useGetmasturbationLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: showingAngerData } = useGetshowingAngerLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: cuttingNailsData } = useGetcuttingNailsLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: hairDressingData } = useGethairDressingLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: sicknessDoughnutData } = useGetsicknessDoughnutChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: therapyDoughnutData } = useGettherapyTypeDoughnutChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: bedwettingDoughnutData } = useGetbedwettingDoughnutChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: goingToSleepData } = useGetgoingToSleepBarChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: classActivityData } = useGetclassActivityLineChartDataQuery(queryArgs, { skip: skipQuery });
  const { data: outdoorActivityData } = useGetoutdoorActivityLineChartDataQuery(queryArgs, { skip: skipQuery });

  const { data: allCustomVarData } = useGetAllCustomVariablesChartDataQuery(
    { userId: resolvedStudentId, selectedDate: activeDate, rangeDays },
    { skip: !token || !resolvedStudentId }
  );
  const customVarChartData = allCustomVarData?.data || {};

  // (removed verbose debug logging)
  
  // Custom keys are keys from the backend data PLUS any newly tracked variables that don't have data yet
  const rawTrackedVarsRaw = (role === "student" ? loggedUserData?.user?.trackedVariables : studentProfile?.trackedVariables) || [];
  const rawTrackedVars = rawTrackedVarsRaw.length === 0 ? [] : (() => {
    const vars = [...rawTrackedVarsRaw];
    if (rawTrackedVarsRaw.includes("regularMedication") && !vars.includes("medicationReason")) vars.push("medicationReason");
    if (rawTrackedVarsRaw.includes("therapyAtSchool") && !vars.includes("therapyType")) vars.push("therapyType");
    if (rawTrackedVarsRaw.includes("otherSickness")) {
      if (!vars.includes("nameOfSickness")) vars.push("nameOfSickness");
      if (!vars.includes("medOtherSickness")) vars.push("medOtherSickness");
    }
    return vars;
  })();
  const TIME_KEYS = [];

  const customVarKeys = (() => {
    const activeVars = rawTrackedVars.length === 0 ? DEFAULT_VARIABLES : rawTrackedVars;
    return activeVars.filter(key => {
      if (behavioralCharts.find(c => c.key === key)) return false;
      
      if (TIME_KEYS.includes(key)) return true;

      let isText = false;
      for (const group of ASSESSMENT_FACTOR_GROUPS) {
        const factor = group.factors.find(f => f.key === key);
        if (factor && (factor.type === "text" || factor.type === "textarea")) {
          isText = true;
          break;
        }
      }
      return !isText;
    });
  })();

  // Note: doughnut datasets use the selected range via `queryArgs` (do not fetch all-time here)

  // Students query for therapist/teacher/admin
  const { data: studentsData } = useGetStudentsQuery(
    { search: "", page: 1, limit: 100 },
    { skip: !hasAnyRole(["therapist", "doctor", "teacher", "admin", "superadmin"]) }
  );
  const students = studentsData?.data?.students || [];
  const viewedStudent = resolvedStudentId
    ? students.find((student) => String(student._id) === String(resolvedStudentId))
    : null;
  const viewedStudentName = queryStudentName || viewedStudent?.name || (role === "student" ? loggedUserData?.user?.name || "" : "");

  const doughnutCharts = [
    {
      key: "schooling",
      title: "Count of Schooling",
    },
    {
      key: "sickness",
      title: "Sickness",
    },
    {
      key: "therapy",
      title: "Therapy Type",
    },
    {
      key: "bedwetting",
      title: "Bedwetting",
    },
  ];

  const chartPalette = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7", "#ef4444", "#14b8a6"];

  const CHARTS_PER_PAGE = 6;
  // Combine all filtered behavioral charts + custom variable chart definitions into one flat list
  const allChartDefs = useMemo(() => {
    const customDefs = customVarKeys.map((key, idx) => {
      // Look up in ASSESSMENT_FACTOR_GROUPS to determine fixed doughnut labels
      let doughnutLabels = null;
      for (const group of ASSESSMENT_FACTOR_GROUPS) {
        const factor = group.factors.find(f => f.key === key);
        if (factor) {
          if (factor.type === "yesno") {
            doughnutLabels = ["Yes", "No"];
          } else if (factor.type === "select") {
            doughnutLabels = factor.options || DOUGHNUT_OPTION_MAP[key] || [];
          }
          break;
        }
      }
      const isTime = TIME_KEYS.includes(key);
      const isDoughnut = Array.isArray(doughnutLabels) && doughnutLabels.length > 0;
      return {
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        color: chartPalette[idx % chartPalette.length],
        type: isDoughnut ? undefined : 'line',
        yMax: isDoughnut ? undefined : (isTime ? 24 : 10),
        doughnutLabels,
        isCustom: true,
      };
    });
    return [...behavioralCharts, ...customDefs];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [behavioralCharts.map(c => c.key).join(','), customVarKeys.join(',')]);

  // Category helper to map variable key to a class in ASSESSMENT_FACTOR_GROUPS
  const getCategoryForVariable = (key) => {
    for (const group of ASSESSMENT_FACTOR_GROUPS) {
      const f = group.factors.find(fact =>
        fact.key.toLowerCase() === key.toLowerCase() ||
        fact.label.toLowerCase() === key.toLowerCase().replace(/_/g, " ")
      );
      if (f) return group.category;
    }
    return "🚿 Self-Care"; // catch-all fallback
  };

  // Group tracked numerical and categorical variable charts by category
  // Use normalized key matching to avoid mismatches from underscores/case/spacing
  const chartsByCategory = useMemo(() => {
    const normalize = (s) => (s || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
    const groups = {};

    // Initialize groups from ASSESSMENT_FACTOR_GROUPS so we preserve ordering
    ASSESSMENT_FACTOR_GROUPS.forEach(g => {
      groups[g.category] = [];
    });

    // Fallback group
    if (!groups["🚿 Self-Care"]) groups["🚿 Self-Care"] = [];

    allChartDefs.forEach(def => {
      const dk = normalize(def.key);
      const dlabel = normalize(def.label);
      let placed = false;

      for (const group of ASSESSMENT_FACTOR_GROUPS) {
        for (const factor of group.factors || []) {
          const fk = normalize(factor.key);
          const fl = normalize(factor.label);
          if (fk === dk || fl === dk || fk === dlabel) {
            groups[group.category].push(def);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }

      if (!placed) {
        groups["🚿 Self-Care"].push(def);
      }
    });

    return groups;
  }, [allChartDefs]);

  // Sorted active categories order based on standard category sequence
  const activeCategories = useMemo(() => {
    return ASSESSMENT_FACTOR_GROUPS.map(g => g.category).filter(cat => chartsByCategory[cat]?.length > 0);
  }, [chartsByCategory]);

  const safeCatIndex = Math.min(activeCatIndex, Math.max(0, activeCategories.length - 1));
  const currentCategory = activeCategories[safeCatIndex] || null;
  const currentCategoryCharts = currentCategory ? (chartsByCategory[currentCategory] || []) : [];

  // (removed verbose debug logging)

  // no-op: we render all charts in a grid now

  const currentPageDefs = useMemo(() => currentCategoryCharts, [currentCategoryCharts]);
  const currentPageDefsKey = currentPageDefs.map((def) => def.key).join(',');
  const allChartDefsKey = allChartDefs.map(d => d.key).join(',');

  useEffect(() => {
    trace("mount", { resolvedStudentId, currentPageDefsKey });
    return () => {
      trace("unmount", { resolvedStudentId, currentPageDefsKey });
    };
  }, []);

  useEffect(() => {
    trace("submenu-navigation", {
      activeCatIndex,
      currentCategory,
      currentPageDefsKey,
    });
  }, [activeCatIndex, currentCategory, currentPageDefsKey]);

  const formatShortDate = (isoDate) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    const parsed = new Date(y, m - 1, d);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const displayValue = (value) => {
    if (value === undefined || value === null || value === "") return "N/A";
    return value;
  };

  const normalizeEntryDate = (entry) => {
    const raw = entry?.dateOfRecord || entry?.createdAt;
    if (!raw) return "";
    // If it's a string starting with YYYY-MM-DD, just take that part directly
    if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
      return raw.substring(0, 10);
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return String(raw).split("T")[0];
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalizeText = (value) => {
    if (value === undefined || value === null) return "";
    return String(value).trim();
  };

  const getLatestNonEmptyValue = (items, valueSelector) => {
    if (!Array.isArray(items) || typeof valueSelector !== "function") return "";
    for (const item of items) {
      const value = normalizeText(valueSelector(item));
      if (value) return value;
    }
    return "";
  };

  const getMostCommonValue = (items, valueSelector) => {
    if (!Array.isArray(items) || typeof valueSelector !== "function") return "";
    const counts = new Map();
    for (const item of items) {
      const value = normalizeText(valueSelector(item));
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    let bestValue = "";
    let bestCount = 0;
    counts.forEach((count, value) => {
      if (count > bestCount) {
        bestCount = count;
        bestValue = value;
      }
    });
    return bestValue;
  };

  const calculateAverage = (items, key) => {
    if (!Array.isArray(items) || !key) return NaN;
    const values = items
      .map((item) => Number(item?.[key] ?? item?.customVariables?.[key]))
      .filter((value) => Number.isFinite(value));
    if (values.length === 0) return NaN;
    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
  };

  const entries = Array.isArray(entriesData?.data) ? entriesData.data : [];
  const entriesInSelectedRange = useMemo(() => {
    const rangeStart = selectedDate && activeDate && selectedDate > activeDate ? activeDate : selectedDate;
    const rangeEnd = selectedDate && activeDate && selectedDate > activeDate ? selectedDate : activeDate;
    if (!rangeStart || !rangeEnd) return entries;
    return entries.filter((entry) => {
      const entryDate = normalizeEntryDate(entry);
      return entryDate >= rangeStart && entryDate <= rangeEnd;
    });
  }, [entries, selectedDate, activeDate]);
  const medicationRows = useMemo(() => {
    return [...entriesInSelectedRange].sort(
      (a, b) => new Date(b.dateOfRecord || b.createdAt) - new Date(a.dateOfRecord || a.createdAt)
    );
  }, [entriesInSelectedRange]);

  const importantInformationSummary = useMemo(() => {
    const selectedRangeSorted = [...entriesInSelectedRange].sort(
      (a, b) => new Date(b.dateOfRecord || b.createdAt) - new Date(a.dateOfRecord || a.createdAt)
    );

    const medicationStatusCounts = selectedRangeSorted.reduce(
      (acc, entry) => {
        const status = normalizeText(entry.regularMedication).toLowerCase();
        if (status === "yes") acc.yes += 1;
        else if (status === "no") acc.no += 1;
        else if (status) acc.other += 1;
        return acc;
      },
      { yes: 0, no: 0, other: 0 }
    );

    return {
      medicationStatusCounts,
      latestMedicationReason: getLatestNonEmptyValue(selectedRangeSorted, (entry) => entry.medicationReason),
      mostCommonSickness: getMostCommonValue(selectedRangeSorted, (entry) => entry.nameOfSickness),
      latestSicknessMedication: getLatestNonEmptyValue(selectedRangeSorted, (entry) => entry.medOtherSickness),
      latestSpecialActivity: getLatestNonEmptyValue(selectedRangeSorted, (entry) => entry.specialActivity),
      latestMedicationStatus: getLatestNonEmptyValue(selectedRangeSorted, (entry) => entry.regularMedication),
      latestMedicineList: getLatestNonEmptyValue(selectedRangeSorted, (entry) => entry.listOfMedicine),
      latestOtherSickness: getLatestNonEmptyValue(selectedRangeSorted, (entry) => entry.otherSickness),
    };
  }, [entriesInSelectedRange]);

  const nutritionAverages = useMemo(() => ({
    junkFood: calculateAverage(entriesInSelectedRange, "junkFood"),
    dinner: calculateAverage(entriesInSelectedRange, "dinner"),
    eveningSnacks: calculateAverage(entriesInSelectedRange, "eveningSnacks"),
    lunch: calculateAverage(entriesInSelectedRange, "lunch"),
    breakfast: calculateAverage(entriesInSelectedRange, "breakfast"),
  }), [entriesInSelectedRange]);

  const nutritionGauges = [
    { id: "gauge-junk-food", label: "Junk Food", value: nutritionAverages.junkFood, color: "#F44336" },
    { id: "gauge-dinner", label: "Dinner", value: nutritionAverages.dinner, color: "#4CAF50" },
    { id: "gauge-evening-snacks", label: "Evening Snacks", value: nutritionAverages.eveningSnacks, color: "#FF9800" },
    { id: "gauge-lunch", label: "Lunch", value: nutritionAverages.lunch, color: "#2196F3" },
    { id: "gauge-breakfast", label: "Breakfast", value: nutritionAverages.breakfast, color: "#9C27B0" },
  ].map((gauge) => ({
    ...gauge,
    hasValue: Number.isFinite(gauge.value),
    displayValue: Number.isFinite(gauge.value) ? Number(gauge.value.toFixed(1)) : 0,
  }));

  const getNutritionRangeLabel = (days) => {
    const normalizedDays = Number(days) || 0;
    return `${normalizedDays} Day${normalizedDays === 1 ? "" : "s"} Average`;
  };

  const getNutritionTheme = (value) => {
    if (!Number.isFinite(value)) {
      return {
        variant: "empty",
        start: "#94a3b8",
        end: "#cbd5e1",
        glow: "rgba(148, 163, 184, 0.22)",
        accent: "#64748b",
      };
    }

    if (value >= 7) {
      return {
        variant: "high",
        start: "#10b981",
        end: "#3b82f6",
        glow: "rgba(59, 130, 246, 0.24)",
        accent: "#22c55e",
      };
    }

    if (value >= 4) {
      return {
        variant: "medium",
        start: "#f59e0b",
        end: "#f97316",
        glow: "rgba(249, 115, 22, 0.24)",
        accent: "#f59e0b",
      };
    }

    return {
      variant: "low",
      start: "#ef4444",
      end: "#ec4899",
      glow: "rgba(236, 72, 153, 0.22)",
      accent: "#ef4444",
    };
  };

  const nutritionGaugeCards = nutritionGauges.map((gauge) => {
    const theme = getNutritionTheme(gauge.value);
    const hasData = gauge.hasValue;
    return {
      ...gauge,
      theme,
      percentValue: hasData ? Math.max(0, Math.min(100, (gauge.displayValue / 10) * 100)) : 0,
      centerLabel: hasData ? getNutritionRangeLabel(rangeDays) : "No nutrition records found",
      centerValue: hasData ? `${gauge.displayValue.toFixed(1)}` : "",
      centerMeta: hasData ? "Average value out of 10" : "Selected range is empty",
      footerText: hasData ? `${Math.round((gauge.displayValue / 10) * 100)}% average` : "No nutrition records found",
    };
  });

  const getLastNScorePoints = (items, startDateIso, endDateIso) => {
    if (!Array.isArray(items)) return [];
    const endDate = endDateIso ? new Date(endDateIso) : new Date();
    const start = startDateIso ? new Date(`${startDateIso}T00:00:00`) : new Date(endDate);
    if (startDateIso) {
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(start.getDate() - 29);
    }

    const filtered = items
      .filter((item) => item?.date)
      .filter((item) => {
        const dt = new Date(item.date);
        return dt >= start && dt <= endDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return filtered;
  };

  const renderDailyScoreChart = () => {
    if (!dailyScoreRef.current || !window.Chart) return;

    const rawSeries = Array.isArray(finalScoreData?.data) ? finalScoreData.data : [];
    const series = getLastNScorePoints(rawSeries, selectedDate, activeDate);
    const labels = series.map((item) => formatShortDate(item.date));
    const values = series.map((item) => {
      const scoreValue = item.finalScore ?? item.final_score ?? null;
      return scoreValue === null || scoreValue === undefined ? null : Number(scoreValue);
    });

    if (!labels.length || values.every((v) => v === null || v === undefined || Number.isNaN(v))) {
      if (dailyChartRef.current) {
        try {
          dailyChartRef.current.data.labels = [];
          dailyChartRef.current.data.datasets[0].data = [];
          dailyChartRef.current.update();
        } catch (e) {}
      }
      return;
    }

    if (dailyChartRef.current) {
      dailyChartRef.current.data.labels = labels;
      dailyChartRef.current.data.datasets[0].data = values;
      try { dailyChartRef.current.update(); } catch (e) { console.error('Dashboard: daily chart update failed', e); }
      return;
    }

    const canvas = dailyScoreRef.current;
    const ctx = canvas.getContext && canvas.getContext('2d');
    let bg = '#007bff33';
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height || 220);
      g.addColorStop(0, 'rgba(0,123,255,0.45)');
      g.addColorStop(1, 'rgba(0,123,255,0.06)');
      bg = g;
    }

    dailyChartRef.current = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily Score',
            data: values,
            borderColor: '#007bff',
            backgroundColor: bg,
            borderWidth: 3,
            fill: true,
            tension: 0.36,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Daily Score',
            font: { size: 14, weight: 'bold' },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 10,
          },
        },
      },
    });
  };

  const updateChartFromLast7 = (chart, last7, config) => {
    if (!chart || !last7) return;
    const labels = last7.labels || [];
    const datasets = last7.datasets || [];
    // Defensive: ensure labels and datasets are arrays and of matching length
    if (!Array.isArray(labels) || !Array.isArray(datasets)) return;
    chart.data.labels = labels;

    if (config.multi) {
      chart.data.datasets = datasets.map((dataset, index) => ({
        label: dataset.label || `Series ${index + 1}`,
        data: dataset.data || [],
        borderColor: chartPalette[index % chartPalette.length],
        backgroundColor: chartPalette[index % chartPalette.length] + "55",
        borderWidth: 2,
        fill: config.type === "line",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      }));
    } else {
      const primary = datasets[0] || { label: config.label, data: [] };
      chart.data.datasets = [
        {
          label: primary.label || config.label,
          data: primary.data || [],
          borderColor: config.color,
          backgroundColor: config.color + "33",
          borderWidth: 2,
          fill: config.type === "line",
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ];
    }

    try {
      chart.update();
    } catch (e) {
      console.error('Dashboard: chart.update failed', e);
    }
  };

  const updateCharts = () => {
    if (!window.Chart) return;
    initializeCharts();

    if (overnightChartRef.current) {
      const resolvePayload = (p) => p?.last7day || p?.lastNday || p?.lastRange || p;
      const selectedRangeStart = selectedDate;
      const selectedRangeEnd = activeDate;
      const overnightSeries = sliceSeriesToSelectedRange(resolvePayload(sleepingData?.data), selectedRangeStart, selectedRangeEnd);
      updateChartFromLast7(overnightChartRef.current, overnightSeries, {
        label: "Overnight Sleeping (Hours)",
        color: "#0ea5e9",
        type: "line",
        yMax: 10,
      });
    }

    const doughnutDataMap = {
      schooling: schoolingPieData?.data,
      sickness: sicknessDoughnutData?.data,
      therapy: therapyDoughnutData?.data,
      bedwetting: bedwettingDoughnutData?.data,
    };
    doughnutCharts.forEach((chartInfo, index) => {
      const chart = doughnutChartsRef.current[index];
      if (!chart) return;
      const payload = doughnutDataMap[chartInfo.key] || {};
      const dataset = payload.datasets?.[0] || {};
      const labels = chartInfo.labels || payload.labels || [];
      const normalizeLabel = (value) => String(value ?? "").trim().toLowerCase();
      const payloadLabels = (payload.labels || []).map(normalizeLabel);
      const payloadData = dataset.data || [];
      const countsByLabel = new Map(payloadLabels.map((label, labelIndex) => [label, Number(payloadData[labelIndex] ?? 0)]));
      chart.data.labels = labels;
      chart.data.datasets = [
        {
          data: labels.map((label) => countsByLabel.get(normalizeLabel(label)) ?? 0),
          backgroundColor: dataset.backgroundColor || labels.map((_, idx) => YES_NO_COLORS[idx % YES_NO_COLORS.length]),
          borderWidth: 2,
          borderColor: "#fff",
        },
      ];
      chart.update();
    });

    const resolvePayload = (p) => p?.last7day || p?.lastNday || p?.lastRange || p;
    const selectedRangeStart = selectedDate;
    const selectedRangeEnd = activeDate;
    const dataMap = {
      wakingUp: resolvePayload(wakingUpData?.data),
      firstGoOut: resolvePayload(firstGoOutData?.data),
      cooperateAtHome: resolvePayload(cooperateAtHomeData?.data),
      cooperateAtSchool: resolvePayload(cooperateAtSchoolData?.data),
      itemThrowTendency: resolvePayload(itemThrowData?.data),
      foodWaterThrowTendency: resolvePayload(foodWaterThrowData?.data),
      outgoingTendency: resolvePayload(outgoingTendencyData?.data),
      outgoingCount: resolvePayload(outgoingCountData?.data),
      gettingSleepTime: resolvePayload(requiredSleepTimeData?.data),
      pushingTendency: resolvePayload(pushingTendencyData?.data),
      hitWithHand: resolvePayload(hitWithHandData?.data),
      hitWithHead: resolvePayload(hitWithHeadData?.data),
      glassCrashTendency: resolvePayload(glassCrashData?.data),
      toilet: resolvePayload(toiletData?.data),
      masturbation: resolvePayload(masturbationData?.data),
      showingAnger: resolvePayload(showingAngerData?.data),
      cuttingNails: resolvePayload(cuttingNailsData?.data),
      hairDressing: resolvePayload(hairDressingData?.data),
      goingToSleep: resolvePayload(goingToSleepData?.data),
      screenTime: resolvePayload(screenTimeData?.data),
      makingNoise: resolvePayload(noiseData?.data),
      walking: resolvePayload(walkingData?.data),
      classActivity: resolvePayload(classActivityData?.data),
      outdoorActivity: resolvePayload(outdoorActivityData?.data),
    };

    // Merge custom var data into dataMap
    Object.keys(customVarChartData).forEach(key => {
      if (customVarChartData[key]) dataMap[key] = customVarChartData[key];
    });

    const normalizeLabel = (value) => String(value ?? "").trim().toLowerCase();

    // Helper: compute counts from entries for categorical variables
    const getCounts = (key) => {
      const counts = {};
      entriesInSelectedRange.forEach(entry => {
        const val = String(entry[key] ?? entry.customVariables?.[key] ?? "").trim();
        if (!val || val === "undefined" || val === "null") return;
        counts[val] = (counts[val] || 0) + 1;
      });
      return counts;
    };

    const YES_NO_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#0ea5e9", "#8b5cf6"];

    const computeTimeSeriesFromEntries = (key) => {
      const items = entriesInSelectedRange
        .filter(e => {
          const v = e[key] ?? e.customVariables?.[key];
          if (v === undefined || v === null) return false;
          if (typeof v === "object") {
            return typeof v.hour === "number" && typeof v.minute === "number";
          }
          return String(v).trim() !== "";
        })
        .map(e => {
          const v = e[key] ?? e.customVariables?.[key];
          let numVal = parseFloat(v);
          if (v && typeof v === "object" && typeof v.hour === "number" && typeof v.minute === "number") {
            numVal = v.hour + (v.minute / 60);
          }
          return {
            date: (String(e.dateOfRecord || "")).split("T")[0],
            value: numVal,
          };
        })
        .filter(item => !isNaN(item.value) && item.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      if (items.length === 0) return null;
      return {
        labels: items.map(i => {
          const d = new Date(i.date);
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }),
        datasets: [{ label: key, data: items.map(i => i.value) }],
      };
    };

    // Update current page charts
    pageChartsRef.current.forEach((chart, i) => {
      const def = currentPageDefs[i];
      if (!chart || !def) return;
      if (def.doughnutLabels) {
        // Doughnut chart: compute counts from entries using the fixed label set
        const counts = getCounts(def.key);
        const labels = def.doughnutLabels;
        chart.data.labels = labels;
        chart.data.datasets[0].data = labels.map((label) => counts[label] ?? counts[Object.keys(counts).find((key) => normalizeLabel(key) === normalizeLabel(label))] ?? 0);
        chart.data.datasets[0].backgroundColor = labels.map((_, idx) => YES_NO_COLORS[idx % YES_NO_COLORS.length]);
        chart.update();
      } else {
        // Line/bar chart: use API data first, fall back to raw entries
        let data = dataMap[def.key];
        if (!data) data = computeTimeSeriesFromEntries(def.key);
        if (data) {
          const rangedData = sliceSeriesToSelectedRange(data, selectedRangeStart, selectedRangeEnd);
          updateChartFromLast7(chart, rangedData, def);
        }
      }
    });

  };

  useEffect(() => {
    if (loggedUserData && isSuccess) {
      setUserData({
        id: loggedUserData.user._id,
        name: loggedUserData.user.name,
      });
    }
  }, [loggedUserData, isSuccess]);

  // Initialize all charts after component mounts
  useEffect(() => {
    if (chartsInitialized.current) return;

    // Load Chart.js directly from CDN
    const chartScript = document.createElement("script");
    chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
    chartScript.onload = () => {
      if (window.Chart) {
        try {
          const defaults = window.Chart.defaults;
          defaults.font.family = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
          defaults.font.size = 12;
          // Utility: convert hex to rgba
          const hexToRgba = (hex, alpha = 1) => {
            if (!hex) return `rgba(0,0,0,${alpha})`;
            const h = hex.replace('#', '');
            const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };

          defaults.color = "#0f172a"; // slate-900 for text
          defaults.plugins = defaults.plugins || {};
          defaults.plugins.legend = defaults.plugins.legend || {};
          defaults.plugins.legend.labels = Object.assign({}, defaults.plugins.legend.labels, {
            color: "#475569",
            font: { family: defaults.font.family, size: 12 },
          });
          defaults.plugins.title = Object.assign({}, defaults.plugins.title || {}, {
            color: "#0f172a",
            font: { family: defaults.font.family, size: 14, weight: '600' },
          });

          // Better tooltip and interaction defaults for richer UX
          defaults.plugins.tooltip = Object.assign({}, defaults.plugins.tooltip || {}, {
            mode: 'index',
            intersect: false,
            backgroundColor: '#0b1220',
            titleColor: '#ffffff',
            bodyColor: '#d1d5db',
            padding: 10,
            cornerRadius: 6,
          });
          defaults.interaction = Object.assign({}, defaults.interaction || {}, { mode: 'index', intersect: false });

          defaults.elements = defaults.elements || {};
          defaults.elements.line = Object.assign({}, defaults.elements.line || {}, { tension: 0.36, borderWidth: 3 });
          defaults.elements.point = Object.assign({}, defaults.elements.point || {}, { radius: 3, hoverRadius: 6, hoverBorderWidth: 2 });
          defaults.animation = defaults.animation || {};
          defaults.animation.duration = 800;
          defaults.animation.easing = 'easeOutQuart';
        } catch (e) {
          // ignore if defaults can't be set for any reason
          console.warn('Could not apply Chart.js defaults', e);
        }
      }
      initializeCharts();
    };
    document.head.appendChild(chartScript);

    return () => {
      chartsInitialized.current = false;
    };
  }, []);

  const initializeCharts = () => {
    if (!window.Chart) return;

    // Create doughnut charts
    doughnutCharts.forEach((chartData, index) => {
      if (doughnutChartsRef.current[index]) return;
      const canvas = doughnutRefs.current[index];
      if (canvas && window.Chart) {
        doughnutChartsRef.current[index] = new window.Chart(canvas, {
          type: "doughnut",
          data: {
            labels: [],
            datasets: [
              {
                data: [],
                backgroundColor: ["#4CAF50", "#F44336"],
                borderWidth: 2,
                borderColor: "#fff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
              title: {
                display: true,
                text: chartData.title,
                font: { size: 16, weight: "bold" },
              },
            },
          },
        });
      }
    });

    // Create Overnight Sleeping chart (single card)
    if (overnightLineRef.current && window.Chart && !overnightChartRef.current) {
      const canvas = overnightLineRef.current;
      const ctx = canvas.getContext && canvas.getContext('2d');
      let bg = '#0ea5e933';
      if (ctx) {
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height || 220);
        g.addColorStop(0, 'rgba(14,165,233,0.36)');
        g.addColorStop(1, 'rgba(14,165,233,0.06)');
        bg = g;
      }
      overnightChartRef.current = new window.Chart(canvas, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Overnight Sleeping (Hours)",
              data: [],
              borderColor: "#0ea5e9",
              backgroundColor: bg,
              borderWidth: 3,
              fill: true,
              tension: 0.36,
              pointRadius: 3,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Overnight Sleeping (Hours)",
              font: { size: 14, weight: "bold" },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 10,
              title: {
                display: true,
                text: "Sleeping Hours",
              },
            },
          },
        },
      });
    }

    chartsInitialized.current = true;
  };

  // Cleanup charts on unmount to prevent stale instances
  useEffect(() => {
    return () => {
      try {
        doughnutChartsRef.current.forEach(c => { try { c?.destroy(); } catch(e) {} });
        pageChartsRef.current.forEach(c => { try { c?.destroy(); } catch(e) {} });
        if (overnightChartRef.current) try { overnightChartRef.current.destroy(); } catch(e) {}
      } catch (e) {
        console.warn('Dashboard cleanup error', e);
      }
    };
  }, []);

  useEffect(() => {
    updateCharts();
  }, [
    finalScoreData,
    schoolingPieData,
    sleepingData,
    screenTimeData,
    noiseData,
    walkingData,
    wakingUpData,
    firstGoOutData,
    cooperateAtHomeData,
    cooperateAtSchoolData,
    itemThrowData,
    foodWaterThrowData,
    outgoingTendencyData,
    outgoingCountData,
    requiredSleepTimeData,
    pushingTendencyData,
    hitWithHandData,
    hitWithHeadData,
    glassCrashData,
    toiletData,
    masturbationData,
    showingAngerData,
    cuttingNailsData,
    hairDressingData,
    sicknessDoughnutData,
    therapyDoughnutData,
    bedwettingDoughnutData,
    goingToSleepData,
    classActivityData,
    outdoorActivityData,
    allCustomVarData,
    studentProfileData,
    selectedDate,
    activeDate,
    rangeDays,
  ]);

  useEffect(() => {
    if (!showDailyScorePanel) {
      if (dailyChartRef.current) {
        try { dailyChartRef.current.destroy(); } catch (e) {}
        dailyChartRef.current = null;
      }
      return;
    }

    if (!window.Chart) return;

    let cancelled = false;
    const rafId = window.requestAnimationFrame(() => {
      if (!cancelled) renderDailyScoreChart();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [showDailyScorePanel, finalScoreData, selectedDate, activeDate, rangeDays]);

  // Page chart init/destroy — runs when the visible page or chart list changes
  useEffect(() => {
    // Destroy existing page charts immediately (before new canvases mount)
    pageChartsRef.current.forEach(c => { try { c?.destroy(); } catch (e) {} });
    pageChartsRef.current = [];

    if (!window.Chart) return;

    let cancelled = false;
    const rafId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      currentPageDefs.forEach((def, i) => {
        const canvas = pageRefs.current[i];
        if (!canvas || !window.Chart || pageChartsRef.current[i]) return;
        try {
          if (def.doughnutLabels) {
            pageChartsRef.current[i] = new window.Chart(canvas, {
              type: "doughnut",
              data: {
                labels: [],
                datasets: [{
                  data: [],
                  backgroundColor: labels => labels,
                  borderWidth: 2,
                  borderColor: "#fff",
                }],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: def.label, font: { size: 14, weight: "bold" } },
                },
              },
            });
          } else {
            const yScale = { beginAtZero: true };
            if (Number.isFinite(def.yMax)) yScale.suggestedMax = def.yMax;
            if (def.yTitle) yScale.title = { display: true, text: def.yTitle };
            const bg = def.color ? `${def.color}33` : 'rgba(0,123,255,0.2)';

            pageChartsRef.current[i] = new window.Chart(canvas, {
              type: def.type || 'line',
              data: {
                labels: [],
                datasets: [{
                  label: def.label,
                  data: [],
                  borderColor: def.color,
                  backgroundColor: bg,
                  borderWidth: 3,
                  fill: (def.type || 'line') === 'line',
                  tension: 0.36,
                  pointRadius: 3,
                  pointHoverRadius: 6,
                }],
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: def.label, font: { size: 14, weight: 'bold' } },
                },
                scales: { y: yScale },
              },
            });
          }
        } catch (e) {
          console.warn('Page chart init error', def.key, e);
        }
      });
      if (!cancelled) updateCharts();
    });

    return () => { cancelled = true; window.cancelAnimationFrame(rafId); };
  }, [safeCatIndex, currentPageDefsKey, allChartDefsKey]);

  const formatDisplayDate = (isoDate) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    const parsed = new Date(y, m - 1, d);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString();
  };

  const handleStartDateChange = (value) => {
    const nextStart = rangeLimitStartDate && value < rangeLimitStartDate ? rangeLimitStartDate : value;
    const next = normalizeRange(nextStart, activeDate);
    setSelectedDate(next.startDate);
  };

  const handleEndDateChange = (value) => {
    const nextEnd = value || activeDate;
    const nextRangeLimitStart = shiftLocalDate(nextEnd, -maxLookbackDays);
    const nextStart = selectedDate < nextRangeLimitStart ? nextRangeLimitStart : selectedDate;
    const next = normalizeRange(nextStart, nextEnd);
    setSelectedDate(next.startDate);
    setActiveDate(next.endDate);
  };

  const handleSliderStartChange = (value) => {
    const offsetDays = Math.max(0, Math.min(maxLookbackDays, Number(value)));
    const nextStartDate = shiftLocalDate(activeDate, -offsetDays);
    if (rangeLimitStartDate && nextStartDate < rangeLimitStartDate) {
      setSelectedDate(rangeLimitStartDate);
      return;
    }
    setSelectedDate(nextStartDate);
  };

  return (
    <>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-top-row">
            <h1>Hello {userData.name || "User"}</h1>
            <p>Today is {new Date().toLocaleDateString()}</p>
          </div>
          
          {hasAnyRole(["therapist", "doctor", "teacher", "admin", "superadmin"]) && (
            <div className="staff-student-selector">
              <label htmlFor="student-select">Select Student to View Analytics:</label>
              <select 
                id="student-select"
                value={queryUserId || ""} 
                onChange={(e) => {
                  const val = e.target.value;
                  const name = e.target.options[e.target.selectedIndex].text;
                  const url = new URL(window.location.href);
                  if (val) {
                    url.searchParams.set("userId", val);
                    url.searchParams.set("studentName", name);
                  } else {
                    url.searchParams.delete("userId");
                    url.searchParams.delete("studentName");
                  }
                  window.location.href = url.toString();
                }}
              >
                <option value="">-- Choose a Student --</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {queryUserId && (
            <div className="viewing-student-banner">
              <span className="banner-icon">👨‍🎓</span>
              <span>Viewing Full Analytics for: <strong>{viewedStudentName || "Selected Student"}</strong></span>
            </div>
          )}
        </div>

        {/* Power BI-style date range slicer */}
        <div className="dashboard-date-filter">
          <div className="date-range-slicer-card">
            <div className="date-filter-title">Date Range</div>
            <div className="date-range-slicer-meta">
              <span>Between</span>
              <strong>{formatDisplayDate(selectedDate)} to {formatDisplayDate(activeDate)}</strong>
            </div>

            <div className="date-range-slicer-controls">
              <label className="date-range-field">
                <span>From</span>
                <input
                  type="date"
                  className="date-filter-input"
                  value={selectedDate}
                  onChange={(event) => handleStartDateChange(event.target.value)}
                />
              </label>

              <label className="date-range-field">
                <span>To</span>
                <input
                  type="date"
                  className="date-filter-input"
                  value={activeDate}
                  onChange={(event) => handleEndDateChange(event.target.value)}
                />
              </label>
            </div>

            <div className="date-range-slider-wrap">
              <div
                className="date-range-slider-track-shell"
                style={{
                  "--range-start": `${maxLookbackDays > 0 ? (startOffsetDays / maxLookbackDays) * 100 : 0}%`,
                  "--range-end": "100%",
                }}
              >
                <div className="date-range-slider-track" />
                <input
                  type="range"
                  min="0"
                  max={maxLookbackDays}
                  step="1"
                  value={startOffsetDays}
                  onChange={(event) => handleSliderStartChange(event.target.value)}
                  aria-label="Start date slider"
                  className="date-range-slider-input"
                />
              </div>
              <div className="date-range-slider-labels">
                <span>{formatDisplayDate(sliderStartDate)}</span>
                <span>{formatDisplayDate(sliderEndDate)}</span>
              </div>
            </div>

            <div className="date-range-slicer-hint">
              Showing {rangeDays} day{rangeDays === 1 ? "" : "s"} in the selected interval
            </div>
          </div>
        </div>

        {/* Overview Statistics removed per request */}

        {/* Overnight Sleeping (moved to Sleep category) — removed from top-level */}

        {/* Section 3: Behavioral Trends — Grouped by Category & Carousel Sliders */}
        {(() => {
          const activeGroupConfig = ASSESSMENT_FACTOR_GROUPS.find(g => g.category === currentCategory) || {};
          const categoryColor = activeGroupConfig.color || '#4f46e5';
          const categoryBg = activeGroupConfig.bgColor || '#f8fafc';
          const categoryBorder = activeGroupConfig.borderColor || '#cbd5e1';

          return (
            <>
              <div className="section-title">Behavioral Trends</div>
              
              {activeCategories.length > 0 ? (
                    <div className="category-carousel-section">
                      <div className="behavior-submenu" role="tablist" aria-label="Behavioral trend categories">
                        <button
                          key="__daily_score_button__"
                          type="button"
                          className={`behavior-submenu-btn ${showDailyScorePanel ? 'active' : ''}`}
                          onClick={() => { setShowDailyScorePanel(true); setActiveCatIndex(0); }}
                          aria-pressed={showDailyScorePanel}
                          style={{
                            '--submenu-accent': '#007bff',
                            '--submenu-accent-bg': '#eef6ff',
                            '--submenu-accent-border': '#cfe4ff',
                          }}
                        >
                          <span className="behavior-submenu-label">Daily Score</span>
                          <span className="behavior-submenu-count">1 graph</span>
                        </button>

                        {activeCategories.map((category, index) => {
                          const groupConfig = ASSESSMENT_FACTOR_GROUPS.find(g => g.category === category) || {};
                          const isActive = index === safeCatIndex;
                          const graphCount = chartsByCategory[category]?.length || 0;

                          return (
                            <button
                              key={category}
                              type="button"
                              className={`behavior-submenu-btn ${isActive ? 'active' : ''}`}
                              onClick={() => { setShowDailyScorePanel(false); setActiveCatIndex(index); }}
                              aria-pressed={isActive}
                              style={{
                                '--submenu-accent': groupConfig.color || categoryColor,
                                '--submenu-accent-bg': groupConfig.bgColor || categoryBg,
                                '--submenu-accent-border': groupConfig.borderColor || categoryBorder,
                              }}
                            >
                              <span className="behavior-submenu-label">{category}</span>
                              <span className="behavior-submenu-count">{graphCount} graphs</span>
                            </button>
                          );
                        })}
                      </div>

                      <div 
                        className="category-carousel-header-card" 
                        style={{
                          border: `1px solid ${categoryBorder}`,
                          background: showDailyScorePanel ? '#eef6ff' : categoryBg,
                          color: showDailyScorePanel ? '#007bff' : categoryColor
                        }}
                      >
                        <div className="cat-carousel-info">
                          <span className="cat-carousel-class-title">{showDailyScorePanel ? 'Daily Score' : currentCategory}</span>
                          <span className="cat-carousel-badge" style={{ background: (showDailyScorePanel ? '#007bff' : categoryColor) + '1a', color: showDailyScorePanel ? '#007bff' : categoryColor }}>
                            {showDailyScorePanel ? 1 : currentCategoryCharts.length} graph{(showDailyScorePanel ? 1 : currentCategoryCharts.length) === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="graph-carousel-count" style={{ color: showDailyScorePanel ? '#007bff' : categoryColor }}>
                          {showDailyScorePanel ? 'Daily Score' : `Category ${safeCatIndex + 1} of ${activeCategories.length}`}
                        </div>
                      </div>

                      {showDailyScorePanel ? (
                        <div className="graph-carousel-container">
                          <div className="graph-carousel-card">
                            <div className="graph-carousel-sub-header">
                              <div className="graph-carousel-title-group">
                                <h3 className="graph-carousel-title">Daily Score</h3>
                                <span className="graph-carousel-count">Showing 1 graph</span>
                              </div>
                            </div>
                            <div className="category-graphs-grid">
                              <div className="chart-card category-graph-card">
                                <canvas ref={(el) => { dailyScoreRef.current = el; }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : currentCategory === "🍽️ Nutrition" ? (
                        <div className="graph-carousel-container">
                          <div className="graph-carousel-card">
                            <div className="graph-carousel-sub-header">
                              <div className="graph-carousel-title-group">
                                <h3 className="graph-carousel-title">Nutrition Score</h3>
                                <span className="graph-carousel-count">Showing {nutritionGaugeCards.length} card{nutritionGaugeCards.length === 1 ? '' : 's'}</span>
                              </div>
                            </div>

                            <div className="category-graphs-grid">
                              {nutritionGaugeCards.map((gauge) => (
                                <div
                                  key={gauge.id}
                                  className={`chart-card gauge-card nutrition-gauge-card nutrition-theme-${gauge.theme.variant}`}
                                  style={{
                                    "--nutrition-start": gauge.theme.start,
                                    "--nutrition-end": gauge.theme.end,
                                    "--nutrition-glow": gauge.theme.glow,
                                    "--nutrition-accent": gauge.theme.accent,
                                  }}
                                >
                                  <div className="nutrition-gauge-topline">
                                    <span className="nutrition-gauge-category">{gauge.label}</span>
                                    <span className="nutrition-gauge-pill">{gauge.centerLabel}</span>
                                  </div>

                                  <div className="nutrition-gauge-visual">
                                    <svg viewBox="0 0 120 120" className="nutrition-gauge-svg" aria-hidden="true" focusable="false">
                                      <defs>
                                        <linearGradient id={`${gauge.id}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor={gauge.theme.start} />
                                          <stop offset="100%" stopColor={gauge.theme.end} />
                                        </linearGradient>
                                      </defs>
                                      <circle className="nutrition-gauge-track" cx="60" cy="60" r="46" />
                                      <circle
                                        className="nutrition-gauge-progress"
                                        cx="60"
                                        cy="60"
                                        r="46"
                                        stroke={`url(#${gauge.id}-gradient)`}
                                        strokeDasharray="289"
                                        strokeDashoffset={289 - (289 * gauge.percentValue) / 100}
                                      />
                                    </svg>

                                    <div className="nutrition-gauge-center">
                                      <div className="nutrition-gauge-label">{gauge.centerLabel}</div>
                                      <div className="nutrition-gauge-value">{gauge.centerValue ? gauge.centerValue : ""}</div>
                                      <div className="nutrition-gauge-meta">{gauge.centerMeta}</div>
                                    </div>
                                  </div>

                                  <div className="nutrition-gauge-footer">{gauge.footerText}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Render all category charts in a responsive grid (matrix)
                        currentCategoryCharts && currentCategoryCharts.length > 0 ? (
                          <div className="graph-carousel-container">
                            <div className="graph-carousel-card">
                              <div className="graph-carousel-sub-header">
                                <div className="graph-carousel-title-group">
                                  <h3 className="graph-carousel-title">{currentCategory}</h3>
                                  <span className="graph-carousel-count">Showing {currentCategoryCharts.length} graph{currentCategoryCharts.length === 1 ? '' : 's'}</span>
                                </div>
                              </div>

                              <div className="category-graphs-grid">
                                {currentCategoryCharts.map((def, i) => (
                                  <div key={def.key} className="chart-card category-graph-card">
                                    <canvas ref={(el) => { pageRefs.current[i] = el; }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="graph-carousel-empty">
                            <p>No active variables found in this category.</p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="graph-carousel-empty-global">
                      <p>No tracked variables configured in your profile. Please contact your therapist.</p>
                    </div>
                  )}
            </>
          );
        })()}



        {/* Nutrition gauge cards are shown inside the Behaviorals Trends category view now. Removed duplicate bottom section. */}

        <div className="table-card">
          <h3>Medication Records</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Regular Medication</th>
                  <th>Medication Reason</th>
                  <th>Other Sickness</th>
                  <th>Sickness Name</th>
                  <th>Medication for Sickness</th>
                  <th>Medicine List</th>
                  <th>Special Activity</th>
                </tr>
              </thead>
              <tbody>
                {entriesLoading ? (
                  <tr>
                    <td colSpan={8}>Loading...</td>
                  </tr>
                ) : medicationRows.length ? (
                  medicationRows.slice(0, 30).map((entry, i) => (
                    <tr key={entry._id || i} className={normalizeEntryDate(entry) === activeDate ? "row-highlight" : ""}>
                      <td>{formatDisplayDate(normalizeEntryDate(entry))}</td>
                      <td>{displayValue(entry.regularMedication)}</td>
                      <td>{displayValue(entry.medicationReason)}</td>
                      <td>{displayValue(entry.otherSickness)}</td>
                      <td>{displayValue(entry.nameOfSickness)}</td>
                      <td>{displayValue(entry.medOtherSickness)}</td>
                      <td>{displayValue(entry.listOfMedicine)}</td>
                      <td>{displayValue(entry.specialActivity)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>No medication records found for this student in the selected range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

          {/* Table 2: Therapy */}
          <div className="table-card">
            <h3>Therapy Calendar</h3>
            <div style={{marginBottom:'0.75rem'}}>
              <TherapyCalendar userId={resolvedStudentId} />
            </div>
          </div>

        {/* Section: Medical Records (New) */}
        {studentProfile?.medical_records?.length > 0 && (
          <div className="section-title">Medical Records</div>
        )}
        {studentProfile?.medical_records?.length > 0 && (
          <div className="medical-records-container">
            <div className="medical-records-grid">
              {studentProfile.medical_records.map((record, idx) => (
                <div key={idx} className="medical-record-card">
                  <div className="record-icon">📄</div>
                  <div className="record-info">
                    <span className="record-filename">{record.filename}</span>
                    <span className="record-date">Uploaded: {new Date(record.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <a 
                    href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${record.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="record-view-link"
                  >
                    View Document
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Cards */}
        <div className="section-title">Important Information</div>
        <div className="info-cards-container">
          <div className="info-card">
            <h3>Regular Medication</h3>
            <div className="info-content">
              <p><strong>Yes:</strong> {importantInformationSummary.medicationStatusCounts.yes}</p>
              <p><strong>No:</strong> {importantInformationSummary.medicationStatusCounts.no}</p>
              <p><strong>Other / Blank:</strong> {importantInformationSummary.medicationStatusCounts.other}</p>
              <p><strong>Latest Status:</strong> {importantInformationSummary.latestMedicationStatus}</p>
            </div>
          </div>

          <div className="info-card">
            <h3>Notes</h3>
            <div className="info-content advice-list">
              <p><strong>Most Common Sickness:</strong> {importantInformationSummary.mostCommonSickness}</p>
              <p><strong>Most common reason for missed Medication:</strong> {importantInformationSummary.latestMedicationReason}</p>
              <p><strong>Latest Sickness Medication:</strong> {importantInformationSummary.latestSicknessMedication}</p>
              <p><strong>Latest Special Activity:</strong> {importantInformationSummary.latestSpecialActivity}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Dashboard;

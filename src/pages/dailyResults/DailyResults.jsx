import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetFoodBarChartDataQuery,
  useGetSleepingLineChartDataQuery,
  useGetscreenTimeBarChartDataQuery,
  useGetmakingNoiseBarChartDataQuery,
  useGetwalkingLineChartDataQuery,
  useGetwakingUpBarChartDataQuery,
  useGetgoingToSleepBarChartDataQuery,
  useGetclassActivityLineChartDataQuery,
  useGetoutdoorActivityLineChartDataQuery,
  useGetjunkFoodLineChartDataQuery,
  useGetShowingAngerAverageCardQuery,
  useGethitWithHandAverageCardQuery,
  useGetoutgoingTendencyAverageCardQuery,
  useGetbedwettingAverageCardQuery,
  useGetcooperateAtSchoolAverageCardQuery,
  useGetschoolingCountCardQuery,
  useGettherapyAtSchoolCountCardQuery,
  useGetAllCustomVariablesChartDataQuery,
  // ADD THIS if you have a dedicated endpoint for the pie chart:
  useGetschoolingPieChartDataQuery,
} from "../../services/graphDataService";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Loader from "../../components/loader/Loader.jsx"; // Universal Loader import
import "./DailyResults.css";
import { getUserRole } from "../../services/tokenService";

const transformBarChartData = (data) => {
  const labels = data.labels;
  const datasets = data.datasets;
  return labels.map((label, index) => {
    const entry = { date: label };
    datasets.forEach((dataset) => {
      entry[dataset.label] = dataset.data[index];
    });
    return entry;
  });
};

const transformLineChartData = (data) => {
  const labels = data.labels;
  const dataset = data.datasets[0];
  return labels.map((label, index) => ({
    date: label,
    value: dataset.data[index],
  }));
};

const formatChartDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const parsedDate = new Date(dateValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return String(dateValue);
};

const LineChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,.1)",
      }}
    >
      <p style={{ color: "#64748b", margin: 0, fontSize: 11 }}>
        Date: {formatChartDate(label)}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          style={{ color: entry.color, margin: "2px 0", fontSize: 12, fontWeight: 700 }}
        >
          {entry.name || "Value"}: {entry.value}
        </p>
      ))}
    </div>
  );
};

const DailyResults = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  // If a therapist/teacher/admin opens another student's reports, it will pass ?userId=<id>
  const queryParams = new URLSearchParams(window.location.search);
  const queryUserId = queryParams.get('userId') || undefined;
  const selectedDate = queryParams.get("selectedDate") || undefined;
  const initialDate = selectedDate || new Date().toISOString().split("T")[0];
  const [filterDate, setFilterDate] = useState(initialDate);
  const queryArgs = { userId: queryUserId, selectedDate };

  useEffect(() => {
    if (userRole === "admin") {
      navigate("/studentoverview/profile", { replace: true });
    }
  }, [navigate, userRole]);

  const handleApplyDate = () => {
    if (!filterDate) return;
    const params = new URLSearchParams();
    if (queryUserId) params.set("userId", queryUserId);
    params.set("selectedDate", filterDate);
    navigate(`/studentoverview/dailyreports?${params.toString()}`);
  };

  const handleToday = () => {
    const todayIso = new Date().toISOString().split("T")[0];
    setFilterDate(todayIso);
    const params = new URLSearchParams();
    if (queryUserId) params.set("userId", queryUserId);
    params.set("selectedDate", todayIso);
    navigate(`/studentoverview/dailyreports?${params.toString()}`);
  };

  // Existing queries with their loading states (pass optional userId) and capture errors for RBAC handling
  const { data: foodData, isLoading: isFoodLoading, error: foodError } =
    useGetFoodBarChartDataQuery(queryArgs);
  const { data: sleepingData, isLoading: isSleepingLoading, error: sleepingError } =
    useGetSleepingLineChartDataQuery(queryArgs);
  const { data: screenTimeData, isLoading: isScreenTimeLoading, error: screenTimeError } =
    useGetscreenTimeBarChartDataQuery(queryArgs);
  const { data: noiseData, isLoading: isNoiseLoading, error: noiseError } =
    useGetmakingNoiseBarChartDataQuery(queryArgs);
  const { data: walkingData, isLoading: isWalkingLoading, error: walkingError } =
    useGetwalkingLineChartDataQuery(queryArgs);
  const { data: wakingUpData, isLoading: isWakingUpLoading, error: wakingUpError } =
    useGetwakingUpBarChartDataQuery(queryArgs);
  const { data: goingToSleepData, isLoading: isGoingToSleepLoading, error: goingToSleepError } =
    useGetgoingToSleepBarChartDataQuery(queryArgs);

  // Pie chart data query
  const { data: schoolingPieData, isLoading: isPieLoading, error: pieError } =
    useGetschoolingPieChartDataQuery(queryArgs);

  // Transform the data for your charts (defensive checks to avoid runtime errors)
  const transformedFoodData =
    foodData?.data?.last7day ? transformBarChartData(foodData.data.last7day) : [];
  const transformedSleepingData =
    sleepingData?.data?.last7day ? transformLineChartData(sleepingData.data.last7day) : [];
  const transformedScreenTimeData =
    screenTimeData?.data?.last7day ? transformBarChartData(screenTimeData.data.last7day) : [];
  const transformedNoiseData =
    noiseData?.data?.last7day ? transformBarChartData(noiseData.data.last7day) : [];
  const transformedWalkingData =
    walkingData?.data?.last7day ? transformLineChartData(walkingData.data.last7day) : [];
  const transformedWakingUpData =
    wakingUpData?.data?.last7day ? transformBarChartData(wakingUpData.data.last7day) : [];
  const transformedGoingToSleepData =
    goingToSleepData?.data?.last7day ? transformBarChartData(goingToSleepData.data.last7day) : [];

  // Pie Chart data transformation (defensive)
  const pieChartData = schoolingPieData?.data?.labels && schoolingPieData.data.datasets?.[0]?.data
    ? schoolingPieData.data.labels.map((label, index) => ({
        name: label,
        value: schoolingPieData.data.datasets[0].data[index],
        backgroundColor: schoolingPieData.data.datasets[0].backgroundColor?.[index],
      }))
    : [];

  const { data: classActivityData, error: classActivityError } =
    useGetclassActivityLineChartDataQuery(queryArgs);
  const { data: outdoorActivityData, error: outdoorActivityError } =
    useGetoutdoorActivityLineChartDataQuery(queryArgs);
  const { data: junkFoodData, error: junkFoodError } = useGetjunkFoodLineChartDataQuery(queryArgs);
  const transformedClassActivityData =
    classActivityData?.data?.last7day ? transformLineChartData(classActivityData.data.last7day) : [];
  const transformedOutdoorActivityData =
    outdoorActivityData?.data?.last7day ? transformLineChartData(outdoorActivityData.data.last7day) : [];
  const transformedJunkFoodData =
    junkFoodData?.data?.last7day ? transformLineChartData(junkFoodData.data.last7day) : [];

  const { data: angerData } = useGetShowingAngerAverageCardQuery(queryArgs);
  const { data: hitHandData } = useGethitWithHandAverageCardQuery(queryArgs);
  const { data: outgoingTendencyData } =
    useGetoutgoingTendencyAverageCardQuery(queryArgs);
  const { data: bedwettingData } = useGetbedwettingAverageCardQuery(queryArgs);
  const { data: cooperateAtSchoolData } =
    useGetcooperateAtSchoolAverageCardQuery(queryArgs);
  const { data: schoolingCountData } = useGetschoolingCountCardQuery(queryArgs);
  const { data: therapyAtSchoolCountData } =
    useGettherapyAtSchoolCountCardQuery(queryArgs);

  const { data: allCustomVarData } = useGetAllCustomVariablesChartDataQuery(
    { userId: queryUserId, selectedDate: filterDate, rangeDays: 7 }, // Assuming 7 days for daily results
    { skip: !queryUserId }
  );

  const customVarChartData = allCustomVarData?.data || {};
  const customVarKeys = Object.keys(customVarChartData);

  // Detect forbidden (403) errors from any of the user-scoped graph queries. When a therapist
  // attempts to view a student they are not assigned to, backend returns 403. We show a
  // friendly message instead of the charts.
  const isForbiddenError = (err) => {
    if (!err) return false;
    // RTK Query error shapes vary: check common locations for 403/Forbidden
    return (
      err?.status === 403 ||
      err?.originalStatus === 403 ||
      err?.data?.status === 403 ||
      err?.data?.message === "Forbidden" ||
      (err?.error && String(err.error).toLowerCase().includes("forbidden"))
    );
  };

  const _forbiddenErrors = [
    foodError,
    sleepingError,
    screenTimeError,
    noiseError,
    walkingError,
    wakingUpError,
    goingToSleepError,
    pieError,
    classActivityError,
    outdoorActivityError,
    junkFoodError,
  ];

  const forbiddenError = _forbiddenErrors.find(isForbiddenError);
  const isForbidden = Boolean(forbiddenError);

  // Helper to safely extract various possible shapes for counts/values
  const getCount = (cardData, period = "last7day") => {
    const d = cardData?.data;
    if (!d) return "N/A";

    const periodKeys =
      period === "last7day"
        ? ["last7day", "last7days", "last7", "lastSevenDays"]
        : ["previous7day", "previous7days", "previous7", "previousSevenDays"];

    for (const key of periodKeys) {
      const v = d[key];
      if (v == null) continue;
      if (typeof v === "number") return v;
      if (typeof v === "object") {
        if (v.count !== undefined) return v.count;
        if (v.Count !== undefined) return v.Count;
        if (v.value !== undefined) return v.value;
      }
    }

    if (d.count !== undefined) return d.count;
    if (d.Count !== undefined) return d.Count;
    if (d.value !== undefined) return d.value;

    return "N/A";
  };

  const [bannerVisible, setBannerVisible] = useState(true);

  if (isForbidden) {
    const message = forbiddenError?.data?.message || "You do not have permission to view this student's reports.";
    if (bannerVisible) {
      return (
        <div className="daily-results">
          <div className="forbidden-banner">
            <span className="forbidden-message">{message}</span>
            <button className="close-btn" onClick={() => setBannerVisible(false)} aria-label="Dismiss">×</button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="daily-results">
          <div className="reports-unavailable">
            <p>Reports are unavailable for this student.</p>
            <button className="back-btn" onClick={() => (window.location.href = '/students')}>Back to Students</button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="daily-results">
      <div className="daily-results-filter">
        <div className="date-filter-title">Report Date</div>
        <div className="date-filter-controls">
          <input
            type="date"
            className="date-filter-input"
            value={filterDate}
            onChange={(event) => setFilterDate(event.target.value)}
          />
          <button type="button" className="date-filter-btn" onClick={handleApplyDate}>
            View
          </button>
          <button type="button" className="date-filter-btn secondary" onClick={handleToday}>
            Today
          </button>
        </div>
      </div>
      {/* Food Chart Card */}
      <div className="results-card">
        <h3>Food Consumption</h3>
        {isFoodLoading ? (
          <Loader
            containerClassName="flex items-center justify-center bg-gray-50"
            containerStyle={{ height: "250px", position: "relative" }}
          />
        ) : transformedFoodData && transformedFoodData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={transformedFoodData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Breakfast" fill="#4CAF50" />
              <Bar dataKey="Lunch" fill="#FF5733" />
              <Bar dataKey="Dinner" fill="#FFC300" />
              <Bar dataKey="Evening Snacks" fill="#900C3F" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No data available
          </div>
        )}
      </div>

      {/* Sleeping Chart Card */}
      <div className="results-card">
        <h3>Sleeping Patterns</h3>
        {isSleepingLoading ? (
          <Loader
            containerClassName="flex items-center justify-center bg-gray-50"
            containerStyle={{ height: "250px", position: "relative" }}
          />
        ) : transformedSleepingData && transformedSleepingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={transformedSleepingData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<LineChartTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#4CAF50" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No data available
          </div>
        )}
      </div>

      {/* Screen Time Chart Card */}
      <div className="results-card">
        <h3>Screen Time</h3>
        {isScreenTimeLoading ? (
          <Loader
            containerClassName="flex items-center justify-center bg-gray-50"
            containerStyle={{ height: "250px", position: "relative" }}
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={transformedScreenTimeData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Screen Time (Last 7 Entries)" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Noise Levels Chart Card */}
      <div className="results-card">
        <h3>Noise Levels</h3>
        {isNoiseLoading ? (
          <Loader
            containerClassName="flex items-center justify-center bg-gray-50"
            containerStyle={{ height: "250px", position: "relative" }}
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={transformedNoiseData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Making Noise (Last 7 Entries)" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Walking Chart Card */}
      <div className="results-card">
        <h3>Walking</h3>
        {isWalkingLoading ? (
          <Loader
            containerClassName="flex items-center justify-center bg-gray-50"
            containerStyle={{ height: "250px", position: "relative" }}
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={transformedWalkingData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<LineChartTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#4CAF50" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Waking Up Chart Card */}
      <div className="results-card">
        <h3>Waking Up</h3>
        {isWakingUpLoading ? (
          <Loader
            containerClassName="flex items-center justify-center bg-gray-50"
            containerStyle={{ height: "250px", position: "relative" }}
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={transformedWakingUpData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Waking Up (Last 7 Entries)" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Going to Sleep Chart Card */}
      <div className="results-card">
        <h3>Going to Sleep</h3>
        {isGoingToSleepLoading ? (
          <Loader
            containerClassName="flex items-center justify-center bg-gray-50"
            containerStyle={{ height: "250px", position: "relative" }}
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={transformedGoingToSleepData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Going to Sleep (Last 7 Entries)" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Class Activity */}
      <div className="results-card">
        <h3>Class Activity</h3>
        {classActivityData ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={transformedClassActivityData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<LineChartTooltip />} />
              <Line dataKey="value" stroke="#4CAF50" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Outdoor Activity */}
      <div className="results-card">
        <h3>Outdoor Activity</h3>
        {outdoorActivityData ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={transformedOutdoorActivityData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<LineChartTooltip />} />
              <Line dataKey="value" stroke="#4CAF50" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Junk Food Consumption */}
      <div className="results-card">
        <h3>Junk Food Consumption</h3>
        {junkFoodData ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={transformedJunkFoodData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<LineChartTooltip />} />
              <Line dataKey="value" stroke="#4CAF50" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Pie Chart Card */}
      <div className="results-card">
        <h3>School and Off Day Ratio</h3>
        {isPieLoading ? (
          <Loader
            containerClassName="flex items-center justify-center bg-gray-50"
            containerStyle={{ height: "250px", position: "relative" }}
          />
        ) : (
          pieChartData && pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieChartData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.backgroundColor || "#8884d8"} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No data available
            </div>
          )
        )}
      </div>

      {/* Average Cards */}
      <div className="results-card">
        <h3>Showing Anger</h3>
        <p>Last 7 Days: {getCount(angerData, "last7day")}</p>
        <p>Previous 7 Days: {getCount(angerData, "previous7day")}</p>
      </div>

      <div className="results-card">
        <h3>Hit With Hand</h3>
        <p>Last 7 Days: {getCount(hitHandData, "last7day")}</p>
        <p>Previous 7 Days: {getCount(hitHandData, "previous7day")}</p>
      </div>

      <div className="results-card">
        <h3>Outgoing Tendency</h3>
        <p>Last 7 Days: {getCount(outgoingTendencyData, "last7day")}</p>
        <p>Previous 7 Days: {getCount(outgoingTendencyData, "previous7day")}</p>
      </div>

      <div className="results-card">
        <h3>Bedwetting</h3>
        <p>Last 7 Days: {getCount(bedwettingData, "last7day")}</p>
        <p>Previous 7 Days: {getCount(bedwettingData, "previous7day")}</p>
      </div>

      <div className="results-card">
        <h3>Cooperation at School</h3>
        <p>Last 7 Days: {getCount(cooperateAtSchoolData, "last7day")}</p>
        <p>Previous 7 Days: {getCount(cooperateAtSchoolData, "previous7day")}</p>
      </div>

      <div className="results-card">
        <h3>Schooling Count</h3>
        <p>Last 7 Days: {getCount(schoolingCountData, "last7day")}</p>
        <p>Previous 7 Days: {getCount(schoolingCountData, "previous7day")}</p>
      </div>

      <div className="results-card">
        <h3>Therapy at School</h3>
        <p>Last 7 Days: {getCount(therapyAtSchoolCountData, "last7day")}</p>
        <p>Previous 7 Days: {getCount(therapyAtSchoolCountData, "previous7day")}</p>
      </div>

      {/* Custom Variable Charts */}
      {customVarKeys.map((key) => {
        const chartData = customVarChartData[key];
        const transformedData = chartData?.labels?.map((label, index) => ({
          date: label,
          value: chartData.datasets[0].data[index],
        })) || [];

        return (
          <div key={key} className="results-card">
            <h3>{key.replace(/_/g, ' ')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={transformedData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<LineChartTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#4CAF50" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
};

export default DailyResults;

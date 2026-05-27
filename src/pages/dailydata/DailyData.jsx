import React, { useState, useEffect, useMemo } from "react";
import Footer from "../../components/footer/Footer";
import Loader from "../../components/loader/Loader.jsx";
import { useGetUserEntriesQuery } from "../../services/getEntries.js";
import { useGetLoggedUserQuery } from "../../services/userAuthApi";
import "./DailyData.css";
import { useGetFinalScoreQuery } from "../../services/finalScoreService";
import { useRef } from "react";
import { getUserRole } from "../../services/tokenService";

const DailyData = () => {
  const token = localStorage.getItem("token");
  const userRole = getUserRole();

  useEffect(() => {
    if (userRole === "admin") {
      window.location.replace("/studentoverview/profile");
    }
  }, [userRole]);

  const { data: loggedUserData, isSuccess: isUserSuccess } =
    useGetLoggedUserQuery(token);

  const [userName, setUserName] = useState("Unknown User");
  useEffect(() => {
    if (loggedUserData && isUserSuccess) {
      setUserName(loggedUserData.user.name);
    }
  }, [loggedUserData, isUserSuccess]);

  const { data, error, isLoading } = useGetUserEntriesQuery(
    { token },
    { skip: !token }
  );

  const [filterDate, setFilterDate] = useState("");
  const [showDailyScore, setShowDailyScore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredEntries, setFilteredEntries] = useState([]);
  const dailyScoreRef = useRef(null);
  const dailyScoreChartRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [groupByDate, setGroupByDate] = useState(true);

  const getEntryDateValue = (entry) => entry?.dateOfRecord || entry?.createdAt || "";

  const formatDateValue = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? String(value).split("T")[0]
      : parsed.toLocaleDateString("en-CA");
  };

  useEffect(() => {
    if (data?.data) {
      let newEntries = data.data;
      if (filterDate) {
        newEntries = data.data.filter((entry) => {
          const entryDate = getEntryDateValue(entry);
          if (entryDate === filterDate) return true;
          try {
            const recordDate = new Date(entryDate)
              .toISOString()
              .split("T")[0];
            return recordDate === filterDate;
          } catch (e) {
            return false;
          }
        });
      }
      setFilteredEntries(newEntries);
      setCurrentPage(1);
    }
  }, [data, filterDate]);

  // Final score (daily score) query — only fetch when user requests the chart
  const finalScoreArgs = { token, userId: loggedUserData?.user?._id, rangeDays: 30 };
  const { data: finalScoreRaw } = useGetFinalScoreQuery(finalScoreArgs, { skip: !showDailyScore || !token });

  // Render daily score chart when data arrives and toggle is on
  useEffect(() => {
    if (!showDailyScore) {
      if (dailyScoreChartRef.current) {
        dailyScoreChartRef.current.destroy();
        dailyScoreChartRef.current = null;
      }
      return;
    }
    if (!finalScoreRaw || !finalScoreRaw.data) return;
    const chartData = finalScoreRaw.data;
    if (!dailyScoreRef.current || !window.Chart) return;

    // Destroy existing chart if present
    if (dailyScoreChartRef.current) {
      dailyScoreChartRef.current.destroy();
      dailyScoreChartRef.current = null;
    }

    const labels = chartData.map((d) => d.date);
    const values = chartData.map((d) => (d.finalScore === null ? null : Number(d.finalScore)));

    dailyScoreChartRef.current = new window.Chart(dailyScoreRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Daily Score",
            data: values,
            borderColor: "#007bff",
            backgroundColor: "#007bff33",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Daily Score", font: { size: 14, weight: "bold" } },
        },
        scales: { y: { beginAtZero: true, suggestedMax: 10 } },
      },
    });

    return () => {
      if (dailyScoreChartRef.current) {
        dailyScoreChartRef.current.destroy();
        dailyScoreChartRef.current = null;
      }
    };
  }, [showDailyScore, finalScoreRaw]);

  const formatTime = (timeObj) => {
    if (!timeObj) return "N/A";
    const { hour, minute } = timeObj;
    return `${hour}:${minute.toString().padStart(2, "0")}`;
  };

  const toTitleCase = (value) =>
    value
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

  const isNumericColumn = (column) => {
    const numericKeys = [
      "outgoingCount",
      "screenTime",
      "junkFood",
      "makingNoise",
      "walking",
      "showingAnger",
      "glassCrashTendency",
      "pushingTendency",
      "itemThrowTendency",
      "foodWaterThrowTendency",
      "hitWithHand",
      "hitWithHead",
      "cooperateAtSchool",
      "cooperateAtHome",
      "cuttingNails",
      "hairDressing",
      "bedwetting",
      "masturbation",
      "toilet",
      "overnightSleeping",
    ];
    return numericKeys.includes(column);
  };

  const tableColumns = useMemo(() => {
    const keys = new Set();
    const trackedVars = loggedUserData?.user?.trackedVariables || [];

    const HARDCODED_KEYS = [
      "dateOfRecord", "wakeUpTime", "wakingUp", "firstGoOut", "firstScreenOn", "breakfast", "schooling", 
      "classActivity", "outdoorActivity", "therapyAtSchool", "therapyType", "lunch", "eveningSnacks", 
      "dinner", "goingToSleep", "goToBedAt", "sleepAt", "gettingSleepTime", "outgoingTendency", 
      "outgoingCount", "screenTime", "junkFood", "makingNoise", "walking", "showingAnger", 
      "glassCrashTendency", "pushingTendency", "itemThrowTendency", "foodWaterThrowTendency", 
      "hitWithHand", "hitWithHead", "cooperateAtSchool", "cooperateAtHome", "cuttingNails", 
      "hairDressing", "bedwetting", "regularMedication", "otherSickness", "nameOfSickness", 
      "medOtherSickness", "listOfMedicine", "masturbation", "toilet", "overnightSleeping", 
      "specialActivity"
    ];

    // Always include dateOfRecord, regardless of trackedVars
    keys.add("dateOfRecord");

    filteredEntries.forEach((entry) => {
      // 1. Regular fields
      Object.keys(entry).forEach((key) => {
        // Skip dateOfRecord as it's already added
        if (key === "dateOfRecord") return;
        
        // Fallback: if trackedVars is empty, only show hardcoded defaults
        if (trackedVars.length === 0) {
          if (HARDCODED_KEYS.includes(key)) keys.add(key);
        } else {
          // Whitelist: only show what's explicitly tracked
          if (trackedVars.includes(key)) keys.add(key);
        }
      });

      // 2. Custom variables nested object
      if (entry.customVariables && typeof entry.customVariables === 'object') {
        Object.keys(entry.customVariables).forEach((ck) => {
          if (trackedVars.includes(ck)) {
            keys.add(ck);
          }
        });
      }
    });

    const excludedKeys = [
      "_id",
      "__v",
      "user",
      "userId",
      "createdAt",
      "updatedAt",
      "customVariables"
    ];
    excludedKeys.forEach((key) => keys.delete(key));

    const preferredOrder = [
      "dateOfRecord",
      "wakeUpTime",
      "wakingUp",
      "firstGoOut",
      "firstScreenOn",
      "breakfast",
      "schooling",
      "classActivity",
      "outdoorActivity",
      "therapyAtSchool",
      "therapyType",
      "lunch",
      "eveningSnacks",
      "dinner",
      "goingToSleep",
      "goToBedAt",
      "sleepAt",
      "gettingSleepTime",
      "outgoingTendency",
      "outgoingCount",
      "screenTime",
      "junkFood",
      "makingNoise",
      "walking",
      "showingAnger",
      "glassCrashTendency",
      "pushingTendency",
      "itemThrowTendency",
      "foodWaterThrowTendency",
      "hitWithHand",
      "hitWithHead",
      "cooperateAtSchool",
      "cooperateAtHome",
      "cuttingNails",
      "hairDressing",
      "bedwetting",
      "regularMedication",
      "otherSickness",
      "nameOfSickness",
      "medOtherSickness",
      "listOfMedicine",
      "masturbation",
      "toilet",
      "overnightSleeping",
      "specialActivity",
    ];

    const preferredColumns = preferredOrder.filter((column) => keys.has(column));
    const remainingColumns = [...keys].filter(
      (column) => !preferredColumns.includes(column)
    );

    return [...preferredColumns, ...remainingColumns];
  }, [filteredEntries]);

  const formatFieldValue = (entry, key) => {
    let value = entry[key];

    // Fallback to customVariables if direct key is missing
    if (value === undefined && entry.customVariables) {
      value = entry.customVariables[key];
    }

    if (value === undefined || value === null || value === "") return "N/A";
    if (key === "dateOfRecord") {
      return formatDateValue(value);
    }
    if (typeof value === "object") {
      if (value.hour !== undefined && value.minute !== undefined) {
        return formatTime(value);
      }
      if (Array.isArray(value)) {
        return value.length ? value.join(", ") : "N/A";
      }
      return JSON.stringify(value);
    }

    return String(value);
  };

  const searchedEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let results = filteredEntries;

    if (query) {
      results = filteredEntries.filter((entry) =>
        tableColumns.some((column) =>
          formatFieldValue(entry, column).toLowerCase().includes(query)
        )
      );
    }

    // Sort by dateOfRecord in descending order (latest first)
    // Create a copy before sorting to avoid mutating immutable arrays
    return [...results].sort((a, b) => {
      const dateA = new Date(getEntryDateValue(a));
      const dateB = new Date(getEntryDateValue(b));
      return dateB - dateA; // Descending order
    });
  }, [filteredEntries, searchQuery, tableColumns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  useEffect(() => {
    // reset to first page when grouping toggles
    setCurrentPage(1);
  }, [groupByDate]);
  // Optionally group entries by date (show one row per date - latest entry)
  let effectiveEntries = searchedEntries;
  if (groupByDate) {
    const counts = {};
    const latest = {};

    searchedEntries.forEach((entry) => {
      let key = "";
      try {
        key = new Date(getEntryDateValue(entry)).toISOString().split("T")[0];
      } catch (e) {
        key = String(getEntryDateValue(entry)).split("T")[0];
      }
      counts[key] = (counts[key] || 0) + 1;

      if (!latest[key] || new Date(getEntryDateValue(entry)) > new Date(getEntryDateValue(latest[key]))) {
        latest[key] = entry;
      }
    });

    effectiveEntries = Object.keys(latest)
      .map((k) => {
        const base = { ...latest[k] };
        base._groupCount = counts[k];
        base._groupDateKey = k;
        return base;
      })
      .sort((a, b) => new Date(getEntryDateValue(b)) - new Date(getEntryDateValue(a)));
  }

  const totalPages = Math.ceil(effectiveEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const displayedEntries = effectiveEntries.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Modern header */}
      <div className="dd-header mb-4">
        <div className="dd-header-left">
          <h1 className="dd-title">Daily Entries</h1>
          <p className="dd-sub">Track and review all recorded daily activities</p>
        </div>
        <div className="dd-stats">
          <div className="dd-stat">
            <div className="dd-stat-value">{data?.data?.length ?? 0}</div>
            <div className="dd-stat-label">Total Records</div>
          </div>
          <div className="dd-stat dd-stat-compact">
            <div className="dd-stat-value">{groupByDate ? effectiveEntries.length : searchedEntries.length}</div>
            <div className="dd-stat-label">Showing</div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="dd-toolbar mb-4">
        <div className="dd-toolbar-left">
          <label className="dd-label">Date</label>
          <input
            className="dd-date-input"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <button onClick={() => setFilterDate("")} className="dd-btn dd-clear">Clear</button>
          )}
        </div>

        <div className="dd-toolbar-center">
          <div className="dd-search">
            <svg className="dd-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"><path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="11" cy="11" r="6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></circle></svg>
            <input
              className="dd-search-input"
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="dd-btn dd-clear">✕</button>
            )}
          </div>
        </div>

        <div className="dd-toolbar-right">
          <div className="dd-toggle">
            <label className="dd-toggle-label">Group by Date</label>
            <div className="dd-switch" role="switch" aria-checked={groupByDate} tabIndex={0} onClick={() => setGroupByDate(v => !v)} onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); setGroupByDate(v=>!v); } }}>
              <div className={`dd-switch-thumb ${groupByDate ? 'on' : ''}`} />
            </div>
          </div>
          <button className="dd-btn dd-submit" onClick={handleNextPage} title="Go to next page">Next</button>
        </div>
      </div>
      
      {/* summary removed — replaced by toolbar */}

      {showDailyScore && (
        <div className="mb-6">
          <div className="section-title">Daily Score</div>
          <div style={{ height: 300 }} className="mb-4">
            <canvas ref={dailyScoreRef} />
          </div>
        </div>
      )}

      {isLoading && (
        <Loader containerClassName="fixed inset-0 flex items-center justify-center bg-gray-50 z-50" />
      )}
      {error && (
        <p className="text-red-500">
          Error fetching user entries. Please try again.
        </p>
      )}

      {!isLoading && displayedEntries.length > 0 && (
        <div className="daily-table-card mb-16">
          <div className="daily-table-wrapper">
            <table className="daily-data-table">
              <thead>
              <tr>
                {tableColumns.map((column) => (
                  <th
                    key={column}
                    className={`daily-th ${
                      column === "dateOfRecord"
                        ? "daily-sticky-date-header"
                        : ""
                    } ${isNumericColumn(column) ? "daily-number-col" : ""}`}
                  >
                    {toTitleCase(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedEntries.map((entry, rowIndex) => (
                <tr
                  key={entry._id || `${entry.dateOfRecord}-${rowIndex}`}
                  className="daily-row"
                >
                  {tableColumns.map((column) => (
                    <td
                      key={`${rowIndex}-${column}`}
                      className={`daily-td ${
                        column === "dateOfRecord"
                          ? "daily-sticky-date-cell"
                          : ""
                      } ${isNumericColumn(column) ? "daily-number-col" : ""}`}
                    >
                      {column === "dateOfRecord" ? (
                        <>
                          {formatFieldValue(entry, column)}
                          {entry._groupCount && entry._groupCount > 1 && (
                            <span className="ml-2 text-xs text-gray-600">({entry._groupCount} entries)</span>
                          )}
                        </>
                      ) : (
                        formatFieldValue(entry, column)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {!isLoading && displayedEntries.length === 0 && (
        <p className="mt-4 text-gray-500">
          No entries found for the current date filter/search.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-6 flex-wrap gap-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageClick(pageNumber)}
                className={`px-3 py-1 rounded-md ${
                  pageNumber === currentPage
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {pageNumber}
              </button>
            )
          )}

          <button
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DailyData;

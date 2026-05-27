import React, { useMemo, useState } from "react";
import "../../pages/dashboard/Dashboard.css";
import { useGetTherapyCalendarQuery } from "../../services/graphDataService";

const formatShort = (iso) => {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString();
};

const formatLocalIso = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const normalizeFlag = (value) => {
  if (value === true) return "yes";
  if (value === false) return "no";
  const s = String(value || "").trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(s)) return "yes";
  if (["no", "n", "false", "0"].includes(s)) return "no";
  return null;
};

const isYes = (value) => {
  if (value === true) return true;
  if (value === false) return false;
  const s = String(value || "").trim().toLowerCase();
  return s === "yes" || s === "y" || s === "true" || s === "1";
};

const isNo = (value) => {
  if (value === false) return true;
  if (value === true) return false;
  const s = String(value || "").trim().toLowerCase();
  return s === "no" || s === "n" || s === "false" || s === "0";
};

const getCellTherapyLabel = (dayEntries) => {
  const entries = dayEntries || [];
  const yesEntries = entries.filter((entry) => isYes(entry.therapyAtSchool));
  const noEntries = entries.filter((entry) => isNo(entry.therapyAtSchool));

  const therapies = yesEntries.map((entry) => String(entry.therapyType || "").trim()).filter(Boolean);
  const noTherapies = noEntries.map((entry) => String(entry.therapyType || "").trim()).filter(Boolean);

  if (therapies.length) return [...new Set(therapies)].join(", ");
  if (yesEntries.length) return "Yes"; // therapy recorded but no specific type
  if (noTherapies.length) return [...new Set(noTherapies)].join(", ");
  if (noEntries.length) return "None";

  return "-";
};

const THERAPY_TYPE_META = {
  OT: { label: "OT", color: "#0ea5e9", bg: "rgba(14,165,233,0.12)" },
  PT: { label: "PT", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  DR: { label: "DR", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  SLT: { label: "SLT", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  Others: { label: "Other", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

const normalizeTherapyType = (value) => {
  const text = String(value || "").trim();
  if (!text) return "Others";
  const upper = text.toUpperCase();
  if (THERAPY_TYPE_META[upper]) return upper;
  if (upper === "OTHER" || upper === "OTHERS") return "Others";
  return text;
};

const formatTimeFromEntry = (entry) => {
  const raw = entry?.createdAt || entry?.dateOfRecord;
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const getSessionSummary = (entry) => {
  const type = normalizeTherapyType(entry?.therapyType);
  const meta = THERAPY_TYPE_META[type] || THERAPY_TYPE_META.Others;
  const statusRaw = String(entry?.therapyAtSchool || "").trim();
  const status = statusRaw ? statusRaw : (entry?.therapyType ? "Recorded" : "Scheduled");
  const notes = String(entry?.notes || "").trim();
  const therapistName = String(
    entry?.therapistName ||
    entry?.customVariables?.therapistName ||
    entry?.therapist ||
    entry?.recordedBy ||
    ""
  ).trim() || "—";
  const duration = String(
    entry?.sessionDuration ||
    entry?.customVariables?.sessionDuration ||
    entry?.duration ||
    entry?.length ||
    ""
  ).trim() || "—";
  return {
    type,
    label: meta.label,
    color: meta.color,
    bg: meta.bg,
    status,
    notes,
    therapistName,
    duration,
  };
};

const getDaySummary = (dayEntries) => {
  const entries = Array.isArray(dayEntries) ? dayEntries : [];
  const sessions = entries.map((entry, index) => ({
    key: entry.id || `${entry.dateOfRecord || "day"}-${index}`,
    therapistName: entry?.therapistName || entry?.therapist || entry?.therapist_name || entry?.recordedBy || "—",
    time: formatTimeFromEntry(entry),
    duration: entry?.duration || entry?.sessionDuration || entry?.customVariables?.sessionDuration || entry?.length || "—",
    ...getSessionSummary(entry),
  }));

  return {
    sessions,
    hasTherapy: sessions.length > 0,
    typeKeys: [...new Set(sessions.map((session) => session.type))],
  };
};

const TherapyCalendar = ({ userId }) => {
  const today = new Date();
  const todayIso = formatLocalIso(today);
  // default view: current month
  const [endDate, setEndDate] = useState(() => {
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return formatLocalIso(last);
  });

  const getDaysInMonth = (d) => {
    const dt = new Date(d);
    return new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  };

  const [monthDays, setMonthDays] = useState(() => getDaysInMonth(today));
  const { data, isLoading } = useGetTherapyCalendarQuery({ userId, selectedDate: endDate, rangeDays: monthDays });

  const labels = data?.data?.labels || [];
  const map = data?.data?.map || {};

  const weeks = useMemo(() => {
    // build calendar matrix for displayed range -> show month containing endDate
    const end = new Date(endDate);
    const firstOfMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    const lastOfMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);

    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - start.getDay()); // start from Sunday

    const matrix = [];
    let cur = new Date(start);
    while (cur <= lastOfMonth || cur.getDay() !== 0) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      matrix.push(week);
    }
    return matrix;
  }, [endDate]);

  const onPrev = () => {
    const e = new Date(endDate);
    e.setMonth(e.getMonth() - 1);
    const last = new Date(e.getFullYear(), e.getMonth() + 1, 0);
    setEndDate(formatLocalIso(last));
    setMonthDays(getDaysInMonth(last));
  };
  const onNext = () => {
    const e = new Date(endDate);
    e.setMonth(e.getMonth() + 1);
    const last = new Date(e.getFullYear(), e.getMonth() + 1, 0);
    setEndDate(formatLocalIso(last));
    setMonthDays(getDaysInMonth(last));
  };

  const [selectedDetails, setSelectedDetails] = useState(null);
  const [selectedIso, setSelectedIso] = useState(todayIso);

  const daySummaryMap = useMemo(() => {
    const out = {};
    Object.keys(map || {}).forEach((iso) => {
      out[iso] = getDaySummary(map[iso]);
    });
    return out;
  }, [map]);

  const selectedDaySummary = daySummaryMap[selectedIso] || getDaySummary([]);

  const monthLabel = new Date(endDate).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const getCellTone = (summary) => {
    if (!summary?.hasTherapy) return "neutral";
    const firstKey = summary.sessions?.[0]?.type;
    return firstKey || "neutral";
  };

  const selectedDayEntries = selectedDetails?.entries || daySummaryMap[selectedIso]?.sessions || [];

  return (
    <div className="therapy-calendar">
      <div className="therapy-calendar-header">
        <div className="therapy-calendar-title-group">
          <div className="therapy-calendar-kicker">Therapy Calendar</div>
          <div className="therapy-calendar-title">{monthLabel}</div>
          <div className="therapy-calendar-subtitle">Click a day to inspect sessions, timing, and notes.</div>
        </div>
        <div className="therapy-calendar-controls">
          <button className="date-filter-btn therapy-nav-btn" onClick={onPrev} aria-label="Previous month">&lt;</button>
          <input
            type="month"
            value={endDate.slice(0,7)}
            onChange={(e) => {
              const val = e.target.value; // yyyy-mm
              if (!val) return;
              const [y, m] = val.split("-").map(Number);
              const last = new Date(y, m, 0); // last day of selected month
              setEndDate(formatLocalIso(last));
              setMonthDays(getDaysInMonth(last));
            }}
            aria-label="Select month and year"
            className="therapy-month-input"
          />
          <button className="date-filter-btn therapy-nav-btn" onClick={onNext} aria-label="Next month">&gt;</button>
        </div>
      </div>

      <div className="therapy-calendar-legend" aria-label="Therapy legend">
        {Object.entries(THERAPY_TYPE_META).map(([key, meta]) => (
          <span key={key} className="therapy-legend-item">
            <span className="therapy-legend-dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        ))}
        <span className="therapy-legend-item">
          <span className="therapy-legend-dot therapy-legend-dot--today" />
          Today
        </span>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (<div key={d} className="calendar-weekday">{d}</div>))}
        </div>

        <div className="calendar-body">
          {weeks.map((week, wi) => (
            <div key={wi} className="calendar-week">
              {week.map((day) => {
                const iso = formatLocalIso(day);
                const dayEntries = map[iso] || [];
                const summary = daySummaryMap[iso] || getDaySummary(dayEntries);
                const cellLabel = getCellTherapyLabel(dayEntries);
                const isToday = iso === todayIso;
                const isSelected = iso === selectedIso;
                const isMuted = day.getMonth() !== new Date(endDate).getMonth();
                
                // Classify based on what the cell displays
                let cellClass = 'calendar-cell';
                if (isMuted) {
                  cellClass += ' muted-cell';
                }
                if (cellLabel === 'None') {
                  cellClass += ' no-therapy';
                } else if (cellLabel === '-') {
                  cellClass += ' empty-cell';
                } else {
                  // cellLabel contains actual therapy types
                  cellClass += ' has-therapy';
                }
                if (isToday) cellClass += ' today-cell';
                if (isSelected) cellClass += ' selected-cell';
                
                return (
                  <button
                    key={iso}
                    type="button"
                    className={cellClass}
                    onClick={() => {
                      setSelectedIso(iso);
                      setSelectedDetails({ date: iso, entries: dayEntries });
                    }}
                    title={dayEntries.length ? `${dayEntries.length} therapy session${dayEntries.length > 1 ? 's' : ''}` : 'No therapy scheduled'}
                  >
                    <div className="calendar-cell-topline">
                      <div className="calendar-cell-date">{day.getDate()}</div>
                      {isToday && <span className="calendar-cell-today-badge">Today</span>}
                    </div>
                    <div className="calendar-cell-indicators" aria-hidden="true">
                      {summary.sessions.slice(0, 3).map((session, idx) => (
                        <span
                          key={`${session.key}-${idx}`}
                          className="calendar-dot"
                          style={{ backgroundColor: session.color }}
                        />
                      ))}
                      {summary.sessions.length > 3 && (
                        <span className="calendar-more-dot">+{summary.sessions.length - 3}</span>
                      )}
                    </div>
                    <div className="calendar-cell-content">{isLoading ? '...' : cellLabel}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

      </div>

      <div className="therapy-calendar-details">
        <div className="therapy-calendar-details-card">
          <div className="therapy-calendar-details-head">
            <div>
              <div className="therapy-calendar-details-kicker">Selected Day</div>
              <h3 className="therapy-calendar-details-title">{formatShort(selectedIso)}</h3>
            </div>
            <div className="therapy-calendar-details-count">
              {selectedDaySummary.hasTherapy ? `${selectedDaySummary.sessions.length} session${selectedDaySummary.sessions.length === 1 ? '' : 's'}` : 'No sessions'}
            </div>
          </div>

          {selectedDaySummary.hasTherapy ? (
            <div className="therapy-session-list">
              {selectedDaySummary.sessions.map((session, idx) => (
                <div key={session.key} className="therapy-session-card" style={{ borderLeftColor: session.color }}>
                  <div className="therapy-session-card-top">
                    <div className="therapy-session-type" style={{ background: session.bg, color: session.color }}>
                      {session.label}
                    </div>
                    <div className="therapy-session-time">{session.time}</div>
                  </div>
                  <div className="therapy-session-meta">
                    <span><strong>Therapist:</strong> {session.therapistName}</span>
                    <span><strong>Duration:</strong> {session.duration || '—'}</span>
                    <span><strong>Status:</strong> {session.status}</span>
                  </div>
                  <div className="therapy-session-notes">
                    <strong>Notes:</strong> {session.notes || '—'}
                  </div>
                  {idx < selectedDaySummary.sessions.length - 1 && <div className="therapy-session-divider" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="therapy-calendar-empty-state">No therapy scheduled</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapyCalendar;

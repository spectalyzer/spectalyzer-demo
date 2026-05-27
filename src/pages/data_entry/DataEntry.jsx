import React, { useEffect, useState, useMemo } from "react";
import Footer from "../../components/footer/Footer";
import "../data_entry/DataEntry.css";
import { useCreateDataEntryMutation } from "../../services/dataEntryApi";
import { useGetLoggedUserQuery, useGetMyVariableRequestsQuery } from "../../services/userAuthApi";
import { getUserRole } from "../../services/tokenService";
import { ASSESSMENT_FACTOR_GROUPS } from "../../constants/assessmentFactors";

const HARDCODED_KEYS = [
  "dateOfRecord","wakeUpTime","wakingUp","firstGoOut","firstScreenOn","breakfast","schooling",
  "classActivity","outdoorActivity","therapyAtSchool","therapyType","lunch","eveningSnacks",
  "dinner","goingToSleep","goToBedAt","sleepAt","gettingSleepTime","outgoingTendency",
  "outgoingCount","screenTime","junkFood","makingNoise","walking","showingAnger",
  "glassCrashTendency","pushingTendency","itemThrowTendency","foodWaterThrowTendency",
  "hitWithHand","hitWithHead","cooperateAtSchool","cooperateAtHome","cuttingNails",
  "hairDressing","bedwetting","regularMedication","otherSickness","nameOfSickness",
  "medOtherSickness","listOfMedicine","masturbation","toilet","overnightSleeping","specialActivity"
];

const ALL_WIZARD_STEPS = [
  { key:"dateOfRecord",   title:"Date of Record",           emoji:"📅", category:"General",   catColor:"#6366f1", catBg:"#eef2ff", desc:"Which date is this data entry for?", type:"date", alwaysShow: true },
  { key:"wakeUpTime",     title:"Wake Up At",               emoji:"⏰", category:"Morning",   catColor:"#f59e0b", catBg:"#fffbeb", desc:"What time did the student wake up this morning?", type:"time" },
  { key:"wakingUp",       title:"Waking Up Quality",        emoji:"🌅", category:"Morning",   catColor:"#f59e0b", catBg:"#fffbeb", desc:"How smoothly did the student wake up? 0 = very rough/aggressive, 10 = very calm & peaceful", type:"slider", min:0, max:10 },
  { key:"firstGoOut",     title:"1st Go Out",               emoji:"🚪", category:"Safety",    catColor:"#dc2626", catBg:"#fef2f2", desc:"How was the first hour after waking? Higher = took longer before wanting to go out (better sign)", type:"slider", min:0, max:10 },
  { key:"firstScreenOn",  title:"1st Screen On",            emoji:"📱", category:"Morning",   catColor:"#f59e0b", catBg:"#fffbeb", desc:"When did the student first use a screen? Higher = waited longer before screen use (healthier)", type:"slider", min:0, max:10 },
  { key:"breakfast",      title:"Breakfast",                emoji:"🍳", category:"Nutrition", catColor:"#10b981", catBg:"#f0fdf4", desc:"Breakfast appetite & quality. 0 = refused / no appetite, 10 = great appetite & ate normally", type:"slider", min:0, max:10 },
  { key:"schooling",      title:"Schooling Today?",         emoji:"🏫", category:"School",    catColor:"#4f46e5", catBg:"#eef2ff", desc:"Did the student attend school today?", type:"radio", options:["Yes","No"] },
  { key:"classActivity",  title:"Class Activity",           emoji:"📚", category:"School",    catColor:"#4f46e5", catBg:"#eef2ff", desc:"How active was the student in class? 0 = off day, 1 = worst, 10 = best participation", type:"slider", min:0, max:10 },
  { key:"outdoorActivity",title:"Outdoor Activity",         emoji:"⛅", category:"School",    catColor:"#4f46e5", catBg:"#eef2ff", desc:"Physical outdoor engagement at school. 0 = off day, 10 = excellent", type:"slider", min:0, max:10 },
  { key:"therapyAtSchool",title:"Therapy at School?",       emoji:"🩺", category:"School",    catColor:"#4f46e5", catBg:"#eef2ff", desc:"Did the student receive therapy at school today?", type:"radio", options:["Yes","No"] },
  { key:"therapyType",    title:"Therapy Type",             emoji:"💊", category:"School",    catColor:"#4f46e5", catBg:"#eef2ff", desc:"What type of therapy was received today?", type:"radio", options:["OT","PT","DR","SLT","Others"], condition:fd=>fd.therapyAtSchool==="Yes" },
  { key:"cooperateAtSchool",title:"Cooperate at School",    emoji:"🤝", category:"School",    catColor:"#4f46e5", catBg:"#eef2ff", desc:"How cooperative was the student at school? 0 = off day, 10 = excellent cooperation", type:"slider", min:0, max:10 },
  { key:"lunch",          title:"Lunch",                    emoji:"🍱", category:"Nutrition", catColor:"#10b981", catBg:"#f0fdf4", desc:"Lunch appetite & quality. 0 = refused, 10 = ate well & enjoyed favourite food", type:"slider", min:0, max:10 },
  { key:"eveningSnacks",  title:"Evening Snacks",           emoji:"🍎", category:"Nutrition", catColor:"#10b981", catBg:"#f0fdf4", desc:"Evening snack appetite. 0 = refused, 10 = ate well and asked for food", type:"slider", min:0, max:10 },
  { key:"dinner",         title:"Dinner",                   emoji:"🍽️", category:"Nutrition", catColor:"#10b981", catBg:"#f0fdf4", desc:"Dinner appetite & quality. 0 = refused, 10 = excellent dinner", type:"slider", min:0, max:10 },
  { key:"goingToSleep",   title:"Going to Sleep",           emoji:"😴", category:"Sleep",     catColor:"#6366f1", catBg:"#f5f3ff", desc:"How easily did the student fall asleep at night? 0 = couldn't sleep, 10 = fell asleep easily & on time", type:"slider", min:0, max:10 },
  { key:"goToBedAt",      title:"Go to Bed At",             emoji:"🛏️", category:"Sleep",     catColor:"#6366f1", catBg:"#f5f3ff", desc:"What time did the student go to bed? Enter Hour and Minute.", type:"time" },
  { key:"sleepAt",        title:"Fell Asleep At",           emoji:"💤", category:"Sleep",     catColor:"#6366f1", catBg:"#f5f3ff", desc:"What time did the student actually fall asleep? Enter Hour and Minute.", type:"time" },
  { key:"gettingSleepTime",title:"Time to Fall Asleep",     emoji:"⏱️", category:"Sleep",     catColor:"#6366f1", catBg:"#f5f3ff", desc:"How long did it take to fall asleep after going to bed? 0 = fell asleep instantly (best), 10 = took very long (worst)", type:"slider", min:0, max:10 },
  { key:"outgoingTendency",title:"Outgoing Tendency",       emoji:"🚶", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"How aggressively did the student demand to go outside? 0 = calmly accepted limits (best), 10 = very aggressive (worst)", type:"slider", min:0, max:10 },
  { key:"outgoingCount",  title:"Outgoing Count",           emoji:"🔢", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"How many times did the student go outside today? Lower is better.", type:"slider", min:0, max:10 },
  { key:"screenTime",     title:"Screen Time",              emoji:"📺", category:"Nutrition", catColor:"#10b981", catBg:"#f0fdf4", desc:"Total hours of TV/phone/tablet use today. Lower is better.", type:"slider", min:0, max:10 },
  { key:"junkFood",       title:"Junk Food",                emoji:"🍟", category:"Nutrition", catColor:"#10b981", catBg:"#f0fdf4", desc:"How much junk food (chips, biscuits, etc.) was consumed? Lower = better.", type:"slider", min:0, max:10 },
  { key:"makingNoise",    title:"Making Noise",             emoji:"📢", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"How frequently and how long did the student make noise? Lower = better.", type:"slider", min:0, max:10 },
  { key:"walking",        title:"Restless Walking",         emoji:"🚶‍♂️", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"How much did the student pace/walk restlessly around rooms? Lower = better.", type:"slider", min:0, max:10 },
  { key:"showingAnger",   title:"Showing Anger",            emoji:"😤", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"Frequency and intensity of anger displays throughout the day. Lower = better.", type:"slider", min:0, max:10 },
  { key:"glassCrashTendency",title:"Glass Crash Tendency",  emoji:"💥", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"Tendency to seek out and break glass objects. Lower = better.", type:"slider", min:0, max:10 },
  { key:"pushingTendency",title:"Pushing Tendency",         emoji:"👊", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"Tendency to push other people. Lower = better.", type:"slider", min:0, max:10 },
  { key:"itemThrowTendency",title:"Item Throw Tendency",    emoji:"🎯", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"Tendency to throw objects. Lower = better.", type:"slider", min:0, max:10 },
  { key:"foodWaterThrowTendency",title:"Food/Water Throw",  emoji:"🥤", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"Did the student throw food or water today? Lower = better.", type:"slider", min:0, max:10 },
  { key:"hitWithHand",    title:"Hit with Hand",            emoji:"✋", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"Physical aggression — hitting others with hand. Lower = better.", type:"slider", min:0, max:10 },
  { key:"hitWithHead",    title:"Hit with Head",            emoji:"🤕", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"Head-banging or hitting head on wall. Lower = better.", type:"slider", min:0, max:10 },
  { key:"cooperateAtHome",title:"Cooperate at Home",        emoji:"🏡", category:"Social",    catColor:"#8b5cf6", catBg:"#f5f3ff", desc:"How well did the student cooperate with daily activities at home? Higher = better.", type:"slider", min:0, max:10 },
  { key:"cuttingNails",   title:"Cutting Nails",            emoji:"💅", category:"Self-Care", catColor:"#10b981", catBg:"#f0fdf4", desc:"Did the student cooperate during nail cutting? Higher = better. 0 = not applicable today.", type:"slider", min:0, max:10 },
  { key:"hairDressing",   title:"Hair Dressing",            emoji:"💇", category:"Self-Care", catColor:"#10b981", catBg:"#f0fdf4", desc:"Did the student cooperate during hair care? Higher = better. 0 = not applicable today.", type:"slider", min:0, max:10 },
  { key:"bedwetting",     title:"Bedwetting",               emoji:"💧", category:"Self-Care", catColor:"#10b981", catBg:"#f0fdf4", desc:"Bedwetting option today.", type:"radio", options:["0","1","2"] },
  { key:"masturbation",   title:"Inappropriate Behavior",   emoji:"⚠️", category:"Behavior",  catColor:"#ef4444", catBg:"#fef2f2", desc:"Any inappropriate behavior incidents today? Lower = better.", type:"slider", min:0, max:10 },
  { key:"toilet",         title:"Toilet",                   emoji:"🚻", category:"Self-Care", catColor:"#10b981", catBg:"#f0fdf4", desc:"How many times did the student use the toilet? 1–2 times is normal. 0 = none (also not ideal).", type:"slider", min:0, max:10 },
  { key:"overnightSleeping",title:"Overnight Sleeping",     emoji:"🌙", category:"Sleep",     catColor:"#6366f1", catBg:"#f5f3ff", desc:"How well did the student sleep through the night? Higher = better.", type:"slider", min:0, max:10 },
  { key:"regularMedication",title:"Regular Medication",     emoji:"💊", category:"Health",    catColor:"#0ea5e9", catBg:"#f0f9ff", desc:"Did the student take their regular daily medication on time today?", type:"radio", options:["Yes","No"] },
  { key:"medicationReason",title:"Reason for No Medication",emoji:"📝", category:"Health",    catColor:"#0ea5e9", catBg:"#f0f9ff", desc:"Please provide the reason why medication was not taken today. (Required)", type:"text", condition:fd=>fd.regularMedication==="No", conditionRequired:true },
  { key:"otherSickness",  title:"Other Sickness?",          emoji:"🤒", category:"Health",    catColor:"#0ea5e9", catBg:"#f0f9ff", desc:"Does the student have any other illness today (fever, cold, stomach ache, etc.)?", type:"radio", options:["Yes","No"] },
  { key:"nameOfSickness", title:"Name of Sickness",         emoji:"🏥", category:"Health",    catColor:"#0ea5e9", catBg:"#f0f9ff", desc:"What is the name or description of the sickness?", type:"text", condition:fd=>fd.otherSickness==="Yes" },
  { key:"medOtherSickness",title:"Medication for Sickness?",emoji:"💉", category:"Health",    catColor:"#0ea5e9", catBg:"#f0f9ff", desc:"Is the student receiving medication for this sickness?", type:"radio", options:["Yes","No"], condition:fd=>fd.otherSickness==="Yes" },
  { key:"listOfMedicine", title:"List of Medicines",        emoji:"📋", category:"Health",    catColor:"#0ea5e9", catBg:"#f0f9ff", desc:"List all medicines the student is currently taking for other sickness.", type:"textarea" },
  { key:"specialActivity",title:"Special Activity",         emoji:"✨", category:"Daily Living", catColor:"#64748b", catBg:"#f8fafc", desc:"Any special, new, or unusual thing the student did today? Describe what, when, and how.", type:"textarea" },
];

const INITIAL_FORM = {
  dateOfRecord: new Date().toISOString().split('T')[0],
  wakeUpTime: { hour: 7, minute: 0 },
  wakingUp: 5, firstGoOut: 5, firstScreenOn: 5, breakfast: 5,
  schooling: "",
  classActivity: 5, outdoorActivity: 5,
  therapyAtSchool: "", therapyType: "",
  cooperateAtSchool: 5,
  lunch: 5, eveningSnacks: 5, dinner: 5,
  goingToSleep: 5,
  goToBedAt: { hour: 21, minute: 0 },
  sleepAt: { hour: 21, minute: 30 },
  gettingSleepTime: 5,
  outgoingTendency: 5, outgoingCount: 5, screenTime: 5, junkFood: 5,
  makingNoise: 5, walking: 5, showingAnger: 5, glassCrashTendency: 5,
  pushingTendency: 5, itemThrowTendency: 5, foodWaterThrowTendency: 5,
  hitWithHand: 5, hitWithHead: 5,
  cooperateAtHome: 5, cuttingNails: 5, hairDressing: 5, bedwetting: "",
  masturbation: 5, toilet: 5, overnightSleeping: 5,
  regularMedication: "", medicationReason: "",
  otherSickness: "", nameOfSickness: "", medOtherSickness: "", listOfMedicine: "",
  specialActivity: "",
  customVariables: {},
};

const getSliderColor = (val) => {
  const n = Number(val);
  if (n <= 3) return "#10b981";
  if (n <= 6) return "#f59e0b";
  return "#ef4444";
};

const DataEntry = () => {
  const userRole = getUserRole();
  useEffect(() => {
    if (userRole === "admin") window.location.replace("/studentoverview/profile");
  }, [userRole]);

  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [slideDir, setSlideDir] = useState("forward");
  const [animKey, setAnimKey] = useState(0);

  const [dataEntry] = useCreateDataEntryMutation();
  const token = localStorage.getItem("token");
  const { data: userData } = useGetLoggedUserQuery(token, { skip: !token });
  const trackedVars = userData?.user?.trackedVariables || [];

  const { data: myVarReqData } = useGetMyVariableRequestsQuery(undefined, { skip: !token });
  const myVarRequests = myVarReqData?.data || [];

  const shouldShow = (key) => {
    if (trackedVars.length === 0) return HARDCODED_KEYS.includes(key);
    
    // Auto-include conditional child variables if their parent variable is tracked
    if (key === "medicationReason" && trackedVars.includes("regularMedication")) return true;
    if (key === "therapyType" && trackedVars.includes("therapyAtSchool")) return true;
    if ((key === "nameOfSickness" || key === "medOtherSickness") && trackedVars.includes("otherSickness")) return true;

    return trackedVars.includes(key);
  };

  const steps = useMemo(() => {
    const filtered = ALL_WIZARD_STEPS.filter(step => {
      if (step.condition && !step.condition(formData)) return false;
      if (step.alwaysShow) return true;
      return shouldShow(step.key);
    });
    const customSteps = trackedVars
      .filter(k => !HARDCODED_KEYS.includes(k))
      .map(k => {
        // Look up in ASSESSMENT_FACTOR_GROUPS for rich metadata
        let groupMatch = null;
        let factorMatch = null;
        for (const group of ASSESSMENT_FACTOR_GROUPS) {
          const factor = group.factors.find(f => f.key === k);
          if (factor) { groupMatch = group; factorMatch = factor; break; }
        }
        // Map assessmentFactor type to wizard step type
        const factorType = factorMatch?.type || "slider";
        const stepType = factorType === "yesno" ? "radio"
          : factorType === "select" ? "radio"
          : factorType === "text" ? "textarea"
          : "slider"; // default
        const stepOptions = factorType === "yesno"
          ? ["Yes", "No"]
          : factorType === "select"
            ? (factorMatch?.options || [])
            : undefined;

        // Resolve standard category dynamically using groupMatch or variableRequests fallback
        const matchedGroup = groupMatch || (() => {
          const varReq = myVarRequests.find(r => r.variableKey === k);
          const stored = varReq?.variableCategory || "";
          return ASSESSMENT_FACTOR_GROUPS.find(g => g.category === stored);
        })() || ASSESSMENT_FACTOR_GROUPS.find(g => g.category === "🚿 Self-Care");

        // Category display — strip leading emoji character from group category
        const catLabel = matchedGroup.category.replace(/^\S+\s*/, "");

        return {
          key: k, isCustom: true,
          title: factorMatch?.label || k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          emoji: "📊",
          category: catLabel,
          catColor: matchedGroup.color,
          catBg: matchedGroup.bgColor,
          desc: factorMatch?.desc || "Enter a value from 0 to 10.",
          type: stepType,
          options: stepOptions,
          min: 0, max: 10, alwaysShow: true,
        };
      });
    return [...filtered, ...customSteps];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.therapyAtSchool, formData.regularMedication, formData.otherSickness, trackedVars.join(","), myVarRequests]);

  const safeStep = Math.min(currentStep, Math.max(0, steps.length - 1));
  const stepDef = steps[safeStep] || null;
  const totalSteps = steps.length;
  const progressPct = totalSteps > 1 ? (safeStep / (totalSteps - 1)) * 100 : 100;
  const isLastStep = safeStep === totalSteps - 1;

  const navigate = (dir) => {
    setSlideDir(dir);
    setAnimKey(k => k + 1);
    if (dir === "forward" && safeStep < totalSteps - 1) setCurrentStep(s => s + 1);
    if (dir === "back" && safeStep > 0) setCurrentStep(s => s - 1);
  };

  const getVal = (stepDef) => {
    if (!stepDef) return "";
    if (stepDef.isCustom) return formData.customVariables[stepDef.key] ?? 5;
    const k = stepDef.key;
    if (k === "wakeUpTime" || k === "goToBedAt" || k === "sleepAt")
      return formData[k] || { hour: 0, minute: 0 };
    return formData[k];
  };

  const setValue = (stepDef, value) => {
    if (!stepDef) return;
    if (stepDef.isCustom) {
      setFormData(prev => ({
        ...prev,
        customVariables: { ...prev.customVariables, [stepDef.key]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [stepDef.key]: value }));
    }
  };

  const handleTimeChange = (key, part, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: { ...prev[key], [part]: Number(value) },
    }));
  };

  const handleSubmit = async () => {
    if (formData.regularMedication === "No" && !String(formData.medicationReason || "").trim()) {
      setSubmitMsg({ type: "error", text: "Please go back and provide a reason for not taking medication." });
      return;
    }
    setIsSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await dataEntry({ formData }).unwrap();
      const ok = res?.status === "success" || res?.data?.status === "success";
      if (ok) {
        setSubmitMsg({ type: "success", text: res?.message || "✅ Data entry submitted successfully!" });
        setTimeout(() => {
          setFormData({ ...INITIAL_FORM, dateOfRecord: new Date().toISOString().split('T')[0] });
          setCurrentStep(0);
          setSubmitMsg(null);
        }, 2800);
      } else {
        setSubmitMsg({ type: "error", text: res?.message || "Unexpected error occurred." });
      }
    } catch (err) {
      setSubmitMsg({ type: "error", text: err?.data?.message || "Data Entry Failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = () => {
    if (!stepDef) return null;
    const { key, type, options, min, max, isCustom } = stepDef;
    const val = getVal(stepDef);

    if (type === "slider") {
      const numVal = typeof val === "number" ? val : 5;
      const color = getSliderColor(numVal);
      return (
        <div className="wiz-slider-wrap">
          <div className="wiz-slider-value" style={{ color }}>
            <span className="wiz-val-num">{numVal}</span>
            <span className="wiz-val-label">/ 10</span>
          </div>
          <div className="wiz-slider-dots-row">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`wiz-dot-btn ${i === numVal ? "active" : i < numVal ? "filled" : ""}`}
                style={i <= numVal ? { background: color, borderColor: color } : {}}
                onClick={() => setValue(stepDef, i)}
              >
                {i}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={min ?? 0}
            max={max ?? 10}
            value={numVal}
            onChange={e => setValue(stepDef, Number(e.target.value))}
            className="wiz-range"
            style={{ "--thumb-color": color, "--fill-color": color }}
          />
        </div>
      );
    }

    if (type === "radio") {
      return (
        <div className={`wiz-radio-group ${options.length > 3 ? "wiz-radio-multi" : ""}`}>
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              className={`wiz-radio-btn ${val === opt ? "selected" : ""}`}
              onClick={() => setValue(stepDef, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (type === "date") {
      return (
        <input
          type="date"
          className="wiz-text-input"
          value={val || ""}
          onChange={e => setValue(stepDef, e.target.value)}
        />
      );
    }

    if (type === "time") {
      const timeVal = val || { hour: 0, minute: 0 };
      return (
        <div className="wiz-time-group">
          <div className="wiz-time-box">
            <input
              type="number"
              className="wiz-time-num"
              value={String(timeVal.hour).padStart(2, "0")}
              min={0} max={23}
              onChange={e => handleTimeChange(key, "hour", e.target.value)}
            />
            <span className="wiz-time-unit">Hour</span>
          </div>
          <div className="wiz-time-colon">:</div>
          <div className="wiz-time-box">
            <input
              type="number"
              className="wiz-time-num"
              value={String(timeVal.minute).padStart(2, "0")}
              min={0} max={59}
              onChange={e => handleTimeChange(key, "minute", e.target.value)}
            />
            <span className="wiz-time-unit">Minute</span>
          </div>
        </div>
      );
    }

    if (type === "text") {
      return (
        <input
          type="text"
          className="wiz-text-input"
          value={val || ""}
          onChange={e => setValue(stepDef, e.target.value)}
          placeholder="Type your answer here…"
        />
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          className="wiz-textarea"
          value={val || ""}
          onChange={e => setValue(stepDef, e.target.value)}
          placeholder="Type here…"
          rows={4}
        />
      );
    }

    return null;
  };

  // Render control for a specific step (used by category cards)
  const renderControl = (s) => {
    if (!s) return null;
    const { key, type, options, min, max } = s;
    const stepVal = getVal(s);

    if (type === "slider") {
      const numVal = typeof stepVal === "number" ? stepVal : 5;
      const color = getSliderColor(numVal);
      return (
        <div className="wiz-slider-wrap">
          <div className="wiz-slider-value" style={{ color }}>
            <span className="wiz-val-num">{numVal}</span>
            <span className="wiz-val-label">/ 10</span>
          </div>
          <div className="wiz-slider-dots-row">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`wiz-dot-btn ${i === numVal ? "active" : i < numVal ? "filled" : ""}`}
                style={i <= numVal ? { background: color, borderColor: color } : {}}
                onClick={() => setValue(s, i)}
              >
                {i}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={min ?? 0}
            max={max ?? 10}
            value={numVal}
            onChange={e => setValue(s, Number(e.target.value))}
            className="wiz-range"
            style={{ "--thumb-color": color, "--fill-color": color }}
          />
        </div>
      );
    }

    if (type === "radio") {
      return (
        <div className={`wiz-radio-group ${options?.length > 3 ? "wiz-radio-multi" : ""}`}>
          {options?.map(opt => (
            <button
              key={opt}
              type="button"
              className={`wiz-radio-btn ${stepVal === opt ? "selected" : ""}`}
              onClick={() => setValue(s, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (type === "date") {
      return (
        <input
          type="date"
          className="wiz-text-input"
          value={stepVal || ""}
          onChange={e => setValue(s, e.target.value)}
        />
      );
    }

    if (type === "time") {
      const timeVal = stepVal || { hour: 0, minute: 0 };
      return (
        <div className="wiz-time-group">
          <div className="wiz-time-box">
            <input
              type="number"
              className="wiz-time-num"
              value={String(timeVal.hour).padStart(2, "0")}
              min={0} max={23}
              onChange={e => handleTimeChange(key, "hour", e.target.value)}
            />
            <span className="wiz-time-unit">Hour</span>
          </div>
          <div className="wiz-time-colon">:</div>
          <div className="wiz-time-box">
            <input
              type="number"
              className="wiz-time-num"
              value={String(timeVal.minute).padStart(2, "0")}
              min={0} max={59}
              onChange={e => handleTimeChange(key, "minute", e.target.value)}
            />
            <span className="wiz-time-unit">Minute</span>
          </div>
        </div>
      );
    }

    if (type === "text") {
      return (
        <input
          type="text"
          className="wiz-text-input"
          value={stepVal || ""}
          onChange={e => setValue(s, e.target.value)}
          placeholder="Type your answer here…"
        />
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          className="wiz-textarea"
          value={stepVal || ""}
          onChange={e => setValue(s, e.target.value)}
          placeholder="Type here…"
          rows={4}
        />
      );
    }

    return null;
  };

          // Build canonical groups and dedupe keys globally so one variable appears in only one submenu.
          const allVarsByCategory = useMemo(() => {
            const groups = {};
            const canonicalCategoryByKey = {};
            const locationByKey = {};

            // 1) Seed groups from ASSESSMENT_FACTOR_GROUPS and remember each key's canonical category.
            for (const g of ASSESSMENT_FACTOR_GROUPS) {
              groups[g.category] = [];
              for (const f of g.factors || []) {
                canonicalCategoryByKey[f.key] = g.category;
                const row = {
                  key: f.key,
                  label: f.label,
                  title: f.label,
                  desc: f.desc,
                  type: f.type,
                  options: f.options,
                  emoji: undefined,
                };
                groups[g.category].push(row);
                locationByKey[f.key] = { category: g.category, index: groups[g.category].length - 1 };
              }
            }

            // 2) Merge wizard metadata by key into canonical row; if key not known, append once.
            for (const step of ALL_WIZARD_STEPS) {
              const key = step.key;
              // Date of Record is displayed in header, not as a submenu/category card.
              if (key === "dateOfRecord") continue;
              const canonicalCat = canonicalCategoryByKey[key] || step.category || "Other";
              if (!groups[canonicalCat]) groups[canonicalCat] = [];

              if (locationByKey[key]) {
                const { category, index } = locationByKey[key];
                const existing = groups[category][index];
                groups[category][index] = {
                  ...existing,
                  title: step.title || existing.title,
                  desc: step.desc || existing.desc,
                  type: step.type || existing.type,
                  options: step.options || existing.options,
                  emoji: step.emoji || existing.emoji,
                };
              } else {
                const row = {
                  key,
                  label: step.title || key,
                  title: step.title || key,
                  desc: step.desc || "",
                  type: step.type,
                  options: step.options,
                  emoji: step.emoji,
                };
                groups[canonicalCat].push(row);
                locationByKey[key] = { category: canonicalCat, index: groups[canonicalCat].length - 1 };
              }
            }

            return groups;
          }, []);

          const preferredCategoryOrder = useMemo(() => ([
            "😴 Sleep",
            "🍽️ Nutrition",
            "🏫 School & Social Activity",
            "🏥 Health & Medical",
            "🚿 Self-Care",
            "🥊 Aggression Towards Others",
            "🛑 Self Harm & Safety",
            "🏠 Daily Living",
          ]), []);

          const defaultCategories = useMemo(() => {
            const categoriesFromConfig = ASSESSMENT_FACTOR_GROUPS.map(g => g.category);
            const orderedPreferred = preferredCategoryOrder.filter(c => categoriesFromConfig.includes(c));
            const remainingConfigured = categoriesFromConfig.filter(c => !orderedPreferred.includes(c));
            return [...orderedPreferred, ...remainingConfigured];
          }, [preferredCategoryOrder]);
          const extraCategories = useMemo(
            () => Object.keys(allVarsByCategory).filter(c => !defaultCategories.includes(c) && (allVarsByCategory[c] || []).length > 0),
            [allVarsByCategory, defaultCategories]
          );
          const displayCategories = useMemo(
            () => defaultCategories.filter(c => (allVarsByCategory[c] || []).length > 0).concat(extraCategories),
            [defaultCategories, extraCategories, allVarsByCategory]
          );

          const [selectedCategory, setSelectedCategory] = useState(() => displayCategories[0] || null);
          useEffect(() => {
            if (!selectedCategory || !displayCategories.includes(selectedCategory)) {
              setSelectedCategory(displayCategories[0] || null);
            }
          }, [displayCategories, selectedCategory]);

          return (
            <div className="wiz-page">
              {/* Header bar */}
              <div className="wiz-header">
                <div className="wiz-header-inner">
                  <div className="wiz-header-title">📋 Daily Data Entry</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label htmlFor="date-of-record" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                      Date of Record
                    </label>
                    <input
                      id="date-of-record"
                      type="date"
                      value={formData.dateOfRecord || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfRecord: e.target.value }))}
                      className="wiz-text-input"
                      style={{ width: 170, padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      className="wiz-btn wiz-btn-submit"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting…" : "✓ Submit"}
                    </button>
                  </div>
                </div>
                <div className="wiz-progress-track" style={{ height: 6 }}>
                  <div className="wiz-progress-fill" style={{ width: `0%` }} />
                </div>
              </div>

                {/* Category submenu (original category names) */}
                <div className="wiz-cats">
                  <div className="wiz-cats-inner">
                    {displayCategories.map(cat => {
                      const count = (allVarsByCategory[cat] || []).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          className={`wiz-cat-btn ${cat === selectedCategory ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(cat)}
                          title={cat}
                        >
                          {cat}
                          <span style={{ marginLeft: 8, fontSize: '0.8rem', opacity: 0.7 }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              <div className="wiz-body">
                {submitMsg && (
                  <div className={`wiz-msg ${submitMsg.type === "success" ? "wiz-msg-ok" : "wiz-msg-err"}`}>
                    {submitMsg.text}
                  </div>
                )}

                <div className="var-cards-grid">
                    {(allVarsByCategory[selectedCategory] || []).map(s => (
                    <div className="var-card" key={s.key}>
                      <div className="var-card-head">
                        <div className="var-card-title">{s.emoji || '•'} {s.title || s.label || s.key}</div>
                        <div className="var-card-metric">{String(getVal(s) || 'N/A')}</div>
                      </div>
                      <div className="var-card-desc">{s.desc || s.label || ''}</div>
                      <div className="var-card-input">{renderControl(s)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Footer />
            </div>
          );
};

export default DataEntry;

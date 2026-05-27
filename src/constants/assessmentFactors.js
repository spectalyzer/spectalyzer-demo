// type: "slider" = 0-10 numeric scale
//       "yesno"  = Yes / No radio
//       "select" = multi-option categorical (e.g. OT/HT/PT)
//       "text"   = free-text entry
export const ASSESSMENT_FACTOR_GROUPS = [
  {
    category: "🛑 Self Harm & Safety",
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    description: "Variables related to self-injury and safety concerns",
    factors: [
      { key: "hitWithHead",        label: "Hitting with Head",       desc: "Self-injurious head-hitting behavior",           type: "slider" },
      { key: "glassCrashTendency", label: "Glass Crash Tendency",    desc: "Tendency to break glass objects",               type: "slider" },
      { key: "firstGoOut",         label: "First Go Out",            desc: "Time/rating for the first outing after waking",  type: "slider" },
    ]
  },
  {
    category: "🥊 Aggression Towards Others",
    color: "#ea580c",
    bgColor: "#fff7ed",
    borderColor: "#fed7aa",
    description: "Variables related to harming others and disruptive behavior",
    factors: [
      { key: "showingAnger",           label: "Showing Anger",         desc: "Frequency of anger outbursts (0–10 scale)",      type: "slider" },
      { key: "hitWithHand",            label: "Hitting with Hand",     desc: "Physical aggression incidents",                  type: "slider" },
      { key: "pushingTendency",        label: "Pushing Tendency",      desc: "Tendency to push others",                        type: "slider" },
      { key: "itemThrowTendency",      label: "Item Throw Tendency",   desc: "Tendency to throw objects",                     type: "slider" },
      { key: "foodWaterThrowTendency", label: "Food/Water Throw",      desc: "Throwing food or water",                         type: "slider" },
      { key: "makingNoise",            label: "Making Noise",          desc: "Excessive noise-making behavior",                type: "slider" },
    ]
  },
  {
    category: "🏥 Health & Medical",
    color: "#0ea5e9",
    bgColor: "#f0f9ff",
    borderColor: "#bae6fd",
    description: "Tracks medication, illness and medical history",
    factors: [
      { key: "regularMedication", label: "Regular Medication",      desc: "Did the student take regular medication today?",           type: "yesno" },
      { key: "medicationReason",  label: "Reason (No Medication)",  desc: "Reason why medication was not taken today",                type: "text"  },
      { key: "otherSickness",     label: "Other Sickness?",         desc: "Does the student have any other illness today?",           type: "yesno" },
      { key: "nameOfSickness",    label: "Name of Sickness",        desc: "Specific diagnosed conditions or illness today",           type: "text"  },
      { key: "medOtherSickness",  label: "Medication for Sickness", desc: "Is the student receiving medication for this sickness?",   type: "yesno" },
      { key: "listOfMedicine",    label: "List of Medicines",       desc: "All medicines currently being administered",               type: "text"  },
      { key: "medical_records",   label: "Medical Records",         desc: "Attached medical documents and records",                   type: "text"  },
    ]
  },
  {
    category: "🏫 School & Social Activity",
    color: "#4f46e5",
    bgColor: "#eef2ff",
    borderColor: "#c7d2fe",
    description: "Tracks school attendance, class participation & social behavior",
    factors: [
      { key: "schooling",         label: "Schooling",              desc: "Whether student attended school (Yes/No)",            type: "yesno"  },
      { key: "classActivity",     label: "Class Activity",         desc: "Participation level in class (0–10)",                 type: "slider" },
      { key: "outdoorActivity",   label: "Outdoor Activity",       desc: "Physical activity & engagement outdoors (0–10)",      type: "slider" },
      { key: "therapyAtSchool",   label: "Therapy at School",      desc: "Whether therapy session was completed (Yes/No)",      type: "yesno"  },
      { key: "therapyType",       label: "Therapy Type",           desc: "Type of therapy received (OT/PT/DR/SLT/Others)",     type: "select", options: ["OT", "PT", "DR", "SLT", "Others"] },
      { key: "cooperateAtSchool", label: "Cooperate at School",    desc: "Level of cooperation at school (0–10)",               type: "slider" },
      { key: "cooperateAtHome",   label: "Cooperate at Home",      desc: "Level of cooperation at home (0–10)",                 type: "slider" },
      { key: "outgoingTendency",  label: "Outgoing Tendency",      desc: "Tendency to go outside / social desire (0–10)",       type: "slider" },
      { key: "outgoingCount",     label: "Outgoing Count",         desc: "Number of times went outside today",                  type: "slider" },
    ]
  },
  {
    category: "🍽️ Nutrition",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    description: "Tracks meal intake and nutrition-related habits",
    factors: [
      { key: "breakfast",     label: "Breakfast",             desc: "Morning meal intake score (0–10)",                      type: "slider" },
      { key: "lunch",         label: "Lunch",                 desc: "Midday meal intake score (0–10)",                       type: "slider" },
      { key: "dinner",        label: "Dinner",                desc: "Evening meal intake score (0–10)",                      type: "slider" },
      { key: "eveningSnacks", label: "Evening Snacks",        desc: "Snack consumption pattern (0–10)",                      type: "slider" },
      { key: "junkFood",      label: "Junk Food",             desc: "Frequency of junk food consumption (lower = better)",   type: "slider" },
    ]
  },
  {
    category: "😴 Sleep",
    color: "#6366f1",
    bgColor: "#f5f3ff",
    borderColor: "#c7d2fe",
    description: "Tracks bedtime, sleep quality, and morning wake-up behavior",
    factors: [
      { key: "wakeUpTime",        label: "Wake Up At",          desc: "What time did the student wake up this morning?",        type: "text" },
      { key: "wakingUp",          label: "Waking Up Quality",   desc: "Ease of waking up in the morning (0–10)",               type: "slider" },
      { key: "firstScreenOn",     label: "First Screen On",     desc: "When first screen used — higher = waited longer (healthier)", type: "slider" },
      { key: "screenTime",        label: "Screen Time",         desc: "Total daily screen time duration (lower = better)",     type: "slider" },
      { key: "goToBedAt",         label: "Go to Bed At",        desc: "What time did the student go to bed?",                  type: "text" },
      { key: "sleepAt",           label: "Fell Asleep At",      desc: "What time did the student actually fall asleep?",        type: "text" },
      { key: "goingToSleep",      label: "Going to Sleep",      desc: "Ease of falling asleep at night (0–10)",                type: "slider" },
      { key: "gettingSleepTime",  label: "Time to Fall Asleep", desc: "Duration to fall asleep after going to bed (0–10)",     type: "slider" },
      { key: "overnightSleeping", label: "Overnight Sleeping",  desc: "Quality of overnight sleep (higher = better)",          type: "slider" },
      { key: "walking",           label: "Restless Walking",    desc: "Pacing / restless walking behavior (lower = better)",   type: "slider" },
    ]
  },
  {
    category: "🚿 Self-Care",
    color: "#10b981",
    bgColor: "#f0fdf4",
    borderColor: "#a7f3d0",
    description: "Evaluates hygiene habits and personal self-care",
    factors: [
      { key: "cuttingNails",   label: "Cutting Nails",          desc: "Cooperation during nail hygiene (0–10)",              type: "slider" },
      { key: "hairDressing",   label: "Hair Dressing",          desc: "Cooperation during hair care (0–10)",                 type: "slider" },
      { key: "toilet",         label: "Toilet",                 desc: "Toilet independence level / frequency (0–10)",        type: "slider" },
      { key: "bedwetting",     label: "Bedwetting",             desc: "Bedwetting option today (0, 1, or 2)",                type: "select", options: ["0", "1", "2"] },
      { key: "masturbation",   label: "Inappropriate Behavior", desc: "Inappropriate behavior incidents (lower = better)",   type: "slider" },
    ]
  },
  {
    category: "🏠 Daily Living",
    color: "#64748b",
    bgColor: "#f8fafc",
    borderColor: "#cbd5e1",
    description: "Captures daily routine notes and home living context",
    factors: [
      { key: "specialActivity",label: "Special Activity",       desc: "Any special or unusual activity today",               type: "text"   },
    ]
  }
];

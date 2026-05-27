import React from "react";
import dataCollectionIcon from "../../assets/animated icon/database-table.gif";
import dataAnalysisicon from "../../assets/animated icon/gears.gif";
import graphIcon from "../../assets/animated icon/line-bars.gif";
import planningIcon from "../../assets/animated icon/stethoscope.gif";
import observationLogo from "../../assets/animated icon/search-file.gif";
import dataCollectionIcon2 from "../../assets/animated icon/database-table2.gif";
import "./HowWorks.css";

const HowWorks = () => {
  const steps = [
    {
      title: "Data Collection",
      description: "Parents and caregivers capture daily activity data with clear, consistent prompts.",
      icon: dataCollectionIcon2,
    },
    {
      title: "Data Analysis",
      description: "Specialists interpret the data and compute daily scores using factor analysis.",
      icon: dataAnalysisicon,
    },
    {
      title: "Graphical Insights",
      description: "Results are visualized with clear charts that highlight trends and patterns.",
      icon: graphIcon,
    },
    {
      title: "Therapy Planning",
      description: "Therapists design personalized interventions based on the latest insights.",
      icon: planningIcon,
    },
    {
      title: "Observation",
      description: "Teams observe progress and collect targeted notes to support the next cycle.",
      icon: observationLogo,
    },
    {
      title: "Continuous Improvement",
      description: "New observations feed back into the system to refine care and outcomes.",
      icon: dataCollectionIcon2,
    },
  ];

  return (
    <section className="howworks-pro" id="how-works">
      <div className="howworks-shell">
        <div className="howworks-header">
          <p className="howworks-eyebrow">Workflow</p>
          <h2 className="howworks-title">How Spectalyzer Works</h2>
          <p className="howworks-subtitle">
            A clear, repeatable process that turns daily observations into measurable progress.
          </p>
        </div>

        <div className="howworks-grid">
          {steps.map((step, index) => (
            <div key={step.title} className="howworks-card">
              <div className="howworks-card-top">
                <span className="howworks-step">0{index + 1}</span>
                <img className="howworks-icon" src={step.icon} alt={step.title} />
              </div>
              <h3 className="howworks-card-title">{step.title}</h3>
              <p className="howworks-card-text">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowWorks;

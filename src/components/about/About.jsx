import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import kidPicture from "../../assets/images/boy-game.jpg";
import plannedLogo from "../../assets/icon/planned.png";
import visionLogo from "../../assets/icon/vision.webp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnchor } from "@fortawesome/free-solid-svg-icons";
import "./About.css";

const About = () => {
  useEffect(() => {
    AOS.init({ duration: 2000 });
  }, []);

  return (
    <section className="about-pro" id="about">
      <div className="about-shell">
        <div className="about-grid">
          <div className="about-content">
            <p className="about-eyebrow">About Spectalyzer</p>
            <h2 className="about-title">
              Autistic <span> Spectrum</span> Analyzer
            </h2>
            <p className="about-subtitle">Graphical presentation makes progress easy to understand.</p>

            <div className="about-card" data-aos="fade-up">
              <span className="about-card-icon">
                <img src={plannedLogo} alt="Planned" />
              </span>
              <div>
                <h3>A Planned Way of Therapy</h3>
                <p>
                  Clear visual summaries help caregivers and therapists track daily activity and make
                  informed, consistent decisions.
                </p>
              </div>
            </div>

            <div className="about-card" data-aos="fade-up">
              <span className="about-card-icon">
                <img src={visionLogo} alt="Vision" />
              </span>
              <div>
                <h3>Vision</h3>
                <p>
                  Empower parents, therapists, and caregivers with tools that improve understanding of
                  autistic children’s activities.
                </p>
              </div>
            </div>

            <div className="about-card" data-aos="fade-up">
              <span className="about-card-icon">
                <FontAwesomeIcon icon={faAnchor} size="lg" />
              </span>
              <div>
                <h3>Mission</h3>
                <p>
                  Deliver a comprehensive web-based platform that tracks, analyzes, and supports care plans
                  with measurable insights.
                </p>
              </div>
            </div>
          </div>

          <div className="about-media" data-aos="fade-up">
            <div className="about-image-card">
              <img src={kidPicture} alt="Kid playing with blocks" />
              <div className="about-image-caption">
                Supporting confident decisions through structured observation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

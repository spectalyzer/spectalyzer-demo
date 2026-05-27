import React, { useEffect, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import bgImg from "../../assets/images/hero-original2.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  const [bgOffset, setBgOffset] = useState(0);
  const tickingRef = useRef(false);
  useEffect(() => {
    AOS.init({ duration: "2000" });
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        setBgOffset(window.scrollY * 0.35);
        tickingRef.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/student");
  };
  return (
    <div
      className="hero-parallax"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundPosition: `center ${bgOffset}px`,
      }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content relative flex flex-col items-center justify-center text-center h-full px-6 sm:px-12 md:px-24 lg:px-32">
        <div className="hero-panel">
          <p className="hero-eyebrow" data-aos="fade-down">
            Evidence-Led Autism Care
          </p>
          <p className="hero-title" data-aos="fade-down">
            Spectalyzer, <span>Spectrum </span>
            Analyzer
          </p>
          <p className="hero-subtitle" data-aos="fade-up">
            Turn daily observations into clear, clinically useful insights with
            structured tracking, validated scoring, and decision-ready visuals.
          </p>
          <div className="hero-chips" data-aos="fade-up">
            <span className="hero-chip">Consistent daily logs</span>
            <span className="hero-chip">Personalized therapy planning</span>
            <span className="hero-chip">Progress you can share</span>
          </div>
          <button className="hero-cta" data-aos="fade-down" onClick={handleClick}>
            Join Now <FontAwesomeIcon className="hero-cta-icon" icon={faHeart} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;

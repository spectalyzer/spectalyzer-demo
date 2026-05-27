import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../services/LocalStorageService";
import Navbar from "../navbar/Navbar.jsx";
import About from "../about/About.jsx";
import Hero from "../hero/Hero.jsx";
import HowWorks from "../howitworks/HowWorks";
import Testimonials from "../Testimonials.jsx";
import Contact from "../contact/Contact";
import Footer from "../footer/Footer.jsx";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const stepOrder = useMemo(
    () => [
      { id: "hero", title: "Hero" },
      { id: "about", title: "About Us" },
      { id: "how", title: "How It Works" },
      { id: "testimonials", title: "Testimonials" },
      { id: "contact", title: "Contact" },
    ],
    []
  );
  const [currentStep, setCurrentStep] = useState(0);
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const howRef = useRef(null);
  const testimonialsRef = useRef(null);
  const contactRef = useRef(null);

  const sectionRefs = {
    hero: heroRef,
    about: aboutRef,
    how: howRef,
    testimonials: testimonialsRef,
    contact: contactRef,
  };

  useEffect(() => {
    const hashToStep = {
      "#about": 1,
      "#how-works": 2,
      "#testimonials": 3,
      "#contact-us": 4,
    };

    const handleHashChange = () => {
      const targetStep = hashToStep[window.location.hash];
      if (targetStep === undefined) return;
      setCurrentStep(targetStep);
      const nextId = stepOrder[targetStep].id;
      setTimeout(() => {
        sectionRefs[nextId]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
      setTimeout(() => {
        sectionRefs[nextId]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 650);
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [stepOrder]);

  const handleNextStep = () => {
    if (currentStep < stepOrder.length - 1) {
      const nextStep = currentStep + 1;
      const nextId = stepOrder[nextStep].id;
      setCurrentStep(nextStep);
        setTimeout(() => {
          sectionRefs[nextId]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
        setTimeout(() => {
          sectionRefs[nextId]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 650);
      return;
    }
    const token = getToken();
    if (token) navigate("/studentoverview/profile");
    else navigate("/login");
  };

  const nextLabel =
    currentStep < stepOrder.length - 1
      ? `Next: ${stepOrder[currentStep + 1].title}`
      : "Go to Profile";

  return (
    <div className="home-shell">
      <div ref={heroRef} className={`home-step ${currentStep >= 0 ? "is-active" : ""}`}>
        <Hero />
      </div>
      <div ref={aboutRef} className={`home-step ${currentStep >= 1 ? "is-active" : ""}`}>
        <About />
      </div>
      <div ref={howRef} className={`home-step ${currentStep >= 2 ? "is-active" : ""}`}>
        <HowWorks />
      </div>
      <div ref={testimonialsRef} className={`home-step ${currentStep >= 3 ? "is-active" : ""}`}>
        <Testimonials />
      </div>
      <div ref={contactRef} className={`home-step ${currentStep >= 4 ? "is-active" : ""}`}>
        <Contact />
      </div>
      <Footer />

      <div className="home-step-control">
        <button className="home-step-button" onClick={handleNextStep}>
          {nextLabel}
        </button>
        <div className="home-step-meta">
          Step {currentStep + 1} of {stepOrder.length}
        </div>
      </div>
    </div>
  );
};

export default Home;

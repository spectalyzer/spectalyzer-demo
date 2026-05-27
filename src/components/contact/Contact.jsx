import React from "react";
import specContactLogo from "../../assets/images/spectalyzer-logo-26_bg-removeb.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMobileScreen,
  faEnvelope,
  faLocationDot,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import "./Contact.css";

const Contact = () => {
  return (
    <div className="contact-pro" id="contact-us">
      <div className="contact-shell">
        <div className="contact-header">
          <p className="contact-eyebrow">Spectalyzer</p>
          <h2 className="contact-title">Contact Our Team</h2>
          <p className="contact-subtitle">
            Reliable support for families and clinicians who value clarity, consistency, and care.
          </p>
          <p className="contact-note">We respond quickly and treat every inquiry with priority and respect.</p>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <img className="contact-logo" src={specContactLogo} alt="Spectalyzer Logo" />
            <p className="contact-body">
              Spectalyzer blends factor analysis and time series insights to help families and clinical teams
              understand patterns with confidence and clarity.
            </p>
          </div>
          <div className="contact-card">
            <p className="contact-section-title">Contact Info</p>
            <div className="contact-info">
              <div className="contact-info-row">
                <span className="contact-info-icon">
                  <FontAwesomeIcon icon={faMobileScreen} size="sm" />
                </span>
                <span className="contact-info-text">+880 1711 505413</span>
              </div>
              <div className="contact-info-row">
                <span className="contact-info-icon">
                  <FontAwesomeIcon icon={faEnvelope} size="sm" />
                </span>
                <span className="contact-info-text">support@spectalyzer.com</span>
              </div>
              <div className="contact-info-row">
                <span className="contact-info-icon">
                  <FontAwesomeIcon icon={faLocationDot} size="sm" />
                </span>
                <span className="contact-info-text contact-info-address">
                  1/1-B, Subhanbag, Savar, Dhaka-1340
                </span>
              </div>
            </div>
            <div className="contact-links">
              <Link to="/privacypolicy" className="contact-link">
                <FontAwesomeIcon icon={faLink} size="sm" />
                <span>Privacy Policy</span>
              </Link>
              <a href="#contact-us" className="contact-link secondary">
                <FontAwesomeIcon icon={faLink} size="sm" />
                <span>Contact Us</span>
              </a>
            </div>
          </div>
          <div className="contact-card contact-form">
            <p className="contact-section-title">Send a Message</p>
            <p className="contact-form-note">We respond within 24 hours.</p>
            <div className="contact-field">
              <label className="contact-label">Full name</label>
              <input className="contact-input" type="text" placeholder="Jane Doe" />
            </div>
            <div className="contact-field">
              <label className="contact-label">Email address</label>
              <input className="contact-input" type="email" placeholder="jane.doe@email.com" />
            </div>
            <div className="contact-field">
              <label className="contact-label">Message</label>
              <textarea className="contact-textarea" placeholder="How can we help you today?" />
            </div>
            <button className="contact-button">Send Message</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

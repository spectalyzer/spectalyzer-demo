import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer__inner">
                <div className="footer__brand">
                    <div className="footer__logo">Spectalyzer</div>
                    <p className="footer__description">
                        A secure, data-driven platform for tracking student progress, therapy insights, and school-wide collaboration.
                    </p>
                </div>

                <div className="footer__links">
                    <h3>Quick Links</h3>
                    <Link to="/">Home</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/privacypolicy">Privacy Policy</Link>
                </div>

                <div className="footer__contact">
                    <h3>Contact</h3>
                    <p>support@spectalyzer.test</p>
                    <p>+880 1711 505413</p>
                    <p>Student Analytics & Therapy Monitoring</p>
                </div>
            </div>

            <div className="footer__bottom">
                <p>© {year} Spectalyzer. All rights reserved.</p>
                <p>Built for educators, therapists, doctors, and administrators.</p>
            </div>
        </footer>
    );
};

export default Footer;

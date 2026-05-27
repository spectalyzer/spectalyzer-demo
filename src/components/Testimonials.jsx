import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Testimonials.css";
import reviewerImg from "../assets/images/testimonial.jpg";

const Testimonials = () => {
  const testimonials = [
    {
      comment:
        "Spectalyzer has been a game-changer for our therapy sessions! Its data-driven insights and graphical presentations offer a comprehensive view of our client's activities. With this powerful tool, we make more informed decisions, resulting in personalized interventions and remarkable progress. Highly recommended!",
      reviewerName: "Samin Raiyan",
      reviewerRole: "Clinical Therapist",
    },
    {
      comment:
        "Spectalyzer has been a game-changer for our therapy sessions! Its data-driven insights and graphical presentations offer a comprehensive view of our client's activities. With this powerful tool, we make more informed decisions, resulting in personalized interventions and remarkable progress. Highly recommended!",
      reviewerName: "Samin Raiyan",
      reviewerRole: "Care Team Lead",
    },
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <section className="testimonials-pro" id="testimonials">
      <div className="testimonials-shell">
        <div className="testimonials-header">
          <p className="testimonials-eyebrow">Trusted By Care Teams</p>
          <h2 className="testimonials-title">What Our Clients Say</h2>
          <p className="testimonials-subtitle">
            Real outcomes from therapists, educators, and caregivers using Spectalyzer every day.
          </p>
        </div>
        <Slider {...settings}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-slide">
              <div className="testimonial-card">
                <div className="testimonial-quote">“{testimonial.comment}”</div>
                <div className="testimonial-footer">
                  <img className="testimonial-avatar" src={reviewerImg} alt={testimonial.reviewerName} />
                  <div className="testimonial-meta">
                    <p className="testimonial-name">{testimonial.reviewerName}</p>
                    <p className="testimonial-role">{testimonial.reviewerRole}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Testimonials;

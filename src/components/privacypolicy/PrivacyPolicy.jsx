import React from "react";
import Footer from "../footer/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-100 ">
      <header className="mt-16 text-black py-6">
        <h1 className="text-4xl font-semibold text-center">Privacy Policy</h1>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 bg-white shadow-xl rounded-lg">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          Effective Date: 1/1/2025
        </h2>

        <p className="text-lg mb-4">
          At Spectalyzer, we value the privacy of our users and are committed to
          protecting the personal information you provide while using our
          platform. This Privacy Policy outlines how we collect, use, store, and
          protect your data in compliance with applicable privacy laws,
          including COPPA (Children’s Online Privacy Protection Act), HIPAA
          (Health Insurance Portability and Accountability Act), and GDPR
          (General Data Protection Regulation).
        </p>

        <p className="text-lg mb-4">
          Please read this Privacy Policy carefully before using our website and
          services.
        </p>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          1. Information We Collect
        </h3>
        <p className="text-lg mb-4">
          We collect the following types of information when you use our
          services:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <p>
              Personal Information: This includes your name, email address,
              phone number, date of birth, gender, and other information you
              provide when registering or filling out forms on our website.
            </p>
          </li>
          <li>
            <p>
              Behavioral Data: We collect data related to children’s activities
              and behaviors for the purpose of therapy tracking, including but
              not limited to sleep patterns, screen time, eating habits,
              emotional responses, and other related behaviors.
            </p>
          </li>
          <li>
            <p>
              Device and Usage Information: We automatically collect information
              about your device, such as IP addresses, browser types, and usage
              data like how you interact with our website.
            </p>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          2. How We Use Your Information
        </h3>
        <p className="text-lg mb-4">
          We use the information we collect for the following purposes:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <p>
              To Provide and Improve Our Services: We use your data to provide a
              personalized experience, including tracking and analyzing
              children's behavioral progress and generating reports to assist in
              therapy.
            </p>
          </li>
          <li>
            <p>
              To Communicate with You: We may use your information to contact
              you regarding updates, important notifications, or administrative
              matters.
            </p>
          </li>
          <li>
            <p>
              For Research and Development: We may use data to improve our
              platform, conduct research, and develop new features.
            </p>
          </li>
          <li>
            <p>
              To Ensure Compliance: We may use your data to comply with legal
              and regulatory requirements.
            </p>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          3. Consent and Data Processing
        </h3>
        <p className="text-lg mb-4">
          <p>
            Parental Consent (COPPA Compliance): If you are registering a child
            under the age of 13, you must provide explicit parental consent
            before we collect any personal data or behavioral information. This
            consent will be verified during the registration process.
          </p>
        </p>
        <p className="text-lg mb-4">
          <p>User Consent</p>: By using our platform, you consent to the
          collection, storage, and use of your data as described in this Privacy
          Policy. If you withdraw your consent, your data will be deleted, and
          you will no longer be able to use our services.
        </p>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          4. Data Storage and Security
        </h3>
        <p className="text-lg mb-4">
          We are committed to safeguarding your information. The personal and
          behavioral data we collect is stored securely using industry-standard
          encryption methods:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <p>
              Encryption: Your data is encrypted using AES-256 encryption (at
              rest) and TLS encryption (in transit) to ensure the
              confidentiality and integrity of your information.
            </p>
          </li>
          <li>
            <p>
              Access Control: Access to your data is restricted to authorized
              personnel only, and we use role-based access control to protect
              sensitive information.
            </p>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          5. Your Rights Over Your Data
        </h3>
        <p className="text-lg mb-4">
          As a user, you have the following rights regarding your data:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <p>
              Right to Access: You may request access to the personal data we
              have collected about you or your child.
            </p>
          </li>
          <li>
            <p>
              Right to Modify: You can update or correct any inaccurate
              information.
            </p>
          </li>
          <li>
            <p>
              Right to Deletion: You may request the deletion of your personal
              or child’s data at any time. Data will be deleted securely and
              permanently.
            </p>
          </li>
          <li>
            <p>
              Right to Data Portability: You can request a copy of your or your
              child’s data in a machine-readable format.
            </p>
          </li>
          <li>
            <p>
              Right to Withdraw Consent: You can withdraw consent for data
              collection at any time, after which all collected data will be
              deleted.
            </p>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          6. Data Sharing and Third Parties
        </h3>
        <p className="text-lg mb-4">
          We do not share your personal or behavioral data with third parties,
          except in the following cases:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <p>
              Legal Requirements: We may share your information if required by
              law, or if we are subpoenaed by regulatory authorities.
            </p>
          </li>
          <li>
            <p>
              Explicit Consent: We may share data with third parties if you
              provide explicit consent for such sharing, for example, sharing
              data with a healthcare provider or therapist.
            </p>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          7. Data Retention
        </h3>
        <p className="text-lg mb-4">
          We will retain your data only as long as necessary to fulfill the
          purposes for which it was collected or as required by law. If your
          data is no longer needed, or upon your request, we will securely
          delete your data from our servers.
        </p>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          8. Compliance with Laws
        </h3>
        <p className="text-lg mb-4">
          We are fully committed to complying with the following data protection
          laws and regulations:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <p>
              COPPA (Children’s Online Privacy Protection Act): We obtain
              parental consent before collecting data from children under the
              age of 13.
            </p>
          </li>
          <li>
            <p>
              HIPAA (Health Insurance Portability and Accountability Act): We
              protect your child's health data, ensuring it is handled with the
              necessary security measures in place.
            </p>
          </li>
          <li>
            <p>
              GDPR (General Data Protection Regulation): We adhere to GDPR
              standards for data privacy, ensuring your rights to privacy and
              protection of personal data.
            </p>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          9. Cookies and Tracking Technologies
        </h3>
        <p className="text-lg mb-4">
          We use cookies and similar tracking technologies to enhance your
          experience on our platform. These tools help us understand user
          behavior, remember preferences, and improve our services. You can
          control cookie settings through your browser settings.
        </p>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          10. Changes to This Privacy Policy
        </h3>
        <p className="text-lg mb-4">
          We may update this Privacy Policy from time to time. When changes are
          made, we will update the "Effective Date" at the top of this page. Any
          changes to this Privacy Policy will be communicated via email or
          through notifications on our platform. Continued use of the website
          after the changes are posted will signify your acceptance of the new
          terms.
        </p>

        <h3 className="text-xl font-semibold text-blue-600 mt-6">
          11. Contact Us
        </h3>
        <p className="text-lg mb-4">
          If you have any questions or concerns about this Privacy Policy or our
          data practices, please contact us at:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Email: spectalyzer@gmail.com</li>
          <li>Phone: +8801 711505413</li>
          <li>Address: 1/1-B, Subhanbag, Savar, Dhaka-1340</li>
        </ul>
      </div>

      <Footer></Footer>
    </div>
  );
};

export default PrivacyPolicy;

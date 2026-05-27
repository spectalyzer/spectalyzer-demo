import React from "react";

const TermsModal = ({ isOpen, closeModal }) => {
  return (
    isOpen && (
      <div className="fixed z-[9999] inset-0 flex justify-center items-center bg-gray-500 bg-opacity-75">
        <div
          className="inline-block align-middle bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all max-w-md w-full"
          style={{ height: "80vh", overflowY: "auto" }}
        >
          <h2 className="text-xl font-bold">Terms and Conditions</h2>
          <div
            className="mt-4"
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            <h3 className="font-semibold">1. Introduction</h3>
            <p>
              By using this website and its services, you agree to the following
              terms and conditions. Please read them carefully before
              registering or using the platform.
            </p>

            <h3 className="font-semibold mt-2">2. Data Collection</h3>
            <p>
              We collect personal and behavioral data, including but not limited
              to the name, date of birth, gender, contact details, and activity
              logs of children being monitored. This data is collected to assist
              therapists and caregivers in tracking behavior, monitoring
              progress, and customizing interventions.
            </p>

            <h3 className="font-semibold mt-2">3. Data Usage</h3>
            <p>
              The data you provide will be used for generating reports, tracking
              progress, and improving therapeutic outcomes. We ensure the
              collected data is used exclusively for the purpose of behavioral
              analysis and therapy management. The data will not be shared with
              any third parties except where legally required.
            </p>

            <h3 className="font-semibold mt-2">4. Consent</h3>
            <p>
              Parental consent is required for children under the age of 13 in
              accordance with COPPA (Children's Online Privacy Protection Act).
              By using the platform, you consent to the collection, storage, and
              processing of your child's data.
            </p>

            <h3 className="font-semibold mt-2">5. User Rights</h3>
            <p>
              Users and their legal guardians have the following rights:
              <ul className="list-disc ml-5">
                <li>
                  Right to Access: You may access the data we collect about your
                  child.
                </li>
                <li>
                  Right to Modification: You can update or correct any
                  inaccurate information.
                </li>
                <li>
                  Right to Deletion: You may request the deletion of your
                  child's data at any time.
                </li>
                <li>
                  Right to Data Portability: You can request a copy of the data
                  in a machine-readable format.
                </li>
                <li>
                  Right to Withdraw Consent: You may withdraw consent for data
                  collection, and all data will be deleted.
                </li>
              </ul>
            </p>

            <h3 className="font-semibold mt-2">6. Data Security</h3>
            <p>
              We use industry-standard security measures, including encryption
              (AES-256 for data at rest and TLS for data in transit), to protect
              your child's data. Data access is restricted through role-based
              access control, ensuring that only authorized individuals can view
              or modify sensitive information.
            </p>

            <h3 className="font-semibold mt-2">7. Third-Party Sharing</h3>
            <p>
              We do not share your child's personal data with third parties,
              except in cases where required by law, or with explicit consent
              from the user or legal guardian.
            </p>

            <h3 className="font-semibold mt-2">8. Data Retention</h3>
            <p>
              Your data will be retained only as long as it is necessary for the
              purposes of the service. If no longer required, or upon your
              request, we will securely delete the data from our servers.
            </p>

            <h3 className="font-semibold mt-2">9. Compliance with Laws</h3>
            <p>
              Our platform is designed to comply with global data protection
              standards, including:
              <ul className="list-disc ml-5">
                <li>
                  <strong>
                    COPPA (Children’s Online Privacy Protection Act)
                  </strong>
                  : We obtain parental consent before collecting data from
                  children under 13 years of age.
                </li>
                <li>
                  <strong>
                    HIPAA (Health Insurance Portability and Accountability Act)
                  </strong>
                  : We adhere to the security and privacy standards for
                  healthcare-related data.
                </li>
                <li>
                  <strong>GDPR (General Data Protection Regulation)</strong>: We
                  ensure compliance with data privacy laws applicable to users
                  in the EU and other jurisdictions.
                </li>
              </ul>
            </p>

            <div className="mt-4">
              <label>
                <input type="checkbox" /> I accept the terms and conditions.
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default TermsModal;

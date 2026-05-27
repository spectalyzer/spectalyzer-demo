const fs = require('fs');
let content = fs.readFileSync('src/pages/data_entry/DataEntry.jsx', 'utf8');

const marker = '          {/* Toilet */}';
const idx = content.indexOf(marker);

if (idx !== -1) {
  const replacement = `          {/* Toilet */}
            <div className="Toilet single-entry-field" style={{ display: shouldShow("toilet") ? "" : "none" }}>
              <p className="entry-title">
                Toilet <span className="star">*</span>
              </p>
              <input

                type="number"
                name="toilet"
                value={formData.toilet}
                onChange={handleChange}
                placeholder="0-10"
              />
              <p className="tale-title">Please enter a number from 0 to 10.</p>
              <p className="tale-title">
                How many times he goes to toilet? 1-2 times are normal; more is
                not. Even none is also not good.
              </p>
            </div>

            {/* Overnight Sleeping */}
            <div className="Overnight_sleeping single-entry-field" style={{ display: shouldShow("overnightSleeping") ? "" : "none" }}>
              <p className="entry-title">
                Overnight_sleeping <span className="star">*</span>
              </p>
              <input

                type="number"
                name="overnightSleeping"
                value={formData.overnightSleeping}
                onChange={handleChange}
                placeholder="0-10"
              />
              <p className="tale-title">
                Please enter a number greater than or equal to 0.
              </p>
              <p className="tale-title">
                Does he sleep properly? Higher number is good and lower is bad.
              </p>
            </div>

            {/* Special Activity */}
            <div className="Special_activity single-entry-field">
              <p className="entry-title">Special_activity</p>
              <textarea
                className="border"
                name="specialActivity"
                value={formData.specialActivity}
                onChange={handleChange}
                cols="30"
                rows="3"
              ></textarea>
              <p className="tale-title">
                Any special, new or unusual thing he/she did today. Describe the
                activity, what, when, and how he/she did it.
              </p>
            </div>

          {/* Custom Tracked Variables */}
          {trackedVars.filter(key => !HARDCODED_KEYS.includes(key)).length > 0 && (
            <React.Fragment>
              {trackedVars.filter(key => !HARDCODED_KEYS.includes(key)).map(key => (
                <div key={key} className="single-entry-field">
                  <p className="entry-title">
                    {key.replace(/_/g, ' ')} <span className="star">*</span>
                  </p>
                  <input
                    type="number"
                    name={key}
                    data-type="custom"
                    value={formData.customVariables[key] || 0}
                    onChange={handleChange}
                    placeholder="0-10"
                  />
                  <p className="tale-title">Please enter a number from 0 to 10.</p>
                </div>
              ))}
            </React.Fragment>
          )}

          </div>

          <div className="data-btn-container">
            {(error.status || success.status) && (
              <div ref={alertRef} className={\`data-alert \${error.status ? "error" : "success"}\`} aria-live="polite">
                <span>{error.status ? error.msg : success.msg}</span>
                <button type="button" onClick={closeModal}>
                  OK
                </button>
              </div>
            )}
            <button
              type="submit"
              className="data-btn"
              name="submit"
              id="submit"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default DataEntry;
`;
  content = content.substring(0, idx) + replacement;
  fs.writeFileSync('src/pages/data_entry/DataEntry.jsx', content);
  console.log('File restored successfully!');
} else {
  console.log('Marker not found!');
}

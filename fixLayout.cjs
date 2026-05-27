const fs = require('fs');
let content = fs.readFileSync('src/pages/data_entry/DataEntry.jsx', 'utf8');

// Replace pairs of closing/opening wrappers
content = content.replace(/<\/div>\s*<div className="data-entry-box">/g, '');

// Remove the custom variables section heading and wrapper
const customVarRegex = /{\/\* Custom Tracked Variables \*\/}\s*{trackedVars\.filter\(key => !HARDCODED_KEYS\.includes\(key\)\)\.length > 0 && \(\s*<div className="data-entry-box custom-vars-section">\s*<p className="entry-title"[^>]*>Additional Tracked Factors<\/p>/g;
content = content.replace(customVarRegex, '{/* Custom Tracked Variables */}\n          {trackedVars.filter(key => !HARDCODED_KEYS.includes(key)).length > 0 && (\n            <React.Fragment>');

// Close the Fragment instead of the div
content = content.replace(/<\/div>\s*\)\}\s*<div className="data-btn-container">/g, '</React.Fragment>\n          )}\n\n          <div className="data-btn-container">');

// Since React.Fragment is used, we need to make sure React is imported if it's not
if (!content.includes('import React')) {
    content = "import React from 'react';\n" + content;
}

fs.writeFileSync('src/pages/data_entry/DataEntry.jsx', content);
console.log('Fixed DataEntry.jsx layout!');

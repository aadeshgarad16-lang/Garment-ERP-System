const fs = require('fs');
const file = 'c:/Users/USER/Downloads/Sason_Project/garment-erp-system/src/app/(dashboard)/orders/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const poEndMarker = '          {/* GARMENT SPECIFICATIONS */}';
const paymentMarker = '        {/* PAYMENT */}';
// Look for the last three closing divs and return
const endMarker = '      </div>\n    </div>\n  );\n}';

const poIndex = content.indexOf(poEndMarker);
const paymentIndex = content.indexOf(paymentMarker);
const endIndex = content.lastIndexOf('      </div>'); // Gets the first of the closing tags

if (poIndex === -1 || paymentIndex === -1 || endIndex === -1) {
  console.log("Markers not found");
  process.exit(1);
}

// We will split based on the exact string that closes the page
const pageEndMarker = '      </div>\n    </div>\n  );\n}';
const pageEndIndex = content.lastIndexOf(pageEndMarker);

let poPart = content.substring(0, poIndex);
let specsAndButtons = content.substring(poIndex, paymentIndex);
let paymentPart = content.substring(paymentIndex, pageEndIndex);

let newContent = poPart + 
  '        </div>\n\n' + // Closes LEFT SIDE
  paymentPart + // Contains PAYMENT
  '      </div>\n\n' + // Closes MAIN GRID flex container
  '      <div className="w-full space-y-6">\n' + 
  specsAndButtons + // Contains GARMENT SPECS, BUTTONS and its own closing div!
  '    </div>\n  );\n}\n'; // Closes page wrapper and component

fs.writeFileSync(file, newContent);
console.log('Layout restructured successfully!');

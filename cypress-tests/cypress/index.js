const fs = require("fs");
const { parseString } = require("xml2js");

// Directory containing XML files
const directory = "./reports/junit/";

// Initialize total failures count
let totalFailures = 0;

// Function to read and process XML file
const processXMLFile = (file) => {
  return new Promise((resolve, reject) => {
    // Read the XML file
    fs.readFile(directory + file, "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading XML file ${file}:`, err);
        reject(err);
        return;
      }

      // Parse XML string to JSON
      parseString(data, (parseErr, result) => {
        if (parseErr) {
          console.error(`Error parsing XML ${file}:`, parseErr);
          reject(parseErr);
          return;
        }

        // Access the testsuites object from the parsed JSON
        const testsuites = result.testsuites;

        // Get the number of failures for each testsuite
        const failures = parseInt(testsuites.$.failures);

        // Add failures count to totalFailures
        totalFailures += failures;

        resolve();
      });
    });
  });
};

// Read the directory
fs.readdir(directory, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  // Array to store promises for each file processing
  const promises = [];

  // Iterate through each file
  files.forEach((file) => {
    // Check if file is XML
    if (file.endsWith(".xml")) {
      // Process XML file and push the promise to the array
      promises.push(processXMLFile(file));
    }
  });

  // Execute all promises
  Promise.all(promises)
    .then(() => {
      // Output the total failures across all files after processing all XML files
      console.log(`Total failures across all files: ${totalFailures}`);
    })
    .catch((error) => {
      console.error("Error processing XML files:", error);
    });
  
  
});

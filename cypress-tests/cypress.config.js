const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // reporter: "cypress-mochawesome-reporter",
  // reporterOptions: {
  //   charts: true,
  //   embeddedScreenshots: true,
  //   html: true,
  //   inlineAssets: true,
  //   saveAllAttempts: false,
  //   log: true,
  //   quest: true,
  // },

  reporter: "cypress-multi-reporters",
  reporterOptions: {
    reporterEnabled: "cypress-mochawesome-reporter, mocha-junit-reporter",
    cypressMochawesomeReporterReporterOptions: {
      reportDir: "cypress/reports",
      charts: true,
      reportPageTitle: "My Test Suite",
      embeddedScreenshots: true,
      inlineAssets: true,
    },
    mochaJunitReporterReporterOptions: {
      mochaFile: "cypress/reports/junit/results-[hash].xml",
    },
  },
  video: false,
  e2e: {
    baseUrl: "http://ui-vue-app-service.filetracker",
    // baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
    },
  },
});

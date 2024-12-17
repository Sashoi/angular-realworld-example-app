const { defineConfig } = require("cypress");
let href
let qUrl

module.exports = defineConfig({
  video: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
  chromeWebSecurity: false,
  experimentalMemoryManagement : true,
  numTestsKeptInMemory: 10,

  env: {
    username: "artem.bondar166@gmail.com - cypress.env.json is used",
    password: "CypressTest1",
    apiUrl: "https://api.realworld.io",
    questionnaireId :"33",
    requestUrl: "test"
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },

  reporter: "cypress-multi-reporters",

  reporterOptions: {
    configFile: "reporter-config.json",
  },

  e2e: {
    watchForFileChanges: false,
    setupNodeEvents(on, config) {
      on('task', {
        setHref: (val) => {
          return (href = val)
        },
        getHref: () => {
          return href
        },
        setQurl: (val) => {
          return (qUrl = val)
        },
        getQurl: () => {
          return qUrl
        }
      })
    },
  }
});

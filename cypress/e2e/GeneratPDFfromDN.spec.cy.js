/// <reference types="cypress" />

//import file from '../fixtures/vinsArray.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/hukClickableCar.log'
const pdfPath = 'cypress/fixtures/Pdf/'

describe('Huk_comprehensive_self_service_clickable_car', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    //cy.loginToApplication()
    console.clear()
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPage')
    cy.intercept('GET', `/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*//picture/clickableCar*`).as('clickableCar')
    cy.intercept('GET', `/questionnaire/generic_elements/attachment/*-example*`).as('generic_elements')
    cy.intercept('POST', '/questionnaire/*/page/page-*', (req) => {
      if (req.url.includes('navigateTo')) {
        req.alias = "nextPage"
      } else {
        req.alias = "savePage"
      }
    })
    cy.intercept('POST', `/member/oauth/token`).as('token')
    cy.wrap(goingPage).its('pageId').as('goingPageId')
    cy.wrap(goingPage).its('elements').as('goingPageElements')
    cy.wrap(questionnaire).its('Id').as('questionnaireId')
    cy.wrap(questionnaire).its('authorization').as('authorization')
    cy.wrap(questionnaire).its('bodyType').as('bodyType')
    cy.wrap(questionnaire).its('notificationId').as('notificationId')
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000




  const file1 = [
    ["6FPGXXMJ2GEL59891","PickUpSingleCabine",  "01.01.2012","Ford Ranger single cabine, Pick-up"]
  ]

  file1.forEach($car => {
    it(`Execute {{baseUrl}}/b2b/integration/huk/huk-comprehensive-self-service-init ${$car[0]}`, function () {

      const userCredentials =  {
        "password": Cypress.env("passwordHukS"),
        "remoteUser": "",
        "sessionLanguage": "en",
        "userName": Cypress.env("usernameHukS")
      }

      cy.request('POST',`https://${$dev}.spearhead-ag.ch/member/authenticate`,userCredentials)
      .its('body').then(body => {

        const token = body.accessToken
        const authorization = `Bearer ${token}`;
        cy.then(function () {
          questionnaire.authorization = authorization
        })

        const headers_1 = {
          'Accept': '*/*',
          'Accept-Encoding':'gzip, deflate, br',
          'Content-Type': 'application/json',
          authorization,
        }

        const damageNotificationId = 'JfSMD11WHrwrGwuX6sNei'
        cy.then(function () {
          questionnaire.notificationId = damageNotificationId
        })

        const options3 = {
          method: 'GET',
          url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
          headers: headers_1
        }
        cy.request(options3).then(
          (response3) => {
          expect(response3.status).to.eq(200) // true
          const vin = response3.body.body.vehicleIdentification.vin;
          console.log(`vin: ${vin}`)
          let pdf_template = 'dekra_schadenbilder'
          cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
          pdf_template = 'dekra_abschlussbericht'
          cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
        })
      })
    }) //it
 }) //forEach
})  //describe

//https://dev02.spearhead-ag.ch/ui/questionnaire/zurich/#/standalone/home?theme=sph
//POST https://dev02.spearhead-ag.ch/b2b/integration/sph/sphLiabilityCallCenter?identifyVehicleAsync=false

/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'

const logFilename = 'cypress/fixtures/logs/axaDeLiabilityCallCenter.log'
const PathToImages ='cypress/fixtures/images/'

describe('Start and complete sph standalone questionnaire - axa_de_liability_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    cy.intercept('POST', `/b2b/integration/sph/sphLiabilityCallCenter?identifyVehicleAsync=false`).as('sphLiabilityCC')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const executePost2 = true

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  const file1 = [
    ["SALYL2RV8JA741831", "SUV", "01.01.2019", "Land Rover, SUV"]
  ]

  file1.forEach($car => {

    it(`sph standalone - axa_de_liability_call_center vin: ${$car[0]}`, () => {

      const $vin = $car[0];

      //Login()
      cy.standaloneLogin('sph').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })


      const intS3 = getRandomInt(100,999).toString()
      const intS9 = getRandomInt(100000000,999999999).toString()
      const $equipment_2_loading_doors = true


      const first_registration_date = $car[2];;
      const claimNumber = `SPH-${intS9}`
      Cypress.env('claimNumber', claimNumber)
      console.log(`claimNumber: ${claimNumber}`)
      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)
      const licensePlate = `SPHL ${intS3}`
      Cypress.env('licensePlate', licensePlate)
      console.log(`license plate: ${licensePlate}`)

      // Fulfill standalone form
      cy.get('select[name="processGroup"]').select(1)
      cy.get('input[name="claimNumber"]').type(claimNumber);
      cy.get('input[data-test="standalone_vin"]').type($vin)
      cy.get('#firstRegistrationDate__input').type($car[2])
      cy.get('button[class="btn btn-primary btn-submit"]').click()
      cy.wait(1000)

      cy.wait('@sphLiabilityCC').then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        console.log(`questionnaireId: ${xhr.response.body.questionnaireId}`)
        cy.then(function () {
          questionnaire.Id = xhr.response.body.questionnaireId
        })
        console.log(`uiUrl: ${xhr.response.body.uiUrl}`)
      })
      cy.wait(1000)

      currentPage()

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      //cy.get('.loader').should('not.exist')
      //pageId: "page-01"
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){// Fahrzeugbeschreibung und Schadenhergang
          cy.get('#accident-date-input').type('01.11.2023')
          cy.get('#vehicle-first-registration-date-input').type(first_registration_date)
          cy.get('#vehicle-mileage-input').clear().type('123456')
          cy.get('input#client-vehicle-license-plate-input').type(licensePlate)
          cy.selectSingleList('loss-circumstances-details',0)
          cy.selectSingleList('cash-on-hand-settlement-preferred',0)
          cy.selectSingleList('repair-cost-estimate-available',0)
          cy.selectSingleList('photo-repair-estimate-available',0)
          cy.selectSingleList('receive-quote-upload-link-by',0)
          cy.get('input#client-email-for-quote-upload-link-input').clear().type('sivanchevski@soft2run.com')
          cy.get('textarea#loss-cause-client-remarks-textarea').clear().type('Versicherungsinterne Anmerkung:')

          cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
            if (res){
              cy.selectDropDown('select_buildPeriod',2)
              cy.wait(2000)
            }
          })

          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })

          cy.get('@bodyType').then(function (bodyType) {
            if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
              cy.wait(2000)
              cy.selectSingleList('equipment-slide-door',1)
              cy.selectSingleList('equipment-2-loading-doors',Number($equipment_2_loading_doors))

              cy.selectSingleList('equipment-length',0)
              cy.selectSingleList('equipment-height',0)
              cy.selectSingleList('equipment-vehicle-rear-glassed',0)
              cy.selectSingleList('vehicle-customized-interior',0)
            }
            if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
              //cy.wait(2000)
              //cy.selectSingleList('equipment-loading-area-cover-type',1)
            }
          })
          cy.wait(2000)
          nextBtn()
        }
      })

      //cy.then(() => this.skip())    // stop here

      //Zusammenfassung, post questionnaire - summary-page
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){ //pageId: "summary-page"

          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, questionnaireId: ${Id}`);
          })
          if (executePost) {
            cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    })

    it(`axa_de_liability_self_service_upload_cost_estimate - execute vin: ${$car[0]}`, () => {
       cy.viewport('samsung-note9')
        cy.wait(2000)
        let requestUrl = Cypress.env('requestUrl')
        //requestUrl = 'https://dev03.spearhead-ag.ch:443/p/r/cyXdGLmaW1EEoMS4CODdQ'
        if(requestUrl == undefined || requestUrl == null || !requestUrl.length > 0){
          throw new Error(`test fails : requestUrl = ${requestUrl}`)
        }
        console.log(`Start ${Cypress.env('templateId')} from url: ${requestUrl}.`)
        cy.wait(4000)

        cy.visit(requestUrl,{log : false})

        const nextButtonLabel ='Weiter'
        const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
        cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

        currentPage()

        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-01'){
            cy.wait(1000)
            cy.selectMultipleList('terms-of-service-acknowledgement',0)
            cy.getBodyType($car,logFilename).then(function (bodyType) {
              cy.then(function () {
                questionnaire.bodyType = bodyType
              })
            })
            nextBtn()
          }
        })

        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-02'){
            nextBtn()
          }
        })

        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-03'){
            nextBtn()
          }
        })

        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-04'){
            cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,'registration-part-1.jpg')
            nextBtn()
          }
        })

        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-05'){
            cy.uploadImage('repair-cost-estimate-photo-upload',PathToImages,'registration-part-1.jpg')
            nextBtn()
          }
        })

        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-06'){
            cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
            nextBtn()
          }
        })
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-07'){
            //cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
            cy.uploadImage('vehicle-left-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
            //cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
            cy.uploadImage('vehicle-right-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
            nextBtn()
          }
        })
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-08'){
            cy.uploadImage('damage-photo-upload-label',PathToImages,'airbag.jpg')
            cy.uploadImage('damage-photo-upload-label',PathToImages,'airbag.jpg')
            nextBtn()
          }
        })
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-09'){
            //"police-report-photo-upload",
            //"ranger-report-photo-upload",
            //"other-documents-photo-upload"
            cy.uploadAllImagesOnPage(PathToImages,6000)
            nextBtn()
          }
        })
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-10'){
            cy.get('@bodyType').then(function (bodyType) {
              const remarks = `additional-remarks for bodyType : ${bodyType}.`
              //cy.get('textarea#general-remarks').type(remarks)
              cy.typeIntoAllTextArea(remarks)
            })
            cy.wait(2000)
            nextBtn()
          }
        })
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'summary-page'){
            cy.selectMultipleList('summary-confirmation-acknowledgement',0)
            if (executePost2) {
              cy.get('button[type="submit"]').contains('Senden').click()
              cy.wait('@postPost',{ log: false }).then(xhr => {
                cy.postPost(xhr,false).then(function (notificationId) {
                  console.log(`notificationId: ${notificationId}`);
                })
              })
            }
          }
        })
    })

    // it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
    //   cy.GeneratePDFs(['huk_photos'])
    // }) //it PDF from commands

  })
})


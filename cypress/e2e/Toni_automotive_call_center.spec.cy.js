/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
//import emailBody from '../fixtures/templates/emailBodyA.json'
import b2bBody from '../fixtures/templates/b2bBodyToni_A.json'
import header from '../fixtures/header.json'

const logFilename = 'cypress/fixtures/logs/SphSalesComprehensiveCallCenter.log'
const PathToImages ='cypress/fixtures/images/'

describe('Start and complete Toni automotive call center - toni_automotive_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {
    cy.intercept('POST', `questionnaire/toni_automotive_call_center/start`).as('toniACC')
    cy.intercept('GET',  `/questionnaire/*/page/page-*?locale=de`).as('currentPageR')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = false
  const executePostR = true
  const executePost2 = true

  function printUiBlocks(uiBlocks){
    uiBlocks.forEach((uiBlock, index1) => {
      uiBlock.elements.sections.forEach((section, index2) => {
        console.log(`section [${index1}][${index2}]: ${section.label.content}.`)
      })
    })
  }

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  function currentPageR() {
    cy.waitingFor('@currentPageR',goingPage,questionnaire)
  }

  function convertDate(dateString){
    var p = dateString.split(/\D/g)
    return [p[2],p[1],p[0] ].join("-")
    }


  const file1 = [
    [
      "VF3VEAHXKLZ080921",
      "MiniBusMidPanel",
      "01.01.2017",
      "Peugeot Expert 09/2020"
    ]
]
  file1.forEach($car => {
    it.only(`Toni automotive - toni_automotive_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]

      const intS3 = getRandomInt(100,999).toString()
      const $equipment_2_loading_doors = true

      let  first_registration_date = $car[2]
      //const f_first_registration_date = '2017-06-14'
      console.log(`first registration date: ${first_registration_date}`)
      first_registration_date = convertDate(first_registration_date)

      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)
      const licensePlate = `SP ${intS3}9`
      //Cypress.env('licensePlate', licensePlate)
      console.log(`license plate: ${licensePlate}`)

      cy.authenticate().then(function (authorization) {

        cy.then(function () {
          questionnaire.authorization = authorization
        })
        b2bBody.supportInformation.vin  = $vin
        //b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
        //b2bBody.qas.find(q => {return q.questionId === "vehicle-first-registration-date"}).answer = first_registration_date


        Cypress._.merge(header, {'authorization' : authorization});

        const options = {
          method: 'POST',
          url: `${baseUrl_lp}questionnaire/toni_automotive_call_center/start`,
          body: b2bBody,
          headers: header
        };
        cy.request(options).then(
          (response) => {
          // response.body is automatically serialized into JSON
          expect(response.status).to.eq(200) // true
          const questionnaireId = response.body.questionnaireId;
          cy.then(function () {
            questionnaire.Id = questionnaireId
          })
          const uiUrl = response.body.uiUrl;
          console.log(`toni_automotive_call_center questionnaireId: ${questionnaireId}`)
          console.log(`toni_automotive_call_center uiUrl: ${uiUrl}`)
          cy.visit(uiUrl,{ log : false })
        })
      })

      cy.get('div[class="radio"][title="Kollision"]',{ timeout: 60000 }).should('have.length.greaterThan', 0).and('be.visible')
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()


      cy.wait(1000)

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.selectSingleList('coverage-type-info-client',0)
          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.get('@bodyType').then(function (bodyType) {
            if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
              cy.selectSingleList('equipment-slide-door',1)
              cy.selectSingleList('equipment-2-loading-doors',Number($equipment_2_loading_doors))
              cy.selectSingleList('equipment-length',0)
              cy.selectSingleList('equipment-height',0)
              cy.selectSingleList('equipment-vehicle-rear-glassed',0)
              cy.selectSingleList('vehicle-customized-interior',0)
            }
            if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
              cy.wait(2000)
              cy.selectSingleList('vehicle-loading-area-cover-type',1)
            }
          })
          cy.wait(2000)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-05'){
          cy.get('input#incident-date-time-input').type(`01-06-2024`)
          cy.get('input[placeholder="HH"]').type(`10`)
          cy.get('input[placeholder="MM"]').type(`11`)
          cy.get('input#incident-place-street-name-input').type(`incident place street name`)
          cy.get('input#incident-place-street-number-input').type(`13 A 1`)
          cy.get('input#incident-place-zip-code-input').type(`8000`).blur();
          cy.get('input#incident-place-street-number-input').focus()
          cy.get('input[data-test="dropdown-selection-enabled-text-input_incident-place-city"]').should('have.value', 'Zürich')

          cy.wait(2000)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-06'){
          cy.selectMultipleList('damaged-objects',0)
          cy.wait(2000)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-07'){
          cy.selectSingleList('collision-type',0)
          cy.get('textarea#collision-type-others-description-textarea').clear().type('Bitte beschreiben Sie in Ihren eigenen Worten was passiert ist:{enter}Bitte beschreiben Sie in Ihren eigenen Worten was passiert ist:{enter}')
          cy.selectSingleList('loss-circumstances',0)

          cy.wait(2000)
          nextBtn()
        }
      })
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-08'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-09'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-10'){
          cy.selectSingleList('accident-responsible',0)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-11'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-12'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-13'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-14'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-15'){
          cy.selectSingleList('vehicle-driver',0)
          cy.selectSingleList('alcohol-drugs-overfatigue-while-driving',0)
          cy.selectSingleList('excessive-speed-while-driving',0)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-16'){
          cy.selectSingleList('police-informed',1)

          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-23'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)

            if (xhr.response.body.search('g id="hood"') > 0){
              cy.selectSVG('hood')
              cy.get('input#vehicle-mileage-input').clear().type('123654')

              cy.wait(2000)
              cy.selectMultipleList('hood-damage-type',0)
            }

            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                cy.selectSingleList('loading-floor-area-bend', 0)
                cy.getQuestionAnswer('loss-cause').then(function (answer) {
                  console.log(`loss-cause : ${answer}`);
                })
                cy.wait(1000)
              }
            })
            nextBtn()
          })
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-24'){
          cy.selectSingleList('repair-cost-estimate-available',1)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-25'){
          cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
          cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
          cy.uploadImage('photo-upload-incident-place',PathToImages,'vehicle-left-rear-photo1.jpg')
          cy.uploadImage('photo-upload-sketch-accident-situation',PathToImages,'vehicle-left-rear-photo1.jpg')
          cy.uploadImage('photo-upload-accident-report',PathToImages,'vehicle-left-rear-photo1.jpg')

          cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
          cy.uploadImage('damage-photo-upload-detail-hood',PathToImages,'hood-d.jpg')

          cy.get('input#send-email-for-upload-photos-input').clear().type('sivanchevski@soft2run.com')
          nextBtn()
        }
      })

      //cy.then(() => this.skip())    // stop here


      //Zusammenfassung, post questionnaire - summary-page
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, questionnaireId:${Id}`);
          })
          if (executePost) {
            cy.get('button[type="submit"]').contains('Senden').click()
            cy.wait('@postPost',{ timeout: 600000 }).then(xhr => {
              cy.postPost(xhr, false)
            })
          }
        }
      })
    })

    it.skip(`toni_automotive_self_service create vin ${$car[0]}`, () => {
      const notificationId = Cypress.env('notificationId') //`wlA4icU77W6LjzUFyrGzy`
      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
        Cypress._.merge(header, {'authorization':authorization});
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/toni_automotive_self_service`,
          body: emailBody,
          headers: header
        };
        cy.request(options).then(
          (response) => {
            // response.body is automatically serialized into JSON
            expect(response.status).to.eq(200) // true
            console.log(`toni_automotive_self_service:`);
            const arrLength = response.body.requestedInformation.length
            console.log(response.body.requestedInformation[arrLength - 1].requestUrl);
            Cypress.env('requestUrl', response.body.requestedInformation[arrLength - 1].requestUrl)
            console.log(response.body.requestedInformation[arrLength - 1].templateId);
            Cypress.env('templateId', response.body.requestedInformation[arrLength - 1].templateId)
            //cy.printRequestedInformation(response.body.requestedInformation);
        })
      })
    })

    it.skip(`toni_automotive_self_service execute vin ${$car[0]}`, () => {
      cy.viewport('samsung-note9')
      console.log(`Start ${Cypress.env('templateId')} from url: ${Cypress.env('requestUrl')}.`)

      cy.visit(Cypress.env('requestUrl'),{log : false})

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
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
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-06'){
          cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
          cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-07'){
          cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,'interior-front.jpg')
          cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-08'){
          cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-09'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-10'){
          cy.get('input#client-bank-name-input').type('FiBank');
          cy.get('input#client-bank-iban-input').type('IBAN1234');
          cy.get('input#client-bank-bic-input').type('BIC');
          cy.get('input#client-bank-account-holder-input').type('Account Holder');
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('textarea#summary-message-from-client-textarea').type('Hier können Sie eine persönliche Mitteilung für das Muster Versicherungs AG Schadenteam eintragen.')
          if (executePost2) {
            //pageId: "summary-page"
            cy.selectMultipleList('summary-confirmation-acknowledgement',0)
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
  })
})

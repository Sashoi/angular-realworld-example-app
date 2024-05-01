/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { makeid } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBodyWGV.json'
import emailBody from '../fixtures/templates/emailBody.json'
import header from '../fixtures/header.json'

const logFilename = 'cypress/fixtures/logs/wgv.log'
const PathToImages ='cypress/fixtures/images/'

describe('Execute b2b/integration/wgv/callCenter', () =>{
  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up intercepts and common variables', () => {
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const executePost2 = true
  const createNewQuestionnaires = true
  const interceptWGV = false
  const $equipment_2_loading_doors = true

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
    it(`wgv callCenter for vin: ${$car[0]}`, () =>{

      const $vin = $car[0]
      console.log(`vin :${$vin}`)

      let claim1 = makeid(5)
      let claim2 = getRandomInt(10000,99999)

      cy.authenticate().then(function (authorization) {

          cy.then(function () {
            questionnaire.authorization = authorization
          })

          const claimNumber = claim1 + claim2


          //"claimType": "01", - "liability"          templateId: "wgv_liability_call_center"
          //"claimType": "02", - "fullCoverage"       templateId: "wgv_comprehensive_call_center"
          //"claimType": "03", - "partialCoverage"    templateId: "wgv_comprehensive_call_center"
          // see "fixtures/damage_cause_mapping.json"

          b2bBody.claimNumber = claimNumber
          b2bBody.claimType = "01"  //01, 02, 03, 53IV
          b2bBody.damageCause =  "storm"//"glass" // see "fixtures/damage_cause_mapping.json"
          b2bBody.vin =  $vin
          b2bBody.licensePlate = `EH${claim2}BT` //"EH1234BT"

          Cypress._.merge(header, {'authorization':authorization});
          const options = {
            method: 'POST',
            url: `${baseUrl_lp}b2b/integration/wgv/callCenter`,
            body: b2bBody,
            headers:header
          };



          cy.request(options).then(
            (response) => {
              // response.body is automatically serialized into JSON
              expect(response.status).to.eq(200) // true

              const callCenterQuestionnaireId = response.body.callCenterQuestionnaireId
              const callCenterQuestionnaireUrl = response.body.callCenterQuestionnaireUrl
              console.log(`questionnaireId: ${callCenterQuestionnaireId}`)
              cy.then(function () {
                questionnaire.Id = callCenterQuestionnaireId
              })
              console.log(`uiUrl: ${callCenterQuestionnaireUrl}`)

              cy.visit(callCenterQuestionnaireUrl,{ log : false })
              //cy.get('.loader').should('not.exist')
              //cy.wait(1000)
          })

          const nextButtonLabel ='Weiter'
          const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
          cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

          currentPage()

          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'page-01'){
              cy.selectSingleList('damage-cause',0)
              nextBtn()
            }
          })
          cy.wait(1000)
          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'page-02'){
              cy.getBodyType($car,logFilename).then(function (bodyType) {
                cy.then(function () {
                  questionnaire.bodyType = bodyType
                })
              })

              cy.get('input#accident-date-input').type('20.04.2022')

              cy.selectSingleList('accident-location',0)
              cy.selectSingleList('loss-circumstances-details',0)

              const mileage = '1' + claim2;
              cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type(mileage)

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
                  cy.selectSingleList('equipment-loading-area-cover-type',1)
                }
              })
              cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
                if (res){
                  cy.selectDropDown('select_buildPeriod',1)
                  cy.wait(2000)
                }
              })
              nextBtn()
              cy.wait(1000)
            }
          })

          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'page-03'){

              cy.selectSVG('hood')
              cy.selectMultipleList('hood-damage-type',0)

              cy.selectSVG('roof')
              cy.selectMultipleList('roof-damage-type',0)

              cy.get('@bodyType').then(function (bodyType) {
                if (bodyType == 'Cabrio'){
                  // and roof is selected
                  cy.selectSingleList('roof-equipment-convertible-roof-material',0)
                }
                if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                  cy.selectSingleList('loading-floor-area-bend',0)
                }
                if (bodyType == 'Coupe' || bodyType == 'Hatch3' || bodyType == 'Sedan' || bodyType == 'Hatch5' || bodyType == 'Station' || bodyType == 'SUV' || bodyType == 'MPV'){
                  // and roof is selected
                  cy.selectSingleList('roof-equipment-panorama-roof',0)
                }
              })

              cy.selectSVG('windshield')
              cy.wait(500)

              cy.selectSingleList('windshield-equipment-windshield-electric',0)

              cy.selectMultipleList('windshield-damage-type',0)
              cy.selectMultipleList('windshield-damage-type',2)
              cy.selectSVG('zone-b')
              cy.selectSVG('zone-d')
              cy.selectSingleList('windshield-damage-quantity',3)
              cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',0)
              cy.selectSingleList('windshield-damage-size-crack-bigger-2cm',0)

              cy.wait(500)
              nextBtn()
              cy.wait(500)
            }
          })

          if (interceptWGV){
            console.log(`interceptWGV`);
            const iBody = {
              "answers": [
                  {
                      "questionId": "method",
                      "answer": "MFM"
                  },
                  {
                      "questionId": "mmi-popularity",
                      "answer": "1"
                  },
                  {
                      "questionId": "mmi-previous-damage",
                      "answer": "1"
                  },
                  {
                      "questionId": "triage-recommendation",
                      "answer": "physicalInspection"
                  },
                  {
                      "questionId": "self-service-link",
                      "answer": "yes"
                  },
                  {
                    "questionId": "questionnaire-edited",
                    "answer": "yes"
                }
              ]
            }

            // with this intercept I'm replacing the body of standalone
            // adding 'roof' as selected SVG
             cy.intercept('POST', `/questionnaire/*/page/page-04?navigateTo=next&offset=180&locale=de`, (req) => {
               req.body = iBody
             })
          }

          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'page-04'){

              nextBtn()
              cy.wait(500)
            }
          })

          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'summary-page'){
              cy.get('@questionnaireId').then(function (Id) {
                console.log(`from summary-page, questionnaireId: ${Id}`);
              })
              if (executePost) {
                //pageId: "summary-page"
                cy.get('button[type="submit"]').contains('Senden').click()
                cy.wait('@postPost',{ log: false }).then(xhr => {
                  cy.postPost(xhr).then(function (notificationId) {
                    if (createNewQuestionnaires) {

                      // let _headers = {
                      //   'Accept': '*/*',
                      //   'Accept-Encoding':'gzip, deflate, br',
                      //   'Content-Type': 'application/json',
                      //   authorization
                      // }


                      const options2 = {
                        method: 'POST',
                        url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/wgv_comprehensive_self_service_app`,
                        body: emailBody,
                        headers: header
                      };

                      cy.request(options2).then(
                        (response) => {
                          // response.body is automatically serialized into JSON
                          expect(response.status).to.eq(200) // true
                          console.log(`wgv_comprehensive_self_service_app:`);
                          console.log(response.body);
                          //cy.printRequestedInformation(response.body.requestedInformation);
                        })

                      const options3 = {
                        method: 'POST',
                        url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/wgv_liability_self_service_app`,
                        body: emailBody,
                        headers: header
                      };

                      cy.request(options3).then(
                        (response) => {
                          // response.body is automatically serialized into JSON
                          expect(response.status).to.eq(200) // true
                          console.log(`wgv_liability_self_service_app:`);
                          console.log(response.body.requestedInformation[2].requestUrl);
                          Cypress.env('requestUrl', response.body.requestedInformation[2].requestUrl)
                          console.log(response.body.requestedInformation[2].templateId);
                          Cypress.env('templateId', response.body.requestedInformation[2].templateId)
                          //cy.printRequestedInformation(response.body.requestedInformation);
                      })
                    }
                  })
                })
              }
            }
          })
      }) // authenticate
    }) // it wgv

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['wgv_default','wgv_pilot','wgv_pilot_2023'])
    }) //it PDF from commands

    it(`Start new questionnaire.`, function () {
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
        if (aliasValue == 'page-02'){ // "pageShowCriteria": "getAnswer('damage-cause') == null"
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
              cy.selectSingleList('equipment-loading-area-cover-type',1)
            }
          })
          nextBtn()
        }
      })
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-05'){
          cy.selectSingleList('accident-location',0)
          cy.get('input#client-zip-code-input').type('10115').blur();
          cy.get('input[data-test="dropdown-selection-enabled-text-input_client-city"]').should('have.value', 'Berlin')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-06'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-07'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {

            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            cy.selectSVG('hood')
            nextBtn()
          })
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-08'){
          cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,'registration-part-1.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-09'){
          cy.uploadImage('vehicle-left-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
          cy.uploadImage('vehicle-right-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-10'){
          cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-11'){
          cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          if (executePost2) {
            //pageId: "summary-page"
            cy.selectMultipleList('summary-confirmation-acknowledgement',0)
            cy.get('button[type="submit"]').contains('Unterlagen senden').click()
            cy.wait('@postPost',{ log: false }).then(xhr => {
              cy.postPost(xhr,false).then(function (notificationId) {
                console.log(`notificationId: ${notificationId}`);
              })
            })
          }
        }
      })
    }) // it Start new questionnaire
  })  // for Each
})

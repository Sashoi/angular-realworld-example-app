/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { makeid } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBodyWGV.json'
import emailBody from '../fixtures/templates/emailBody.json'
import header from '../fixtures/header.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/wgv.log'
const pdfPath = 'cypress/fixtures/Pdf/'

describe('Execute b2b/integration/wgv/callCenter', () =>{
  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up intercepts and common variables', () => {
    //cy.loginToHukStandalone()
    console.clear()
    //cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
    cy.intercept('GET',  `/questionnaire/*/currentPage?offset=*&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*//picture/clickableCar*`).as('clickableCar')
    //cy.intercept('POST', `/b2b/integration/wuestenrot/wuestenrot-comprehensive-call-center?identifyVehicleAsync=false`).as('postStart')
    cy.intercept('POST', '/questionnaire/*/page/page-*', (req) => {
      if (req.url.includes('navigateTo')) {
        req.alias = "nextPage"
      } else {
        req.alias = "savePage"
      }
    })
    //cy.intercept('POST', `/member/oauth/token`).as('token')
    cy.wrap(goingPage).its('pageId').as('goingPageId')
    cy.wrap(goingPage).its('elements').as('goingPageElements')
    cy.wrap(questionnaire).its('Id').as('questionnaireId')
    cy.wrap(questionnaire).its('authorization').as('authorization')
    cy.wrap(questionnaire).its('bodyType').as('bodyType')
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const createNewQuestionnaires = false
  const interceptWGV = false
  const $equipment_2_loading_doors = true

  function _waitFor(waitFor) {
    if (waitFor == '@nextPage'){
      cy.get('@nextBtn').click({ force: true })
    }
    cy.wait(waitFor,{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const gPage = xhr.response.body.pageId
        let title = xhr.response.body.pageTitle
        if ((title.length <= 2)){
          title = xhr.response.body.uiBlocks[0].label.content
          if ((title.length <= 2)){
            if (title = xhr.response.body.uiBlocks[0].elements.sections.length > 0){
              title = xhr.response.body.uiBlocks[0].elements.sections[0].label.content
            }
          }
        }
        console.log(`Comming page ${gPage} - ${title}.`)
        cy.then(function () {
          goingPage.elements = []
        })
        //printQuestionnaireIds(xhr.response.body.elements)
        cy.then(function () {
          goingPage.pageId = gPage
        })
    })
  }

  function nextBtn() {
    _waitFor('@nextPage')
  }

  function currentPage() {
    _waitFor('@currentPage')
  }

  const file1 = [
    ["W1V44760313930767", "Van", "01.01.2017", "Mercedes Vito 09/2021"]
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
          b2bBody.claimType = "03"  //01, 02, 03, 53IV
          b2bBody.damageCause =  "glass" // see "fixtures/damage_cause_mapping.json"
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

              cy.visit(callCenterQuestionnaireUrl)
              //cy.get('.loader').should('not.exist')
              //cy.wait(1000)
          })

          const nextButtonLabel ='Weiter'
          const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
          cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

          currentPage()

          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'page-01'){
              cy.selectSingleList('damage-cause',3)
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

                      let _headers = {
                        'Accept': '*/*',
                        'Accept-Encoding':'gzip, deflate, br',
                        'Content-Type': 'application/json',
                        authorization
                      }


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

  })  // for Each
})

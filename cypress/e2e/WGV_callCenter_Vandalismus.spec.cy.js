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

const logFilename = 'cypress/fixtures/logs/wgvCallCenter.log'

describe('Execute b2b/integration/wgv/callCenter', () => {
  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up intercepts and common variables', () =>{
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  const file1 = [
    [
      "WDB2083441T069719",
      "Coupe",
      "01.01.2009",
      "MER CLK Coupe (partial identification, build period to be defined manually)"
    ]
  ]

  file1.forEach($car => {
    it(`Execute b2b/integration/wgv/callCenter Vandalismus with vin:${$car[0]}`, () => {

      const vin = $car[0]
      console.log(`vin : ${vin}`)

      let claim1 = makeid(5)
      let claim2 = getRandomInt(10000, 99999)

      cy.authenticate().then(function (authorization) {
          cy.then(function () {
            questionnaire.authorization = authorization
          })

          let claimNumber = claim1 + claim2
          //claimNumber = 'tP44l36300' // reopen

          //"claimType": "01", - "liability"          templateId: "wgv_liability_call_center"
          //"claimType": "02", - "fullCoverage"       templateId: "wgv_comprehensive_call_center"
          //"claimType": "03", - "partialCoverage"    templateId: "wgv_comprehensive_call_center"

          b2bBody.claimNumber = claimNumber
          b2bBody.claimType = "03"  //01, 02, 03, 53IV
          b2bBody.damageCause =  "glass" // see "fixtures/damage_cause_mapping.json"
          b2bBody.vin =  vin
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

              const questionnaireId = response.body.callCenterQuestionnaireId;
              cy.then(function () {
                questionnaire.Id = questionnaireId
              })
              console.log(`questionnaireId: ${questionnaireId}`)
              const uiUrl = response.body.callCenterQuestionnaireUrl;
              console.log(`uiUrl: ${uiUrl}`);

              cy.visit(uiUrl,{ log : false })
              cy.wait(1000)

              const nextButtonLabel ='Weiter'
              const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
              cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')
              const selector = 'div[title="Vandalismus"]'

              cy.get("body").then($body => {
                if ($body.find(selector).length > 0) {
                  //pageId:"page-01"
                  console.log('find(selector)')
                  currentPage()
                  cy.get('@goingPageId').then(function (aliasValue) {
                    if (aliasValue == 'page-01'){
                      cy.selectSingleList('damage-cause',6)
                      nextBtn()
                    }
                  })
                }
              })
            })
          cy.wait(1000)

          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })

          //pageId:"page-02"
          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'page-02'){
              cy.get('input#accident-date-input').type('20.04.2022')
              //"Innerorts"
              cy.selectSingleList('accident-location',0)

              //Vandalismus / Diebstahl / böswillige Beschädigung
              cy.selectSingleList('loss-circumstances-details',0)

              const mileage = '1' + claim2;
              cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type(mileage)

              cy.get('@bodyType').then(function (bodyType) {
                if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
                  cy.selectSingleList('equipment-loading-area-cover-type',1)
                }
                if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                  cy.selectSingleList('equipment-slide-door',1)
                  cy.selectSingleList('equipment-2-loading-doors',0)
                  cy.selectSingleList('equipment-length',0)
                  cy.selectSingleList('equipment-height',0)
                  cy.selectSingleList('equipment-vehicle-rear-glassed',0)
                  cy.selectSingleList('vehicle-customized-interior',0)
                }
              })
              cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
                if (res){
                  cy.selectDropDown('select_buildPeriod',1)
                  cy.wait(2000)
                }
              })
              nextBtn()
            }
          })

          //pageId:"page-03"
          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'page-03'){
              cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
                expect(xhr.response.statusCode).to.equal(200)
                console.log(`Comming SVG with clickableCar`)
                const SVGbody = xhr.response.body;

                //hood
                cy.selectSVG('hood')
                cy.selectMultipleList('hood-damage-type',0)


                //roof
                cy.selectSVG('roof')
                cy.selectMultipleList('roof-damage-type',0)

                //windshield
                cy.selectSVG('windshield')
                cy.wait(500)

                cy.get('@bodyType').then(function (bodyType) {
                  if (bodyType == 'Cabrio'){
                    cy.selectSingleList('roof-equipment-convertible-roof-material',0)
                  }
                  if (bodyType == 'Coupe' || bodyType == 'Hatch3' || bodyType == 'Sedan' || bodyType == 'Hatch5' || bodyType == 'Station' || bodyType == 'SUV' || bodyType == 'MPV'){
                    cy.selectSingleList('roof-equipment-panorama-roof',0)
                  }

                  if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                    cy.selectSingleList('loading-floor-area-bend',0)
                  }
                })


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
              }) //clickableCar
            } // if
          })

          //pageId:"page-04"
          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'page-04'){
              //cy.selectDropDown('dropdown-selection-mmi-previous-damage',1)
              cy.get('select#dropdown-selection-mmi-previous-damage').select('geringer Vorschaden').should('have.value', '4: 0.8')
              cy.selectSingleList('triage-recommendation',0)
              cy.get('input#client-zip-code-input').type('10115').blur();
              cy.selectSingleList('self-service-link',0)
              cy.get('input[data-test="dropdown-selection-enabled-text-input_client-city"]').should('have.value', 'Berlin')
              nextBtn()
            }
          })

          //pageId:"summary-page"
          cy.get('@goingPageId').then(function (aliasValue) {
            if (aliasValue == 'summary-page'){
              if (executePost) {
                cy.get('button[type="submit"]').contains('Senden').click()
                cy.wait('@postPost').then(xhr => {
                  cy.postPost(xhr)
                })
              }
            }
          })
        }) //authenticate
    }) // it
  }) // forEach
}) //describe

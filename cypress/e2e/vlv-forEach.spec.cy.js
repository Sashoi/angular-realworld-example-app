/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'

const logFilename = 'cypress/fixtures/logs/vlvStandalone.log'
const PathToImages ='cypress/fixtures/images/'

describe('Start and complete vlv standalone questionnaire', () => {

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {
    cy.intercept('POST', `/b2b/integration/vlv/vlv-comprehensive-call-center?identifyVehicleAsync=false`).as('postStart')
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

  const loss_causeArray = ["Unfall", "Vandalismus", "Sturm", "Glasbruch", "Tierschaden"]
  const loss_causeArray1 = ["Unfall"]

  const file1 = [
    ["WAUZZZ4B73N015435", "Sedan", "01.01.2014", "AUD A6/S6/RS6 Sedan"],
  [
    "WDB2083441T069719",
    "Coupe",
    "01.01.2009",
    "MER CLK Coupe (partial identification, build period to be defined manually)"
  ]
  ]

  loss_causeArray.forEach(loss_cause => {
    file1.forEach($car => {
      it.only(`vlv Standalone, vin ${$car[0]}, loss_cause ${loss_cause} `, () => {

        const $vin = $car[0]

        cy.visit(`${baseUrl_lp}ui/questionnaire/zurich/#/login?theme=vlv`,{ log : false })
        // login
        cy.get('[placeholder="Email"]').type(Cypress.env("usernameHukS"))
        cy.get('[placeholder="Passwort"]').type(Cypress.env("passwordHukS"))
        cy.get('form').submit()
        cy.wait(500)
        cy.wait('@token',{requestTimeout : $requestTimeout, log : false}).then(xhr => {
          expect(xhr.response.statusCode).to.equal(200)
          const access_token = xhr.response.body.access_token
          cy.then(function () {
            questionnaire.authorization = `Bearer ${access_token}`
          })
        })  //wait @token


        const intS1 = getRandomInt(1000, 9999).toString()
        const intS2 = getRandomInt(1000, 9999).toString()
        const intS3 = getRandomInt(100, 999).toString()
        const intS4 = getRandomInt(0, 9).toString()
        const $equipment_2_loading_doors = true
        //let loss_causeRandom = getRandomInt(0,5)
        //loss_causeRandom = 3
        //const loss_cause = loss_causeArray[loss_causeRandom]

        const nextButtonLabel ='Weiter'
        const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
        const claimNumber = `${intS1}.${intS2}/${intS3}-${intS4}`
        console.log(`claimNumber: ${claimNumber}`)

        console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)
        const licenseplate = `SOF ${getRandomInt(1,9)}-${getRandomInt(100,999)}`
        console.log(`licenseplate: ${licenseplate}`);
        console.log(`loss_cause: ${loss_cause}`);

        cy.get('[name="claimNumber"]').type(claimNumber)
        cy.get('[data-test="standalone_vin"]').type($vin)
        cy.get('ng-select[data-test="standalone_lossCause"]').find('input[type="text"]').type(loss_cause,{force: true})
        cy.get('#firstRegistrationDate__input').type('10.05.2013')
        cy.get('#licensePlate').type(licenseplate)
        cy.get('#zipCode').type('2222')
        cy.get('[class="btn btn-primary btn-submit"]').click()
        cy.wait(500)

        cy.wait('@postStart', {log : false}).then(xhr => {
          expect(xhr.response.statusCode).to.equal(200)
          const questionnaireId = xhr.response.body.questionnaireId;
          cy.then(function () {
            questionnaire.Id = questionnaireId
          })
          console.log(`questionnaireId: ${questionnaireId}`)
          console.log(`uiUrl: ${xhr.response.body.uiUrl}`)
          //did not solve the problem cy.wait(5000) //Slow calculation of BodyType
        })
        cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')
        currentPage()

        //pageId: "page-01"
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-01'){
            if ( $vin == 'SALYL2RV8JA741831'){
               cy.wait(5000)
            }

            cy.getBodyType($car,logFilename).then(function (bodyType) {
              cy.then(function () {
                questionnaire.bodyType = bodyType
              })
            })
            cy.get('#accident-date-input').type('01.11.2023')
            if (loss_cause == 'Unfall'){
              cy.selectSingleList('loss-circumstances-details',1)
              cy.selectSingleList('loss-circumstances-details',0)
            }
            if (loss_cause == 'Tierschaden'){
              cy.selectSingleList('animal-species',1)
              cy.selectSingleList('animal-owner-known',0)
              cy.selectSingleList('collision-with-animal',0)
              cy.selectSingleList('accident-witness-present',0)
              cy.selectSingleList('police-ranger-informed',0)
            }
            cy.get('#vehicle-mileage-input').clear().type('123456')
            cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
              if (res){
                cy.selectDropDown('select_buildPeriod',2)
                cy.wait(2000)
              }
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
                cy.wait(2000)
                cy.selectSingleList('equipment-loading-area-cover-type',1)
              }
            })
            nextBtn()
          }
        })

        //pageId:"page-02"
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-02'){
            cy.wait('@clickableCar',{requestTimeout : $requestTimeout, log : false}).then(xhr => {
              expect(xhr.response.statusCode).to.equal(200)
              console.log(`Comming SVG with clickableCar`)
              const SVGbody = xhr.response.body;
              if (loss_cause == 'Glasbruch'){
                cy.selectSVG('windshield')
                cy.selectSingleList('windshield-equipment-windshield-electric',0)
                cy.selectMultipleList('windshield-damage-type',0)
                cy.selectMultipleList('windshield-damage-type',1)
                cy.selectSVG('zone-d')
                cy.selectSingleList('windshield-damage-size-stone-chips-bigger-2cm',0)
                cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',0)
              } else {
                cy.selectSingleList('vehicle-safe-to-drive',1)
                cy.selectSingleList('vehicle-ready-to-drive',1)
                cy.selectSingleList('unrepaired-pre-damages',0)
                cy.selectSingleList('vehicle-damage-repaired',1)
                cy.selectSingleList('cash-on-hand-settlement-preferred',1)
                cy.selectSingleList('repair-network-preferred',1)
                //hood
                cy.selectSVG('hood')
                cy.selectMultipleList('hood-damage-type',1)
                cy.selectSingleList('hood-damage-size',2)

                cy.selectSVG('exhaust') // Welche Art von Beschädigung sehen Sie? - selected

                cy.selectSVG(`right-taillight`)
                cy.selectSingleList('right-taillight-equipment-led-rear-lights', 0)

                cy.selectSVG(`left-sill`)
                cy.selectMultipleList('left-sill-damage-type', 1)
                cy.selectSingleList('left-sill-damage-size', 3)

                cy.get('@bodyType').then(function (bodyType) {
                  if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                    cy.selectSingleList('loading-floor-area-bend',0)
                  }
                })
              }
            })
            cy.wait(2000)
            nextBtn()
          }
        })

        //pageId:"page-03"
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-03'){
            nextBtn()
          }
        })

        //pageId:"page-04"
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'page-04'){
            cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,'registration-part-1.jpg')
            cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
            cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
            cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,'interior-front.jpg')
            cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
            if (loss_cause != 'Glasbruch'){
              cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
              cy.uploadImage('damage-photo-upload-detail-hood',PathToImages,'hood-d.jpg')
              cy.uploadImage('damage-photo-upload-overview-left-sill',PathToImages,'left-sill-o.jpg')
              cy.uploadImage('damage-photo-upload-detail-left-sill',PathToImages,'left-sill-d.jpg')
              cy.uploadImage('damage-photo-upload-overview-exhaust',PathToImages,'broken exhaust_1.jpg')
              cy.uploadImage('damage-photo-upload-detail-exhaust',PathToImages,'broken exhaust_2.jpg')
              cy.uploadImage('damage-photo-upload-overview-right-taillight',PathToImages,'right-taillight-o.jpg')
              cy.uploadImage('damage-photo-upload-detail-right-taillight',PathToImages,'right-taillight-d.jpg')
            }
            cy.uploadImage('damage-photo-upload-other',PathToImages,'incident-location-photo-upload-1.jpg')
            cy.uploadImage('damage-photo-upload-other',PathToImages,'incident-location-photo-upload-2.jpg')
            cy.uploadImage('damage-photo-upload-other',PathToImages,'incident-location-photo-upload-3.jpg')
            nextBtn()
          }
        })

        //"summary-page"
        cy.get('@goingPageId').then(function (aliasValue) {
          if (aliasValue == 'summary-page'){
            cy.get('@questionnaireId').then(function (Id) {
              console.log(`from summary-page, saved questionnaireId: ${Id}`);
            })
            if (executePost) {
              cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()
              cy.wait('@postPost', { log : false }).then(xhr => {
                cy.postPost(xhr)
              })
            }
          }
        })
      })  //it vlv

      it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
        cy.GeneratePDFs(['vlv_abschlussbericht'])
      }) //it PDF from commands
    }) //forEach
  }) //forEach loss_causeArray
})

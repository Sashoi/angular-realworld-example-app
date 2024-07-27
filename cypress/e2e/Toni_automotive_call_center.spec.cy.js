/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
//import emailBody from '../fixtures/templates/emailBodyA.json'
import b2bBody from '../fixtures/templates/b2bBodyToni_A.json'
import header from '../fixtures/header.json'

const logFilename = 'cypress/fixtures/logs/toniAutomotiveCallCenter.log'
const PathToImages ='cypress/fixtures/images/'
const b2bBodySave = 'cypress/fixtures/templates/toniAutomotiveCallCenterSave.json'

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
  const $requestTimeout = 60001;
  const executePost = true
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

  function isPartSelected(selectedParts,searchPart) {
    if (Array.isArray(selectedParts)){
      if (selectedParts.length > 0){
        const value = selectedParts[0][searchPart]
        if (value != undefined){
          //console.log(`searchPart: ${searchPart} value: ${value}`);
          if (value != undefined){
            const res = value == 'yes'
            console.log(`value == 'yes': ${res}`);
            return res
          }
        } else {
          //console.log(`searchPart: ${searchPart} value: ${value}`);
          return false
        }
      }
      return false
    }
    return false
  }

const coverage_type_info_clientArr =
["collision 0", "glass 1","PartiallyComprehensiveAnimalCollisionDamageCarIH 2","natural-disaster 3",
 "OptionalParkCoverageParkingDamage 4","PartiallyComprehensiveMarten 5","PartiallyComprehensiveFire 6","theft-robbery-embezzlement 7",
 "PartiallyComprehensiveVandalism 8","VehicleLiabilityNotCustomer 9","OptionalAssistance 10","OptionalLegalAssistance 11",
]

const coverage_type_info_clien = 2  // ok all 12

const vehicle_body_type_array = [
  "Hatch3", "Station", "Coupe", "Sedan", "Van", "MiniBus", "PickUpSingleCabine", "Cabrio", "Other"
]

const vehicle_body_type_value = 0;


  const file1 = [
      ["WBAUB310X0VN69014", "Hatch3", "01.01.2012", "BMW 1 Series Hatch3"]
]
  file1.forEach($car => {
    it(`Toni automotive - toni_automotive_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]

      const intS3 = getRandomInt(100,999).toString()
      const $equipment_2_loading_doors = true

      let  first_registration_date = $car[2]
      //const f_first_registration_date = '2017-06-14'
      console.log(`first registration date: ${first_registration_date}`)
      first_registration_date = convertDate(first_registration_date)

      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)
      const licensePlate = `TONI ${intS3}9`
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
          cy.writeFile(b2bBodySave, b2bBody)
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
          cy.selectSingleList('coverage-type-info-client', coverage_type_info_clien)
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
            if (bodyType == undefined || bodyType == null || bodyType == ''){
              cy.selectSingleList('vehicle-body-type',vehicle_body_type_value)
              cy.then(function () {
                questionnaire.bodyType = vehicle_body_type_array[vehicle_body_type_value]
              })
            }
          })
          cy.wait(2000)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          cy.selectSingleList('glass-damage-type',0)
          cy.wait(2000)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-05'){
          cy.getQuestionAnswer('coverage-type-info').then(function (answer) {
            console.log(`coverage-type-info : ${answer}`);
            const coverage_type_arr = new Array('glass', 'OptionalParkCoverageParkingDamage', 'PartiallyComprehensiveMarten', 'OptionalAssistance', 'OptionalLegalAssistance')
            if (coverage_type_arr.includes(answer.toString())){
              cy.get('input#incident-date-input').type(`01-06-2024`)
            }
            const coverage_type_arr2 = new Array('VehicleLiabilityNotCustomer', 'collision', 'PartiallyComprehensiveAnimalCollisionDamageCarIH', 'natural-disaster', 'PartiallyComprehensiveFire', 'theft-robbery-embezzlement', 'PartiallyComprehensiveVandalism', 'OptionalParkCoverageParkingDamage')
            if (coverage_type_arr2.includes(answer.toString())){
              if (answer.toString() != 'OptionalParkCoverageParkingDamage'){
                cy.get('input#incident-date-time-input').type(`01-06-2024`)
                cy.get('input[placeholder="HH"]').type(`10`)
                cy.get('input[placeholder="MM"]').type(`11`)
              }
              cy.get('input#incident-place-street-name-input').type(`incident place street name`)
              cy.get('input#incident-place-street-number-input').type(`13 A 1`)
              cy.get('input#incident-place-zip-code-input').type(`8000`).blur();
              cy.get('input#incident-place-street-number-input').focus()
              cy.get('input[data-test="dropdown-selection-enabled-text-input_incident-place-city"]').should('have.value', 'Zürich')
            }
          })

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
          cy.selectSingleList('accident-with-animal',0)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-09'){
          cy.getQuestionAnswer('coverage-type-info').then(function (answer) {
            if (answer == 'natural-disaster'){
              cy.selectSingleList('reason-for-loss',0)
            }
          })
          cy.get('textarea#reason-for-loss-description-textarea').clear().type('Bitte beschreiben Sie in Ihren eigenen Worten was genau passiert ist{enter}')
          cy.get('textarea#reason-for-loss-description-textarea').type('Bitte beschreiben Sie in Ihren eigenen Worten was genau passiert ist{enter}')
          cy.get('textarea#reason-for-loss-description-textarea').type('Bitte beschreiben Sie in Ihren eigenen Worten was genau passiert ist')
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
          cy.selectSingleList('liability-accident-responsible',1)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-12'){
          cy.selectSingleList('vehicle-position',1)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-13'){
          cy.selectSingleList('theft-robbery-embezzlement-details',0)
          cy.selectSingleList('theft-robbery-embezzlement-vehicle-owner',1)
          cy.get('textarea[data-test="text-area-question-type-theft-robbery-embezzlement-vehicle-owner.c-leasing-name"]').type('theft-robbery-embezzlement-vehicle-owner.c-leasing-name-textarea')
          cy.get('textarea[data-test="text-area-question-type-theft-robbery-embezzlement-vehicle-owner.c-leasing-number"]').type('123 456')
          cy.get('input#vehicle-mileage-estimated-input').type('123654').blur()
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-14'){
          cy.selectSingleList('vandalism-type',0)
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
          cy.getQuestionAnswer('coverage-type-info').then(function (answer) {
            if ('PartiallyComprehensiveAnimalCollisionDamageCarIH' == answer.toString()){
              cy.selectSingleList('ranger-informed',0)
            }
          })
          cy.getQuestionAnswer('coverage-type-info').then(function (answer) {
            if ('VehicleLiabilityNotCustomer' == answer.toString()){
              cy.selectSingleList('accident-protocol',1)
            }
          })

          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-17'){
          const compoundQuestion = 'accident-opponent-vehicle-owner'
          cy.get(`div#${compoundQuestion}`).find(`input#${compoundQuestion}-first-name__--__0-input`).type(`first name`)
          cy.get(`div#${compoundQuestion}`).find(`input#${compoundQuestion}-last-name__--__0-input`).type(`last name`)
          cy.get(`div#${compoundQuestion}`).find(`input#${compoundQuestion}-zip-code__--__0-input`).type(`8000`)
          cy.get(`div#${compoundQuestion}`).find(`input#${compoundQuestion}-phone-number__--__0-input`).type(`1234567890`,{delay : 200})
          cy.get(`div#${compoundQuestion}`).find(`input#${compoundQuestion}-vehicle-license-plate__--__0-input`).type(`TONI 123`)
          cy.get(`div#${compoundQuestion}`).find(`textarea#${compoundQuestion}-damage-description__--__0-textarea`).type(`Bitte beschreiben Sie die Beschädigung am Fahrzeug des Geschädigten:`)

          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-20'){
          cy.get('input#ranger-info-phone-number-input').type(`+1234567`)

          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-21'){
          cy.selectSingleList('perpetrator-known',1)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-22'){
          cy.get('input#accident-opponent-fire-first-name-input').type(`Fire first name`)
          cy.get('input#accident-opponent-fire-last-name-input').type(`Fire last name`)
          cy.get('input#accident-opponent-fire-phone-number-input').type(`+1234567789`)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-23'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            cy.getQuestionAnswer('coverage-type-info').then(function (answer) {
              console.log(`coverage-type-info : ${answer}`);
              const coverage_type_arr = new Array("VehicleLiabilityNotCustomer", "collision", "PartiallyComprehensiveAnimalCollisionDamageCarIH", "natural-disaster", "OptionalParkCoverageParkingDamage", "PartiallyComprehensiveVandalism", "glass")
              if (coverage_type_arr.includes(answer.toString())){
                if (answer != 'glass'){
                  if (xhr.response.body.search('g id="hood"') > 0){
                    cy.selectSVG('hood')
                    cy.selectSVG('roof')
                    cy.get('@goingPageElements').then(function (elements) {
                      elements.forEach(element => {
                        if (element['id'] == 'vehicle-mileage'){
                          console.log(`${JSON.stringify(element)}`);
                          cy.get('input#vehicle-mileage-input').clear().type('123654')
                        }
                      })
                    })

                    cy.wait(2000)
                    cy.selectMultipleList('hood-damage-type',0)
                    cy.selectMultipleList('roof-damage-type',0)
                  }
                  cy.get('@bodyType').then(function (bodyType) {
                    if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                      cy.selectSingleList('loading-floor-area-bend', 0)
                      cy.wait(1000)
                    }
                  })
                  cy.get('@bodyType').then(function (bodyType) {
                    if (bodyType == 'Cabrio'){
                      cy.selectSingleList('roof-equipment-convertible-roof-material', 0)
                      cy.wait(1000)
                    }
                  })
                } else {
                  if (xhr.response.body.search('g id="windshield"') > 0){
                    cy.selectSVG('windshield')
                    cy.get('@goingPageElements').then(function (elements) {
                      elements.forEach(element => {
                        if (element['id'] == 'vehicle-mileage'){
                          console.log(`${JSON.stringify(element)}`);
                          cy.get('input#vehicle-mileage-input').clear().type('123654')
                        }
                      })
                    })
                    cy.get('@bodyType').then(function (bodyType) {
                      if (bodyType == 'Cabrio'){
                        cy.selectSingleList('roof-equipment-convertible-roof-material', 0)
                        cy.wait(1000)
                      }
                    })

                    cy.wait(2000)
                    cy.selectSingleList('windshield-equipment-windshield-electric',0)
                    cy.selectMultipleList('windshield-damage-type',0)
                    cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',1)
                  }
                }
              }
            })
            nextBtn()
          })
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-24'){
          cy.selectSingleList('repair-cost-estimate-available',1)
          cy.getQuestionAnswer('glass-damage-type').then(function (answer) {
            console.log(`glass-damage-type : ${answer}`);
            if (answer == 'windows-only'){
              cy.selectSingleList('glass-damage-repaired',1)
            }
          })
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-25'){
          cy.getQuestionAnswer('selected-parts').then(function (selectedParts) {
            console.log(`selectedParts: ${JSON.stringify(selectedParts)}`);
            cy.getQuestionAnswer('coverage-type-info').then(function (coverage_type_info) {
              console.log(`coverage-type-info : ${coverage_type_info}`);
              const coverage_type_arr = new Array("VehicleLiabilityNotCustomer", "collision", "PartiallyComprehensiveAnimalCollisionDamageCarIH", "natural-disaster", "OptionalParkCoverageParkingDamage", "PartiallyComprehensiveVandalism")
              if (coverage_type_arr.includes(coverage_type_info.toString())){
                cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
                cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
                if ([
                  "VehicleLiabilityNotCustomer",
                  "collision",
                  "PartiallyComprehensiveAnimalCollisionDamageCarIH"
                ].includes(coverage_type_info.toString())){
                  cy.uploadImage('photo-upload-incident-place',PathToImages,'vehicle-left-rear-photo1.jpg')
                  cy.uploadImage('photo-upload-sketch-accident-situation',PathToImages,'vehicle-left-rear-photo1.jpg')
                  if ( "collision" ==  coverage_type_info.toString()){
                    cy.uploadImage('photo-upload-accident-report',PathToImages,'vehicle-left-rear-photo1.jpg')
                  }
                }
                if (isPartSelected(selectedParts,'hood')) {
                  cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
                  cy.uploadImage('damage-photo-upload-detail-hood',PathToImages,'hood-d.jpg')
                }
                if (isPartSelected(selectedParts,'roof')) {
                  cy.uploadImage('damage-photo-upload-overview-roof',PathToImages,'roof.jpg')
                  cy.uploadImage('damage-photo-upload-detail-roof',PathToImages,'roof-d.jpg')
                }
                if (coverage_type_arr.includes(coverage_type_info.toString(),1)){
                  cy.get('input#send-email-for-upload-photos-input').clear().type('sivanchevski@soft2run.com')
                }
              }
              const coverage_type_arr2 = new Array("VehicleLiabilityNotCustomer", "collision", "glass", "PartiallyComprehensiveAnimalCollisionDamageCarIH", "natural-disaster", "OptionalParkCoverageParkingDamage", "PartiallyComprehensiveVandalism")
              if (coverage_type_arr2.includes(coverage_type_info.toString())){
                if (isPartSelected(selectedParts,'windshield')) {
                  cy.uploadImage('damage-photo-upload-overview-windshield',PathToImages,'airbag.jpg')
                  cy.uploadImage('damage-photo-upload-detail-windshield',PathToImages,'airbag.jpg')
                }
              }
            })
          })
          cy.getQuestionAnswer('ranger-informed').then(function (answer) {
            if (answer == 'yes'){
              cy.uploadImage('photo-upload-ranger-report', PathToImages,'airbag.jpg')
            }
          })
          cy.getQuestionAnswer('theft-robbery-embezzlement-details').then(function (answer) {
            if (answer == 'total-theft'){
              cy.uploadImage('photo-upload-repair-vehicle-purchase-contract', PathToImages,'airbag.jpg')
            }
          })
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

          cy.getQuestionAnswer('coverage-type-info').then(function (answer) {
            console.log(`coverage-type-info : ${answer}`);
          })

          cy.elementExists('div#summary-confirmation-acknowledgement').then(($element) => {

          })
          cy.getQuestionAnswer('coverage-type-info').then(function (coverage_type_info) {
            const coverage_type_arr = new Array("VehicleLiabilityNotCustomer", "collision", "glass", "PartiallyComprehensiveAnimalCollisionDamageCarIH", "natural-disaster", "OptionalParkCoverageParkingDamage", "PartiallyComprehensiveMarten", "PartiallyComprehensiveFire", "theft-robbery-embezzlement", "PartiallyComprehensiveVandalism")
            if (coverage_type_arr.includes(coverage_type_info.toString())){
              cy.selectMultipleList('summary-confirmation-acknowledgement',0)
            }
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

    it(`toni_automotive_claim_handler get requestUrl vin ${$car[0]}`, () => {
      const notificationId = Cypress.env('notificationId') //`wlA4icU77W6LjzUFyrGzy`
      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
        Cypress._.merge(header, {'authorization':authorization});
        const options = {
          method: 'GET',
          url: `${baseUrl_lp}damage/notification/${notificationId}`,
          body: {},
          headers: header
        };
        cy.request(options).then(
          (response) => {
            // response.body is automatically serialized into JSON
            expect(response.status).to.eq(200) // true
            console.log(`toni_automotive_call_center:`);
            const arrLength = response.body.body.requestedInformation.length
            const requestedInformation = response.body.body.requestedInformation[arrLength - 1]
            const requestUrl = requestedInformation.requestUrl
            console.log(`requestUrl : ${requestUrl}`);
            Cypress.env('requestUrl', requestUrl)
            const templateId = requestedInformation.templateId
            console.log(`templateId : ${templateId}`);
            Cypress.env('templateId', templateId)
            //cy.printRequestedInformation(response.body.requestedInformation);
        })
      })
    })


    it(`toni_automotive_claim_handler execute vin ${$car[0]}`, () => {
      cy.wait(2000)
      let requestUrl = Cypress.env('requestUrl')
      //requestUrl = 'https://dev02.spearhead-ag.ch:443/p/r/T9AxhE834hVZc2fVzB3aY'
      console.log(`Start ${Cypress.env('templateId')} from url: ${requestUrl}.`)

      cy.wait(4000)

      cy.visit(requestUrl,{log : false})

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.get('input#vehicle-license-plate-input').clear().type('toni_automotive_claim_handler')
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
          cy.selectSingleList('incident-reporter-type',0)
          cy.get('input#incident-reporter-first-name-input').clear().type('First name')
          cy.get('input#incident-reporter-last-name-input').clear().type('Last name')
          cy.get('input#incident-reporter-email-input').clear().type('sivanchevski@soft2run.com')
          cy.get('input#incident-reporter-phone-number-input').clear().type('12345678')
          cy.get('input#incident-reporter-street-name-input').clear().type('London')
          cy.get('input#incident-reporter-zip-code-input').clear().type('10115')
          cy.get('input#incident-reporter-street-number-input').clear().type('101 A2')
          cy.get('input[data-test="dropdown-selection-enabled-text-input_incident-reporter-place"]').should('have.value', 'Berlin')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.get('input#repair-location-zipcode-input').clear().type('22222')
          nextBtn()
        }
      })
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          if (executePost2) {
            //pageId: "summary-page"
            //cy.selectMultipleList('summary-confirmation-acknowledgement',0)
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

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['toni_default', 'toni_tele_check', 'toni_tele_expert']) // 'toni_hdi_tele_check',
    }) //it PDF from commands

  })
})

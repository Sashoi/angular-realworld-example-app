/// <reference types="cypress" />
import * as util from 'util' // has no default export
//import { inspect } from 'util' // or directly
// or
//var util = require('util')

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
//import b2bBody from '../fixtures/templates/dekraIntComprehensiveCallCenterBody.json'
//import injectQuestions from '../fixtures/templates/injectQuestions.json'


const logFilename = 'cypress/fixtures/logs/dekra_int_comprehensive_call_center.log'

describe('Start and complete dekra_int_comprehensive_call_center standalone questionnaire', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    cy.intercept('POST', `/b2b/integration/pnw/dekraSampleCallCenter`).as('dekraSampleCallCenter')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = false
  const interceptDekraStandalone = false
  const vehicle_hsn_tsn = '0588AUC'
  const vehicle_identification_by_hsn_tsn = true

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

  const file1 = [
    ["WVWZZZ7NZDV041367", "MPV", "01.01.2011", "VW Sharan MPV"],
  ["SALYL2RV8JA741831", "SUV", "01.01.2019", "Land Rover, SUV"],
  ["ZFA25000002K44267", "MiniBusMidPanel", "01.01.2019", "Fiat Ducato"]
  ]
  file1.forEach($car => {
    it.only(`dekra_int_comprehensive_call_center standalone questionnaire, vin ${$car[0]}`, () => {

      const $vin = $car[0]

      cy.visit(`https://${$dev}.spearhead-ag.ch/ui/questionnaire/dekra/#/standalone/home`,{ log : false })
      // login
      cy.get('[placeholder="Email"]').type(Cypress.env("usernameHukS"))
      cy.get('[placeholder="Passwort"]').type(Cypress.env("passwordHukS"))
      cy.get('form').submit()


      cy.wait('@token',{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const access_token = xhr.response.body.access_token
        cy.then(function () {
          questionnaire.authorization = `Bearer ${access_token}`
        })
      })  //wait @token

      cy.wait(500)

      const intS2 = getRandomInt(1000000,9999999).toString()
      const intS3 = getRandomInt(1000,9999).toString()
      const $equipment_2_loading_doors = true


      const first_registration_date = $car[2] //"2024-02-01";
      let f_first_registration_date = $car[2] //'01.02.2024';
      console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)
      console.log(`first_registration_date: ${first_registration_date}`)
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      const claimNumber = `DekraIntCCC${intS2}`
      const licensePlate = `DEK ${intS3} C`
      console.log(`claimNumber: ${claimNumber}`)

      // Fulfill standalone form

      cy.get('input[name="claimNumber"]').type(claimNumber);
      if ( !vehicle_identification_by_hsn_tsn ){
        cy.get('input[data-test="standalone_vin"]').type($vin)
      } else {
        cy.get('input[data-test="standalone_countryVehicleIdentification"]').type(vehicle_hsn_tsn)
        f_first_registration_date = '01.01.2015'
        cy.get('input[data-test="standalone_vin"]').focus() //this is a bug
      }
      cy.get('input[formcontrolname="firstRegistrationDate"]').type(f_first_registration_date)
      cy.get('input#zipCode[data-test="standalone_zipCode"]').type('22222')

      if (interceptDekraStandalone){
       // with this intercept I'm replacing the body of standalone
       // adding 'roof' as selected SVG, to be implement
        cy.intercept('POST', `/b2b/integration/pnw/dekraSampleCallCenter`, (req) => {
          b2bBody.qas.find(q => {return q.questionId === "license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "claimant-vehicle-license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "first-registration-date"}).answer = first_registration_date
          b2bBody.qas.find(q => {return q.questionId === "claim-number"}).answer = claimNumber
          b2bBody.supportInformation.claimNumber = claimNumber
          b2bBody.supportInformation.vin = $vin

          req.body = b2bBody
        })
      }
      cy.get('button[data-test="standalone_submit"]').click()

      cy.wait('@dekraSampleCallCenter',{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const questionnaireId = xhr.response.body.questionnaireId
        console.log(`b2b questionnaireId: ${questionnaireId}`);
        cy.then(function () {
          questionnaire.Id = questionnaireId
        })
        const uiUrl = xhr.response.body.uiUrl
        console.log(`b2b uiUrl: ${uiUrl}`);
        //cy.intercept('POST', `/questionnaire/${questionnaireId}/page/page-02?navigateTo=next&offset=180&locale=de`).as('injectQuestions')
      }) //wait('@dekraSampleCallCenter',

      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
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
              cy.wait(2000)
              cy.selectSingleList('equipment-loading-area-cover-type',1)
            }
          })
          cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
            if (res){
              //cy.selectDropDown('select_buildPeriod',1)
              const selectorId = 'select_buildPeriod'
              const option = [1]
              cy.get(`select#${selectorId}`).invoke('attr', 'class').then($classNames => {
                console.log(`class Names :  ${$classNames}.`)
                if ($classNames.includes('field-invalid')) {
                  cy.get(`select#${selectorId}`).select(option,{force: true})//.should('have.value', '200501')
                  cy.wait(2000)
                  cy.get(`select#${selectorId}`).invoke('val').then($val => {
                    console.log(`selected for ${selectorId} :  ${$val}.`)
                    cy.get(`select#${selectorId}`).should('have.value', $val)
                  })
                }
              })
              cy.wait(2000)
              cy.get('input#vehicle-first-registration-date-input').focus()
              cy.wait(2000)
            }
          })
          cy.get('input#accident-date-input').type('01.05.2024')
          cy.selectSingleList('loss-cause', 0)
          cy.selectSingleList('loss-circumstances-details', 0)
          cy.selectSingleList('switch-to-self-service-workflow', 0)
          cy.get('input#client-vehicle-license-plate-input').type(licensePlate)
          cy.get('input#vehicle-mileage-input').type('321334')
          cy.selectSingleList('insurance-policy-type', 0)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout, log : false}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            const SVGbody = xhr.response.body;
            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                cy.selectSingleList('loading-floor-area-bend', 0)
                //load-doors and rear-windows
                if ($equipment_2_loading_doors){
                  if (SVGbody.search('g id="right-load-door"') > 0 ){
                    cy.selectSVG(`right-load-door`)
                    cy.selectMultipleList('right-load-door-damage-type', 1)
                    cy.selectSingleList('right-load-door-damage-size', 2)
                    cy.selectSVG(`left-load-door`)
                    cy.selectMultipleList('left-load-door-damage-type', 1)
                    cy.selectSingleList('left-load-door-damage-size', 2)
                    //cy.selectSVG(`left-rear-door-window`)
                    //cy.selectSVG(`right-rear-door-window`)
                  }
                }
                //load-doors and rear-windows
                if (!$equipment_2_loading_doors){
                  if (SVGbody.search('g id="tailgate"') > 0 ){
                    cy.selectSVG(`tailgate`)
                    cy.selectSingleList('tailgate-still-open-close-easily', 1)
                    cy.selectMultipleList('tailgate-damage-type', 1)
                    cy.selectSingleList('tailgate-damage-size', 2)
                    cy.selectSVG(`rear-window`)
                  }
                }
              }
              if (bodyType == 'MPV' || bodyType == 'Hatch3' || bodyType == 'Hatch5' || bodyType == 'Sedan' ||
                  bodyType == 'Coupe' || bodyType == 'Cabrio' || bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine' ||
                  bodyType == 'SUV'){
                const regex = /g .*id="tailgate"/;
                if (SVGbody.search(regex) > 0 ){
                  cy.selectSVG(`tailgate`)
                  cy.selectMultipleList('tailgate-damage-type', 0)
                  cy.selectMultipleList('tailgate-damage-type', 1)
                  cy.selectSingleList('tailgate-damage-size', 2)
                  cy.selectSVG(`rear-window`) // rear-window-damage-type_0 preselected
                }
              }
            }) //get('@bodyType'

            if (xhr.response.body.search('g id="hood"') > 0){
              cy.selectSVG('hood')
              cy.selectMultipleList('hood-damage-type',0)
            }

            cy.get('#repair-location-zip-code-input').clear().type('22222')
            cy.selectMultipleList('hood-damage-type',0)
            cy.selectMultipleList('hood-damage-type',1)
            cy.selectSingleList('hood-damage-size',2)
            cy.selectSingleList('hidden-damage-front-zone-damage-level',3)
            if (true){
              if (xhr.response.body.search('g id="right-front-wheel"') > 0){
                cy.selectSVG('right-front-wheel')
                cy.wait(2000)
                cy.selectSingleList('right-front-wheel-equipment-rims-type',0)
                cy.selectMultipleList('right-front-wheel-damage-type',1)
              }

              if (xhr.response.body.search('g id="right-rear-wheel"') > 0){
                cy.selectSVG('right-rear-wheel')
                cy.selectSingleList('right-rear-wheel-equipment-rims-type',0)
                cy.selectMultipleList('right-rear-wheel-damage-type',0)
                cy.selectMultipleList('right-rear-wheel-damage-type',1)
              }
              if (xhr.response.body.search('g id="right-front-wheel-tire"') > 0){
                cy.selectSVG('right-front-wheel-tire')
              }
              if (xhr.response.body.search('g id="right-rear-wheel-tire"') > 0){
                cy.selectSVG('right-rear-wheel-tire')
              }
              if (xhr.response.body.search('g id="left-front-wheel"') > 0){
                cy.selectSVG('left-front-wheel')
                cy.selectSingleList('left-front-wheel-equipment-rims-type',0)
                cy.selectMultipleList('left-front-wheel-damage-type',1)
              }
              if (xhr.response.body.search('g id="left-rear-wheel"') > 0){
                cy.selectSVG('left-rear-wheel')
                cy.selectSingleList('left-rear-wheel-equipment-rims-type',0)
                cy.selectMultipleList('left-rear-wheel-damage-type',0)
                cy.selectMultipleList('left-rear-wheel-damage-type',1)
              }
              if (xhr.response.body.search('g id="left-front-wheel-tire"') > 0){
                cy.selectSVG('left-front-wheel-tire')
              }
              if (xhr.response.body.search('g id="left-rear-wheel-tire"') > 0){
                cy.selectSVG('left-rear-wheel-tire')
              }
            }
            cy.selectSVG('windshield')
            cy.selectSingleList('windshield-equipment-windshield-electric',0)
            cy.selectMultipleList('windshield-damage-type',0)
            cy.selectMultipleList('windshield-damage-type',1)
            cy.selectMultipleList('windshield-damage-type',2)
            cy.selectSVG('zone-d')
            cy.selectSVG('zone-a')
            cy.selectSVG('zone-c')
            cy.selectSVG('zone-b')
            //cy.selectSingleList('windshield-damage-quantity',3)
            cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',0)
            cy.selectSingleList('windshield-damage-size-stone-chips-bigger-2cm',0)
            cy.selectSingleList('windshield-damage-size-crack-bigger-2cm',0)
            cy.selectSingleList('vehicle-damage-repaired',0)
          }) //wait('@clickableCar'
          nextBtn()

          // does not work
          // cy.wait('@injectQuestions',{requestTimeout : $requestTimeout}).its("response").then(response => {
          //   expect(response.statusCode).to.equal(200)
          //   //console.log(`injectQuestions: ${JSON.stringify(xhr.response.body.elements)}`);
          //   //let newResponse = response
          //   injectQuestions.forEach((question, index) => {
          //     //xhr.response.body.elements.insert(0,question)
          //     response.body.elements.push(question)
          //     response.body.uiBlocks[2].elements.sections[0].questionIds.push(question.id)
          //     console.log(`inject question: ${question.id}`);
          //   })
          //   response.body.uiBlocks[2].elements.sections[0].label.content = `My label.content`
          //   return response
          //   //response.reply(newResponse)
          // }) //wait('@injectQuestions')
        } //'page-02'
      }) //get('@goingPageId'





      // Schadenbilder und Dokumente - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('photos-available',1)
          cy.selectSingleList('photos-not-available-because',2)
          nextBtn()
        }
      })

      // Regulierungs- und Handlungsempfehlung
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          cy.selectSingleList('triage-recommendation',0)
          cy.selectSingleList('reason-for-change-of-system-recommendation',0)
          nextBtn()
        }
      })

      //Zusammenfassung, post questionnaire - summary-page
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, saved questionnaireId: ${Id}`);
          })
          if (executePost) {
            cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    }) //it

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['zurich_default','zurich_pg1_schadenbericht','zurich_pg1_schadenprotokoll'])
    }) //it PDF from commands

  })  //forEach
}) //describe

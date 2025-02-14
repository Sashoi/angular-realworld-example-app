/// <reference types="cypress" />
import * as util from 'util' // has no default export
//import { inspect } from 'util' // or directly
// or
//var util = require('util')

const { resolveProjectReferencePath } = require("typescript")
import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBodyZurich.json'
import header from '../fixtures/header.json'


const logFilename = 'cypress/fixtures/logs/zurichStandalone.log'
const b2bBodySave = 'cypress/fixtures/templates/b2bBodyZurichSave.json'

describe('Start and complete zurich standalone questionnaire - urichz_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    cy.intercept('POST', `/b2b/integration/zurich/zurichStandalone`).as('zurichStandalone')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const interceptZurichStandalone = false

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

  function convertDate(dateString){
    var p = dateString.split(/\D/g)
    return [p[2],p[1],p[0] ].join("-")
  }

  const file1 = [
    ["WF0KXXTTRKMC81361", "VanMidPanel", "01.01.2020", "Ford Transit 06/2021 "]
  ]
  file1.forEach($car => {
    it(`zurich standalone questionnaire - zurich_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]

      //Login()
      cy.standaloneLogin('zurich').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })

      cy.wait(500)

      const intS2 = getRandomInt(10,99).toString()
      const intS7 = getRandomInt(1000000,9999999).toString()
      const intS4 = getRandomInt(1000,9999).toString()
      const intS1 = getRandomInt(1,9).toString()
      const $equipment_2_loading_doors = true
      const claimTypeArray = ["VK","TK","KH"]
      const claimTypeRandom = getRandomInt(0,3)
      const claimType = claimTypeArray[claimTypeRandom].toLocaleLowerCase() // Check if app makes them upper case.


      const first_registration_date = "2024-02-01";
      const f_first_registration_date = '01.02.2024';
      console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)
      console.log(`first_registration_date: ${first_registration_date}`)
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      const claimNumber = `${intS2}-${intS7}-${claimType}${intS1}`
      const licensePlate = `ZUR ${intS4}`
      console.log(`claimNumber: ${claimNumber}`)

      // Fulfill standalone form
      //cy.get('ng-select[data-test="standalone_company"]').find('input').type('D',{force: true}) //D or Z
      cy.get('input[name="claimNumber"]').type(claimNumber);
      cy.get('input[data-test="standalone_vin"]').type($vin)
      cy.get('input[formcontrolname="firstRegistrationDate"]').type(f_first_registration_date)
      //cy.get('input[formcontrolname="mileage"]').type('123.456')
      cy.get('[data-test="standalone_licensePlate"]').type(licensePlate)
      if (interceptZurichStandalone){
       // with this intercept I'm replacing the body of standalone
       // adding 'roof' as selected SVG
        cy.intercept('POST', `/b2b/integration/zurich/zurichStandalone`, (req) => {

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
      cy.get(`input[name="claimNumber"]`).invoke('val').then($val => {
        console.log(`claimNumber after: ${$val}`)
      })
      cy.get('button[data-test="standalone_submit"]').click()

      cy.wait('@zurichStandalone',{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const questionnaireId = xhr.response.body.questionnaireId
        console.log(`b2b questionnaireId: ${questionnaireId}`);
        cy.then(function () {
          questionnaire.Id = questionnaireId
        })
        const uiUrl = xhr.response.body.uiUrl
        console.log(`b2b uiUrl: ${uiUrl}`);
      }) //wait('@zurichStandalone',

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
          cy.fillInvalidDropDown('select_specialModel')
          cy.wait(2000)
          cy.fillInvalidDropDown('select_buildPeriod')
          cy.wait(2000)
          cy.selectSingleList('mileage-from-zurich-table',1)
          cy.get('#vehicle-mileage-input').clear().type('123456')
          // cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
          //   if (res){
          //     //cy.selectDropDown('select_buildPeriod',1)
          //     const selectorId = 'select_buildPeriod'
          //     const option = [1]
          //     cy.get(`select#${selectorId}`).invoke('attr', 'class').then($classNames => {
          //       console.log(`class Names :  ${$classNames}.`)
          //       if ($classNames.includes('field-invalid')) {
          //         cy.get(`select#${selectorId}`).select(option,{force: true})//.should('have.value', '200501')
          //         cy.wait(2000)
          //         cy.get(`select#${selectorId}`).invoke('val').then($val => {
          //           console.log(`selected for ${selectorId} :  ${$val}.`)
          //           cy.get(`select#${selectorId}`).should('have.value', $val)
          //         })
          //       }
          //     })
          //     cy.wait(2000)
          //     cy.get('input#vehicle-first-registration-date-input').focus()
          //     cy.wait(2000)
          //   }
          // })
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
            cy.selectSingleList('damage-description-completed',1)
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
            cy.selectMultipleList('windshield-damage-type',0)
            cy.selectMultipleList('windshield-damage-type',1)
            cy.selectMultipleList('windshield-damage-type',2)
            cy.selectSVG('zone-d')
            cy.selectSVG('zone-a')
            cy.selectSVG('zone-c')
            cy.selectSVG('zone-b')
            cy.selectSingleList('windshield-damage-quantity',3)
            cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',0)
            cy.selectSingleList('windshield-damage-size-stone-chips-bigger-2cm',0)
            cy.selectSingleList('windshield-damage-size-crack-bigger-2cm',0)
            cy.selectSingleList('windshield-equipment-windshield-electric',0)

            cy.selectSVG('underbody')
            cy.selectSVG('airbag')

            nextBtn()
          }) //wait('@clickableCar'
        } //'page-02'
      }) //get('@goingPageId'


      // Schadenbilder und Dokumente - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('fictious-billing',0)
          cy.get('input#client-email-input').clear().type('sivanchevski@soft2run.com');
          cy.selectSingleList('company',0)

          //cy.selectSingleList('send-report-per-email-to-client',1)
          cy.selectSingleList('send-report-per-email-to-agent',1)
          cy.selectSingleList('assign-or-archive-claim',0)
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
            cy.get('button[type="submit"]').contains('Schadenaufnahme beenden').click()
            cy.wait('@postPost').then(xhr => {
              const notificationId = cy.postPost(xhr)

            })
          }
        }
      })
    }) //it

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['zurich_default','zurich_pg1_schadenbericht','zurich_pg1_schadenprotokoll'])
    }) //it PDF from commands

    it.skip(`Generate Emails for ${$car[0]}`, function () {
        cy.GenerateEmails(['zurich_pg1_confirmation_2_agent','zurich_pg1_confirmation_2_da_direkt_customer','zurich_pg1_confirmation_2_zurich_customer',
          'zurich_pg1_internal_confirmation'],'zurich_call_center_guide_wire')
    })

    it.only(`zurich_call_center_guide_wire questionnaire, vin ${$car[0]}`, () => {

      const $vin = $car[0]
      const first_registration_date = convertDate($car[2]) //"2024-02-01";
      const intS2 = getRandomInt(10,99).toString()
      const intS6 = getRandomInt(100000,999999).toString()
      const intS3 = getRandomInt(100,999).toString()
      const intS4 = getRandomInt(1000,9999).toString()

      console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)

      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })

        const claimNumber = `${intS3}-${intS2}-${intS6}`
        const licensePlate = `ZRH ${intS4}`
        console.log(`claimNumber: ${claimNumber}`)

        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
        b2bBody.qas.find(q => {return q.questionId === "claimant-vehicle-license-plate"}).answer = licensePlate
        b2bBody.qas.find(q => {return q.questionId === "license-plate"}).answer = licensePlate
        b2bBody.qas.find(q => {return q.questionId === "first-registration-date"}).answer = first_registration_date
        b2bBody.qas.find(q => {return q.questionId === "claim-number"}).answer = claimNumber
        b2bBody.supportInformation.claimNumber = claimNumber
        b2bBody.supportInformation.vin = $vin

        Cypress._.merge(header, {'authorization' : authorization});

        const options = {
          method: 'POST',
          url: `${baseUrl_lp}questionnaire/zurich_call_center_guide_wire/start`,
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
          console.log(`zurich_call_center_guide_wire questionnaireId: ${questionnaireId}`)
          console.log(`zurich_call_center_guide_wire uiUrl: ${uiUrl}`)
          cy.writeFile(b2bBodySave, b2bBody)
          //cy.visit(uiUrl,{ log : false })
        })
      })
    }) //it


  })  //forEach
}) //describe

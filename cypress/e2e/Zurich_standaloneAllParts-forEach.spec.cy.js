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


const logFilename = 'cypress/fixtures/logs/zurichStandalone.log'

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
  const executePost = false
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

  const file1 = [
    ["WDB1704351F077666", "Cabrio", "01.01.2004", "MER SLK Cabrio"]
  ]
  file1.forEach($car => {
    it.only(`zurich standalone questionnaire - zurich_call_center vin ${$car[0]}`, () => {

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
                if ($equipment_2_loading_doors){
                  if (SVGbody.search('g id="right-load-door"') > 0 ){
                  }
                }
                if (!$equipment_2_loading_doors){
                  if (SVGbody.search('g id="tailgate"') > 0 ){
                  }
                }
              }
              if (bodyType == 'MPV' || bodyType == 'Hatch3' || bodyType == 'Hatch5' || bodyType == 'Sedan' ||
                  bodyType == 'Coupe' || bodyType == 'Cabrio' || bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine' ||
                  bodyType == 'SUV')
              {
                const regex = /g .*id="tailgate"/;
                if (SVGbody.search(regex) > 0 ){
                }
              }
            }) //get('@bodyType'



            cy.get('#repair-location-zip-code-input').clear().type('22222')
            cy.get('@goingPageElements').then(function (elements) {
              const areas = elements.find(x => x.id === 'selected-parts').areas
              cy.selectAllSVGs(areas,SVGbody,['underbody'])
            })
            cy.selectAllSingleLists(0)
            cy.selectAllMultipleList(0)
            cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',0)
            //cy.selectAllSingleLists(0)
            //cy.selectAllMultipleList(0)
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

/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: ''  }
const logFilename = 'cypress/fixtures/logs/hukLiabilityCallCenter.log'

describe('Start and complete huk standalone questionnaire - huk_liability_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    console.clear()
    console.clear()
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
    cy.intercept('GET',  `/questionnaire/*/currentPage?offset=*&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*/picture/clickableCar*`,{ log: false }).as('clickableCar')
    cy.intercept('POST', '/questionnaire/*/page/page-*', (req) => {
      if (req.url.includes('navigateTo')) {
        req.alias = "nextPage"
      } else {
        req.alias = "savePage"
      }
    })
    cy.intercept('POST', `/member/oauth/token`).as('token')
    cy.intercept('POST', `/b2b/integration/huk/huk-liability-call-center?identifyVehicleAsync=false`).as('hukLiabilityCC')
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
            title = xhr.response.body.uiBlocks[0].elements.sections[0].label.content
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
    [
      "WDB2083441T069719",
      "Coupe",
      "01.01.2009",
      "MER CLK Coupe (partial identification, build period to be defined manually)"
    ]
  ]

  file1.forEach($car => {
    it(`huk standalone - huk_liability_call_center vin: ${$car[0]}`, () => {

      const $vin = $car[0];

      cy.visit(`https://${$dev}.spearhead-ag.ch/ui/questionnaire/zurich/#/login?theme=huk`,{ log : false })
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
      })
      cy.wait(500)

      const intS1 = getRandomInt(10,99).toString()
      const intS2 = getRandomInt(100,999).toString()
      const intS3 = getRandomInt(100000,999999).toString()

      const $claimTypes = ['10','11','12','13','14','15','16','17','18','19'];
      const claimType_random = getRandomInt(0,$claimTypes.length);
      const $claimType = $claimTypes[claimType_random];

      const first_registration_date = $car[2];;
      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)

      // Fulfill standalone form
      cy.get('[name="claimNumber"]').type(`${intS1}-${$claimType}-${intS2}/${intS3}-S`);
      cy.get('[data-test="standalone_vin"]').type($vin)
      cy.get('[data-test="standalone_licensePlate"]').type(`HLI ${intS2}`)
      cy.get('[class="btn btn-primary btn-submit"]').click()
      cy.wait(1000)

      cy.wait('@hukLiabilityCC').then(xhr => {
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
          cy.selectSingleList('loss-circumstances',0)
          cy.selectSingleList('odometer-reading-source-display',0)
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
            if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
              cy.selectSingleList('vehicleStatus-VS40',1)
            }
            if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
              cy.selectSingleList('vehicleStatus-VS30',3)
              cy.selectSingleList('vehicleStatus-VS31',0) //0- "Eine Ladeklappe"; 1 - "Zwei Ladetüren"
              cy.selectSingleList('vehicleStatus-VS35',0)
              cy.selectSingleList('vehicleStatus-VS36',0)
              cy.selectSingleList('vehicleStatus-VS32',0)
              cy.selectSingleList('vehicleStatus-VS33',0)
            }
          })
          cy.wait(2000)
          nextBtn()
        }
      })


      // Schadenbeschreibung - page-02
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            const SVGbody = xhr.response.body;
            if (SVGbody.search('g id="right-load-door"') > 0){
              //cy.selectSVG('right-load-door')
            }
            if (SVGbody.search('g id="left-load-door"') > 0){
              //cy.selectSVG('left-load-door')
            }
            const regex = /g .*id="tail[gG]ate"/;
            const regex1 = /g .*id="tailgate"/;
            if (SVGbody.search(regex1) > 0 ){
              cy.selectSVG(`tailgate`)
              cy.selectMultipleList('tailgate-damage-type', 0)
              cy.selectMultipleList('tailgate-damage-type', 1)
              cy.selectSingleList('tailgate-damage-size', 2)
              cy.selectSVG(`rear-window`) // rear-window-damage-type_0 preselected
            }
            const regex2 = /g .*id="tailGate"/;
            if (SVGbody.search(regex2) > 0 ){
              cy.selectSVG(`tailGate`)
              cy.selectMultipleList('tailGate-DT2', 0)
              cy.selectMultipleList('tailGate-DT2', 1)
              cy.selectSingleList('tailGate-P9\\>DS2', 2)
              cy.selectSVG(`rearWindow`) // rear-window-damage-type_0 preselected
            }
            if (SVGbody.search('g id="hood"') > 0){
              cy.selectSVG('hood')
              cy.selectMultipleList('hood-DT2',0)
            }

            cy.selectSingleList('vehicle-safe-to-drive',0)
            cy.selectSingleList('vehicle-ready-to-drive',0)
            cy.selectSingleList('unrepaired-pre-damages',1)
            cy.selectSingleList('vehicle-damage-repaired',0)

            if (SVGbody.search('g id="rightFrontWheelRim"') > 0){
              cy.selectSVG('rightFrontWheelRim')
              cy.wait(2000)
              cy.selectSingleList('rightFrontWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('rightFrontWheelRim-DT2',1)
            }

            if (SVGbody.search('g id="rightRearWheelRim"') > 0){
              cy.selectSVG('rightRearWheelRim')
              cy.selectSingleList('rightRearWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('rightRearWheelRim-DT2',0)
              cy.selectMultipleList('rightRearWheelRim-DT2',1)
            }
            if (SVGbody.search('g id="rightFrontTire"') > 0){
              cy.selectSVG('rightFrontTire')
            }
            if (SVGbody.search('g id="rightRearTire"') > 0){
              cy.selectSVG('rightRearTire')
            }
            if (SVGbody.search('g id="leftFrontWheelRim"') > 0){
              cy.selectSVG('leftFrontWheelRim')
              cy.selectSingleList('leftFrontWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('leftFrontWheelRim-DT2',1)
            }
            if (SVGbody.search('g id="leftRearWheelRim"') > 0){
              cy.selectSVG('leftRearWheelRim')
              cy.selectSingleList('leftRearWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('leftRearWheelRim-DT2',0)
              cy.selectMultipleList('leftRearWheelRim-DT2',1)
            }
            if (SVGbody.search('g id="leftFrontTire"') > 0){
              cy.selectSVG('leftFrontTire')
            }
            if (SVGbody.search('g id="leftRearTire"') > 0){
              cy.selectSVG('leftRearTire')
            }

            cy.get('textarea#unrepaired-pre-damages-description-textarea').clear().type('Bitte beschreiben Sie die unreparierten Vorschäden')
            cy.get('#repair-location-zip-code-input').clear().type('22222')

            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                cy.selectSingleList('vehicleStatus-VS34',1)
              }
            })
            nextBtn()
          })
        }
      })


      // Schadenbilder und Dokumente - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('photos-available',1)
          cy.selectSingleList('photos-not-available-because',0)
          nextBtn()
        }
      })

      //cy.then(() => this.skip())    // stop here

      // Regulierungs- und Handlungsempfehlung - page-04
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          nextBtn()
        }
      })

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
  })
})

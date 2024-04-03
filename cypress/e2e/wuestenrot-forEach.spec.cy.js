/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/hukClickableCar.log'
const pdfPath = 'cypress/fixtures/Pdf/'

describe('Start and complete wuestenrot standalone questionnaire', () => {

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {
    //cy.loginToHukStandalone()
    console.clear()
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
    cy.intercept('GET',  `/questionnaire/*/currentPage?offset=*&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*//picture/clickableCar*`).as('clickableCar')
    cy.intercept('POST', '/questionnaire/*/page/page-*', (req) => {
      if (req.url.includes('navigateTo')) {
        req.alias = "nextPage"
      } else {
        req.alias = "savePage"
      }
    })
    cy.intercept('POST', `/member/oauth/token`).as('token')
    cy.wrap(goingPage).its('pageId').as('goingPageId')
    cy.wrap(goingPage).its('elements').as('goingPageElements')
    cy.wrap(questionnaire).its('Id').as('questionnaireId')
    cy.wrap(questionnaire).its('authorization').as('authorization')
    cy.wrap(questionnaire).its('bodyType').as('bodyType')

    cy.intercept('POST', `/b2b/integration/wuestenrot/wuestenrot-comprehensive-call-center?identifyVehicleAsync=false`).as('postStart')
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
    it(`wuestenrot-comprehensive-call-center for vin: ${$car[0]}`, () => {

      const $vin = $car[0]

      cy.visit(`${baseUrl_lp}ui/questionnaire/zurich/#/login?theme=wuestenrot`)
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



      const intS1 = getRandomInt(1000, 9999).toString()
      const intS2 = getRandomInt(1000, 9999).toString()
      const intS3 = getRandomInt(100, 999).toString()
      const intS4 = getRandomInt(0, 9).toString()
      const $equipment_2_loading_doors = true
      const claimNumber = `${intS1}.${intS2}/${intS3}-${intS4}`
      console.log(`claimNumber: ${claimNumber}`)
      const licenseplate = `WUE ${getRandomInt(1,9)}-${getRandomInt(100,999)}`
      console.log(`vin: ${$vin}`);

      cy.get('[name="claimNumber"]').type(claimNumber)
      cy.get('[data-test="standalone_vin"]').type($vin)
      cy.get('[data-test="standalone_firstRegistrationDate__input"]').type('10.05.2013')
      cy.get('[data-test="standalone_licensePlate"]').type(licenseplate)
      cy.get('[data-test="standalone_zipCode"]').type('2222')
      cy.get('[class="btn btn-primary btn-submit"]').click()
      cy.wait(500)

      cy.wait('@postStart').then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        console.log(`questionnaireId: ${xhr.response.body.questionnaireId}`)
        cy.then(function () {
          questionnaire.Id = xhr.response.body.questionnaireId
        })
        console.log(`uiUrl: ${xhr.response.body.uiUrl}`)
      })
      cy.wait(1000)


      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){  // Fahrzeugbeschreibung und Schadenhergang
          cy.get('#accident-date-input').type('01.11.2023')
          cy.get('#vehicle-mileage-input').clear().type('123456')
          //cy.selectSingleList('loss-cause',0) // already selected
          cy.selectSingleList('loss-circumstances-details',8)
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
              cy.selectSingleList('equipment-loading-area-cover-type',1)
            }
          })
          nextBtn()
          cy.wait(1000)
        }
      })


      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){  // Schadenbeschreibung
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            const SVGbody = xhr.response.body;

            cy.selectSVG('hood')
            cy.selectMultipleList('hood-damage-type',0)

            cy.selectSVG('roof')
            cy.selectMultipleList('roof-damage-type',0)
            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'Cabrio'){
                cy.selectSingleList('roof-equipment-convertible-roof-material',0)
              }
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                cy.selectSingleList('loading-floor-area-bend',0)
              }
            })
            cy.selectSingleList('vehicle-safe-to-drive',0)
            cy.selectSingleList('vehicle-ready-to-drive',0)
            cy.selectSingleList('unrepaired-pre-damages',0)
            cy.selectSingleList('vehicle-damage-repaired',0)
            nextBtn()
          })  //wait('@clickableCar'
        }  // if
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          cy.selectSingleList('photos-available',1)
          cy.selectSingleList('photos-not-available-because',21)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, questionnaireId: ${Id}`);
          })
          if (executePost) {
            //pageId: "summary-page"
            cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    })  //it
  })  //forEach
})

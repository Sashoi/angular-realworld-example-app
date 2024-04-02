/// <reference types="cypress" />

const { resolveProjectReferencePath } = require("typescript")
import { getRandomInt } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: ''  }
const logFilename = 'cypress/fixtures/zurichStandalone.log'

describe('Start and complete zurich standalone questionnaire - urichz_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
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
    cy.intercept('POST', `/b2b/integration/zurich/zurichStandalone`).as('zurichStandalone')
    cy.wrap(goingPage).its('pageId').as('goingPageId')
    cy.wrap(goingPage).its('elements').as('goingPageElements')
    cy.wrap(questionnaire).its('Id').as('questionnaireId')
    cy.wrap(questionnaire).its('authorization').as('authorization')
    cy.wrap(questionnaire).its('bodyType').as('bodyType')
  }) //beforeEach

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const interceptZurichStandalone = true

  function printUiBlocks(uiBlocks){
    uiBlocks.forEach((uiBlock, index1) => {
      uiBlock.elements.sections.forEach((section, index2) => {
        console.log(`section [${index1}][${index2}]: ${section.label.content}.`)
      })
    })
  }


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
  function getBodyType($car) {
    cy.get('@authorization').then(function (token) {
      cy.get('@questionnaireId').then(function (questionnaireId) {
        const options = {
          method: 'GET',
          url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
          headers:  {
            'Accept': '*/*',
            'Accept-Encoding':'gzip, deflate, br',
            'Content-Type': 'application/json',
            token,
            'timeout' : 50000
          }
        };
        cy.request(options).then(
          (response) => {
          expect(response.status).to.eq(200) // true
          const bodyType = response.body.supportInformation.bodyType
          console.log(`supportInformation.bodyType : ${bodyType}.`)
          cy.then(function () {
            questionnaire.bodyType = bodyType
          })
          cy.readFile(logFilename).then((text) => {
            const addRow = `vin: ${$car[0]} expected: ${$car[1].padStart(18, ' ')} real: ${bodyType.padStart(18, ' ')} desc: ${$car[3]} \n`
            text += addRow
            cy.writeFile(logFilename, text)
          })
        }) //request(options)
      }) //get('@questionnaireId'
    }) //get('@authorization'
  }


  const file1 = [
    ["6FPGXXMJ2GEL59891","PickUpSingleCabine",  "01.01.2012","Ford Ranger single cabine, Pick-up"]
  ]
  file.forEach($car => {
    it(`zurich standalone questionnaire - zurich_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]

      cy.visit(`https://${$dev}.spearhead-ag.ch/ui/questionnaire/zurich/#/login?theme=zurich`)
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

      const intS1 = getRandomInt(10,99).toString()
      const intS2 = getRandomInt(1000000,9999999).toString()
      const intS3 = getRandomInt(1000,9999).toString()
      const $equipment_2_loading_doors = true


      const first_registration_date = "2024-02-01";
      const f_first_registration_date = '01.02.2024';
      console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)
      console.log(`first_registration_date: ${first_registration_date}`)
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      const claimNumber = `${intS1}-${intS2}`
      const licensePlate = `ZUR ${intS3}`

      const b2bBody = {
        "qas": [

            {
                "questionId": "odometer-unit",
                "answer": [
                    "km"
                ]
            },
            {
                "questionId": "standalone",
                "answer": [
                    "yes"
                ]
            },
            {
                "questionId": "loss-cause",
                "answer": "other"
            },
            {
                "questionId": "coverage-type",
                "answer": "liability"
            },
            {
                "questionId": "license-plate",
                "answer": licensePlate
            },
            {
                "questionId": "client-vehicle-license-plate",
                "answer": licensePlate
            },
            {
                "questionId": "claimant-vehicle-license-plate",
                "answer": licensePlate
            },
            {
                "questionId": "first-registration-date",
                "answer": first_registration_date
            },
            {
                "questionId": "odometer-reading",
                "answer": 123498
            },
            {
                "questionId": "company",
                "answer": "zurich"
            },
            {
                "questionId": "process-type",
                "answer": "zurichStandalone"
            },
            {
                "questionId": "claim-number",
                "answer": claimNumber
            },
            {
              "questionId": "roof-damage-type",
              "answer": ["scratches"]
            },
            {
              "questionId": "roof-equipment-convertible-roof-material",
              "answer": ["metal"]
            },
            {
              "questionId": "selected-parts",
              "answer": {
                "roof": "yes"
              }
            }
      ],
        "supportInformation": {
            "claimNumber": claimNumber,
            "countryVehicleIdentification": "",
            "vin": $vin
        }
      }

      // Fulfill standalone form
      cy.get('ng-select[data-test="standalone_company"]').find('input').type('D',{force: true})
      cy.get('input[name="claimNumber"]').type(claimNumber);
      cy.get('ng-select[data-test="standalone_claimType"]').find('input').type('T',{force: true})
      cy.get('input[data-test="standalone_vin"]').type($vin)
      cy.get('input[formcontrolname="firstRegistrationDate"]').type(f_first_registration_date)
      cy.get('input[formcontrolname="mileage"]').type('123.456')
      //cy.get('input[formcontrolname="licensePlate"]')
      cy.get('[data-test="standalone_licensePlate"]').type(licensePlate)
      if (interceptZurichStandalone){
       // with this intercept I'm replacing the body of standalone
       // adding 'roof' as selected SVG
        cy.intercept('POST', `/b2b/integration/zurich/zurichStandalone`, (req) => {
          req.body = b2bBody
        })
      }
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
          if ($vin == 'WDB2083441T069719'){
            cy.selectDropDown('select_buildPeriod',1)
            cy.wait(2000)
          }
          getBodyType($car)
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

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
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
                    cy.selectSVG(`left-rear-door-window`)
                    cy.selectSVG(`right-rear-door-window`)
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
            cy.selectSingleList('damage-description-completed',0)
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
            nextBtn()
          }) //wait('@clickableCar'
        } //'page-02'
      }) //get('@goingPageId'


      // Schadenbilder und Dokumente - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('send-report-per-email-to-client',1)
          cy.selectSingleList('send-report-per-email-to-agent',1)
          cy.selectSingleList('assign-or-archive-claim',1)
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
              //cy.postPost(xhr)
            })
          }
        }
      })
    }) //it
  })  //forEach
}) //describe

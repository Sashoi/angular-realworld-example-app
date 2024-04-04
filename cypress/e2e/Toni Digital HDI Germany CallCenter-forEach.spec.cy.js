/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { makeid } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: ''  }
const logFilename = 'cypress/fixtures/hdiLiabilityCC.log'


describe('Execute b2b/integration/toni-digital/hdiLiabilityCallCenter', () =>{

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
        if (false && waitFor == '@currentPage'){
          const nextUrl = xhr.response.body.links.next
          //"https://dev02.spearhead-ag.ch:443/questionnaire/7uRjDM92M9eWEhZVkBrSr/page/page-01?navigateTo=next"
          const startStr = '/questionnaire/'
          const endStr = '/page/page'
          const pos = nextUrl.indexOf(startStr) + startStr.length;
          const questionnaireId =  nextUrl.substring(pos, nextUrl.indexOf(endStr, pos));
          cy.then(function () {
            questionnaire.Id = questionnaireId
          })
          console.log(`questionnaireId: ${questionnaireId}`)
        }
    })
  }

  function nextBtn() {
    _waitFor('@nextPage')
  }

  function currentPage() {
    _waitFor('@currentPage')
  }

  function fulfilCompoundQuestion(question,instance,lastInstance) {
    cy.get(`div#${question}`).find(`input#${question}-first-name__--__${instance}-input`).type(`first name ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-last-name__--__${instance}-input`).type(`last name ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-street-name__--__${instance}-input`).type(`street name ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-street-number__--__${instance}-input`).type(`${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-zip-code__--__${instance}-input`).type(`1011${instance + 6}`)
    cy.get(`div#${question}`).find(`input#${question}-city__--__${instance}-input`).type(`Sofia ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-phone-number__--__${instance}-input`).type(`08880${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-email__--__${instance}-input`).type(`sivanchevski@soft2run.com`)
    cy.get(`div#${question}`).find(`input#${question}-objects-description__--__${instance}-input`).type(`objects-description ${instance + 1}`)
    if (!lastInstance) {
      cy.get(`div#${question}`).find(`input#${question}-email__--__${instance}-input`).focus()
    cy.get(`div#${question}`).find('button[type="button"]').click({ force: true })
    }
  }

  const file1 = [
    ["W1V44760313930767", "Van", "01.01.2017", "Mercedes Vito 09/2021"],
    ["WF03XXTTG3MG53806", "Minibus", "01.01.2017", "Ford Tourneo 08/2021"],
    ["WF0KXXTTRKMC81361", "VanMidPanel", "01.01.2020", "Ford Transit 06/2021"]
  ]

  file1.forEach($car => {
    it(`Execute b2b/integration/toni-digital/hdiLiabilityCallCenter with vin:${$car[0]}`, () =>{

      const vin = $car[0]

      const userCredentials =  {
        "password": Cypress.env("passwordHukS"),
        "remoteUser": "",
        "sessionLanguage": "en",
        "userName": Cypress.env("usernameHukS")
      }

      let claim1 = makeid(7)
      let claim2 = getRandomInt(10000,99999)

      let claimNumber = claim1 + claim2
      let licenseplate = `HDI ${getRandomInt(1,9)}-${getRandomInt(100,999)}`

      const photos_available = false;
      const selectAllParts = false;
      const $equipment_2_loading_doors = true

      console.log(`vin: ${vin}`);

      cy.request('POST',`${baseUrl_lp}/member/authenticate`,userCredentials)
          .its('body').then(body => {
            const token = body.accessToken
            const authorization = `Bearer ${ token }`;
            cy.then(function () {
              questionnaire.authorization = authorization
            })

          const b2bBody = {
              "qas": [
                  {
                      "questionId": "questionnaire-locale",
                      "answer": [
                          "en"
                      ]
                  },
                  {
                      "questionId": "insurance-type",
                      "answer": [
                          "motorcycle"
                      ]
                  },
                  {
                      "questionId": "workflow-type",
                      "answer": [
                          "call-center"
                      ]
                  },
                  {
                      "questionId": "coverage-type",
                      "answer": [
                          "liability"
                      ]
                  },
                  {
                      "questionId": "coverage-type-info",
                      "answer": [
                          "collision"
                      ]
                  },
                  {
                      "questionId": "eMail-insurance-client",
                      "answer": [
                          "sivanchevski@soft2run.com"
                      ]
                  },
                  {
                      "questionId": "firstName-insurance-client",
                      "answer": [
                          "Moritz"
                      ]
                  },
                  {
                      "questionId": "lastName-insurance-client",
                      "answer": [
                          "Chapuisat"
                      ]
                  },
                  {
                      "questionId": "mobilePhoneNumber-insurance-client",
                      "answer": [
                          "0791234567"
                      ]
                  },
                  {
                      "questionId": "zipCode-insurance-client",
                      "answer": [
                          "1202"
                      ]
                  },
                  {
                      "questionId": "loss-cause",
                      "answer": "collision"
                  },
                  {
                      "questionId": "number-of-vehicles",
                      "answer": "two"
                  },
                  {
                      "questionId": "incident-reporter-country",
                      "answer": "DE"
                  },
                  {
                      "questionId": "vehicle-first-registration-date",
                      "answer": "2024-02-01"
                  },
                  {
                      "questionId": "vehicle-mileage",
                      "answer": {
                          "unit": "km",
                          "value": 23525,
                          "fileUploaded": "false"
                      }
                  },
                  {
                      "questionId": "incident-reporter-type",
                      "answer": "private-person"
                  },
                  {
                      "questionId": "collision-type-others-description",
                      "answer": "3534"
                  },
                  {
                      "questionId": "loss-circumstances-details-claimant",
                      "answer": "collision-parking-leaving"
                  },
                  {
                      "questionId": "loss-circumstances-details-counterparty",
                      "answer": "collision-private-incoming"
                  },
                  {
                      "questionId": "client-vehicle-license-plate",
                      "answer": licenseplate
                  },
                  {
                      "questionId": "incident-reporter-first-name",
                      "answer": "Jhon"
                  },
                  {
                      "questionId": "incident-reporter-last-name",
                      "answer": "Smith"
                  },
                  {
                      "questionId": "incident-reporter-phone-number",
                      "answer": "555555"
                  },
                  {
                      "questionId": "incident-reporter-street-name",
                      "answer": "Street name"
                  },
                  {
                      "questionId": "incident-reporter-street-number",
                      "answer": "333"
                  },
                  {
                      "questionId": "incident-reporter-zip-code",
                      "answer": "10115"
                  },
                  {
                      "questionId": "incident-reporter-place",
                      "answer": "Sofia"
                  },
                  {
                      "questionId": "incident-reporter-email",
                      "answer": "sivanchevski@soft2run.com"
                  }
              ],
              "supportInformation": {
                  "vin": vin,
                  "claimNumber": claimNumber,
                  "workflowType": "hdiLiabilityCallCenter"
              }
          }


          const options = {
            method: 'POST',
            url: `${baseUrl_lp}b2b/integration/toni-digital/hdiLiabilityCallCenter`,
            body: b2bBody,
            headers: {
              'Accept': '*/*',
              'Accept-Encoding':'gzip, deflate, br',
              'Content-Type': 'application/json',
              authorization,
          }};

          cy.request(options).then(
            (response) => {
              // response.body is automatically serialized into JSON
              expect(response.status).to.eq(200) // true

              const questionnaireId = response.body.questionnaireId;
              cy.then(function () {
                questionnaire.Id = questionnaireId
              })
              console.log(`questionnaireId: ${questionnaireId}`)
              const uiUrl = response.body.uiUrl;
              console.log(`uiUrl: ${uiUrl}`);

              cy.visit(uiUrl)
              //cy.get('.loader').should('not.exist')


              const nextButtonLabel ='Weiter'
              const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
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
                      cy.selectSingleList('equipment-length',2)
                      cy.selectSingleList('equipment-height',2)
                      cy.selectSingleList('equipment-vehicle-rear-glassed',1)
                      cy.selectSingleList('vehicle-customized-interior',0)
                    }
                    if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
                      cy.wait(2000)
                      cy.selectSingleList('equipment-loading-area-cover-type',1)
                    }
                  })
                  cy.selectDropDown('select_buildPeriod',1)
                  cy.wait(1000)
                  nextBtn()
                }
              })

              //pageId: "page-02"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-02'){
                  cy.get('input#incident-place-street-name-input').type('Street name')
                  cy.get('input#incident-place-street-number-input').type('123')
                  cy.get('input#incident-place-zip-code-input').type('10115')
                  cy.get('input#incident-place-city-input').type('Berlin')

                  cy.selectSingleList('accident-responsible',0)
                  cy.selectSingleList('vehicle-driver',0)
                  cy.selectSingleList('alcohol-drugs-overfatigue-while-driving',1)
                  cy.selectSingleList('excessive-speed-while-driving',1)
                  cy.selectSingleList('police-informed',1)
                  cy.selectSingleList('accident-protocol',0)

                  cy.selectMultipleList('damaged-objects',3)
                  cy.selectSingleList('accident-opponent-damaged-objects-owner-known',0)
                  const compoundQuestion = 'accident-opponent-damaged-objects-owner'
                  fulfilCompoundQuestion(compoundQuestion,0,false)
                  fulfilCompoundQuestion(compoundQuestion,1,false)
                  fulfilCompoundQuestion(compoundQuestion,2,true)
                  nextBtn()
                }
              })

              //pageId: "page-03"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-03'){
                  cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {

                    expect(xhr.response.statusCode).to.equal(200)
                    console.log(`Comming SVG with clickableCar`)
                    const SVGbody = xhr.response.body;

                    cy.selectSingleList('vehicle-damage-repaired', 0)
                    cy.get('input#repair-location-zip-code-input').type('10115')

                    cy.selectSVG(`exhaust`)

                    //towing-hook if check does not calc iBox
                    if (false && SVGbody.search('g id="towing-hook"') > 0 ){
                      cy.selectSVG(`towing-hook`)
                      cy.selectSingleList('towing-hook-equipment-towhook-type', 0)
                      cy.selectMultipleList('towing-hook-damage-type', 0)
                    }

                    //underbody  if check does not calc iBox
                    //cy.selectSVG(`underbody`)

                    cy.selectSVG(`airbag`)

                    if (SVGbody.search('g id="right-taillight"') > 0 ){
                      cy.selectSVG(`right-taillight`)
                      cy.selectSingleList('right-taillight-equipment-led-rear-lights', 0)
                    }

                    if (SVGbody.search('g id="left-taillight"') > 0 ){
                      cy.selectSVG(`left-taillight`)
                      cy.selectSingleList('left-taillight-equipment-led-rear-lights', 0)
                    }

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
                    })

                    if (selectAllParts){

                      //right-mirror
                      cy.selectSVG(`right-mirror`)
                      cy.selectSingleList('right-mirror-equipment-intelligent-mirrors', 0)
                      cy.selectSingleList('right-mirror-still-working', 0)
                      cy.selectMultipleList('right-mirror-damage-type', 0)
                      cy.selectMultipleList('right-mirror-damage-type', 1)
                      cy.selectMultipleList('right-mirror-damage-type', 2)
                      cy.selectMultipleList('right-mirror-damage-type', 3)


                      //left-mirror
                      cy.selectSVG(`left-mirror`)
                      cy.selectSingleList('left-mirror-equipment-intelligent-mirrors', 0)
                      cy.selectSingleList('left-mirror-still-working', 0)
                      cy.selectMultipleList('left-mirror-damage-type', 0)
                      cy.selectMultipleList('left-mirror-damage-type', 1)
                      cy.selectMultipleList('left-mirror-damage-type', 2)
                      cy.selectMultipleList('left-mirror-damage-type', 3)


                      //right-front-wheel
                      cy.selectSVG(`right-front-wheel`)
                      cy.selectSingleList('right-front-wheel-equipment-rims-type',0)
                      cy.selectMultipleList('right-front-wheel-damage-type',1)

                      //right-rear-wheel
                      cy.selectSVG(`right-rear-wheel`)
                      cy.selectSingleList('right-rear-wheel-equipment-rims-type',0)
                      cy.selectMultipleList('right-rear-wheel-damage-type',1)

                      //right-front-wheel-tire
                      cy.selectSVG(`right-front-wheel-tire`)

                      //right-rear-wheel-tire
                      cy.selectSVG(`right-rear-wheel-tire`)

                      //left-front-wheel
                      cy.selectSVG(`left-front-wheel`)
                      cy.selectSingleList('left-front-wheel-equipment-rims-type',0)
                      cy.selectMultipleList('left-front-wheel-damage-type',1)

                      //left-front-wheel-tire
                      cy.selectSVG(`left-front-wheel-tire`)

                      //left-rear-wheel
                      cy.selectSVG(`left-rear-wheel`)
                      cy.selectSingleList('left-rear-wheel-equipment-rims-type',0)
                      cy.selectMultipleList('left-rear-wheel-damage-type',1)

                      //left-rear-wheel-tire
                      cy.selectSVG(`left-rear-wheel-tire`)

                      //right-headlight
                      cy.selectSVG(`right-headlight`)
                      cy.selectSingleList('right-headlight-equipment-enhanced-headlight-system',0)
                      cy.selectSingleList('right-headlight-loose-shifted-by-hand',0)
                      //checked by default
                      //cy.selectMultipleList('right-headlight-damage-type', 2)


                      //left-headlight
                      cy.selectSVG(`left-headlight`)
                      cy.selectSingleList('left-headlight-equipment-enhanced-headlight-system',0)
                      cy.selectSingleList('left-headlight-loose-shifted-by-hand',0)
                      //checked by default
                      //cy.selectMultipleList('left-headlight-damage-type', 2)


                      //hood
                      cy.selectSVG(`hood`)
                      cy.selectMultipleList('hood-damage-type',1)
                      cy.selectSingleList('hood-damage-size',2)

                      //grill
                      cy.selectSVG(`grill`)
                      cy.selectMultipleList('grill-damage-type',1)

                      //right-front-additional-light
                      cy.selectSVG(`right-front-additional-light`)

                      //left-front-additional-light
                      cy.selectSVG(`left-front-additional-light`)


                      //left-front-fender
                      cy.selectSVG(`left-front-fender`)
                      cy.selectMultipleList('left-front-fender-damage-type', 2)
                      cy.selectSingleList('left-front-fender-damage-size', 2)

                      //right-front-fender
                      cy.selectSVG(`right-front-fender`)
                      cy.selectMultipleList('right-front-fender-damage-type', 2)
                      cy.selectSingleList('right-front-fender-damage-size', 2)

                      //front-bumper
                      cy.selectSVG(`front-bumper`)
                      cy.selectSingleList('front-bumper-equipment-parking-aid-front', 0)

                      cy.get('@bodyType').then(function (bodyType) {
                        if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                          cy.selectSingleList('loading-floor-area-bend', 0)
                        }
                      })

                      cy.selectSingleList('front-bumper-equipment-fog-lights',0)
                      cy.selectMultipleList('front-bumper-damage-type',2)
                      cy.selectSingleList('front-bumper-damage-size',2)

                      //windshield
                      cy.selectSVG(`windshield`)
                      cy.selectSingleList('windshield-equipment-windshield-electric',0)

                      cy.selectMultipleList('windshield-damage-type',2)
                      cy.selectSingleList('windshield-damage-size-crack-bigger-2cm',0)
                      if (vin != "6FPPXXMJ2PCD55635"){
                          cy.get('g#zone-d[data-name="2d_hb_windshield_d"]').click({ force: true }) // .first() if multiple appear
                      }
                      if (vin == "6FPPXXMJ2PCD55635"){
                        cy.get('g#zone-d[data-name="4d_pickup_windshield_d"]').click({ force: true })
                      }


                      //roof
                      cy.selectSVG(`roof`)
                      cy.selectMultipleList('roof-damage-type',0)

                      //left-front-door
                      cy.selectSVG(`left-front-door`)
                      cy.selectSingleList('left-front-door-still-open-close-easily', 1)
                      cy.selectSingleList('left-front-door-still-working', 1)
                      cy.selectMultipleList('left-front-door-damage-type', 1)
                      cy.selectSingleList('left-front-door-damage-size', 2)

                      //left-front-door_window_and_handle
                      cy.selectSVG(`left-front-door-window`)

                      //right-front-door
                      cy.selectSVG(`right-front-door`)
                      cy.selectSingleList('right-front-door-still-open-close-easily', 1)
                      cy.selectSingleList('right-front-door-still-working', 1)
                      cy.selectMultipleList('right-front-door-damage-type', 1)
                      cy.selectSingleList('right-front-door-damage-size', 2)

                      //right-front-door_window_and_handle
                      cy.selectSVG(`right-front-door-window`)

                      //left-rear-door
                      if (vin == "WVWZZZ6RZGY304402" || vin == "WAUZZZ4B73N015435" || vin == "WF0KXXTTRKMC81361"){
                        cy.selectSVG(`left-rear-door`)
                        cy.selectSingleList('left-rear-door-still-working', 1)
                        cy.selectMultipleList('left-rear-door-damage-type', 1)
                        cy.selectSingleList('left-rear-door-damage-size', 2)
                      }

                      //left-rear-door-window
                      cy.selectSVG(`left-rear-door-window`)


                      //right-rear-door

                      cy.selectSVG(`right-rear-door`)
                      cy.selectSingleList('right-rear-door-still-open-close-easily', 1)
                      cy.selectSingleList('right-rear-door-still-working', 1)
                      cy.selectMultipleList('right-rear-door-damage-type', 1)
                      cy.selectSingleList('right-rear-door-damage-size', 2)

                      //right-rear-door-window
                      if (vin != "VF3VEAHXKLZ080921" && vin != "WF0KXXTTRKMC81361"){
                        cy.selectSVG(`right-rear-door-window`)
                      }

                      //left-sill
                      cy.selectSVG(`left-sill`)
                      cy.selectMultipleList('left-sill-damage-type', 1)
                      cy.selectSingleList('left-sill-damage-size', 3)

                      //right-sill
                      cy.selectSVG(`right-sill`)
                      cy.selectMultipleList('right-sill-damage-type', 1)
                      cy.selectSingleList('right-sill-damage-size', 3)

                      //tailgate and rear-window
                      if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666" || vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845" || vin == "6FPPXXMJ2PCD55635"){
                        cy.selectSVG(`rear-window`)
                        cy.selectSVG(`tailgate`)
                        cy.selectSingleList('tailgate-still-open-close-easily', 1)
                        cy.selectMultipleList('tailgate-damage-type', 1)
                        cy.selectSingleList('tailgate-damage-size', 2)
                      }


                      //rear-bumper
                      cy.selectSVG(`rear-bumper`)
                      cy.selectSingleList('rear-bumper-equipment-parking-aid-rear', 1)
                      cy.selectMultipleList('rear-bumper-damage-type', 1)
                      cy.selectSingleList('rear-bumper-damage-size', 2)

                      //left-rear-side-panel
                      cy.selectSVG(`left-rear-side-panel`)
                      cy.selectMultipleList('left-rear-side-panel-damage-type', 1)
                      cy.selectSingleList('left-rear-side-panel-damage-size', 3)


                      //right-rear-side-panel
                      cy.selectSVG(`right-rear-side-panel`)
                      cy.selectMultipleList('right-rear-side-panel-damage-type', 1)
                      cy.selectSingleList('right-rear-side-panel-damage-size', 3)

                      //left-rear-door
                      if (vin == "VF3VEAHXKLZ080921" || vin == "6FPPXXMJ2PCD55635"){
                        cy.selectSVG(`left-rear-door`)
                        cy.selectSingleList('left-rear-door-still-open-close-easily', 1)
                        cy.selectSingleList('left-rear-door-still-working', 1)
                        cy.selectMultipleList('left-rear-door-damage-type', 1)
                        cy.selectSingleList('left-rear-door-damage-size', 2)
                      }

                      //right-middle-side-panel
                      if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361"){
                        cy.selectSVG(`right-middle-side-panel`)
                        cy.selectMultipleList('right-middle-side-panel-damage-type', 1)
                        cy.selectSingleList('right-middle-side-panel-damage-size', 3)
                      }
                    }
                  })
                  nextBtn()
                }
              })

              //pageId: "page-04"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-04'){
                  cy.get('div#triage-recommendation').find('label[for="triage-recommendation_3"]').should('be.visible');
                  cy.selectSingleList('triage-recommendation', 3)
                  nextBtn()
                }
              })

              //pageId: "page-05"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-05'){
                  if (photos_available){
                    cy.selectSingleList('photos-available', 0)
                    cy.selectSingleList('receive-upload-link-by', 0)
                    cy.get('input#claimant-email-for-upload-link-input').type('sivanchevski@soft2run.com')
                  } else {
                    cy.selectSingleList('photos-available', 1)
                      const reason = getRandomInt(0,4)
                      cy.selectSingleList('photos-not-available-because',reason)
                  }
                  nextBtn()
                }
              })

              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'summary-page'){
                  cy.get('@questionnaireId').then(function (Id) {
                    console.log(`from summary-page, saved questionnaireId: ${Id}`);
                  })
                  if (executePost) {
                    cy.get('button[type="submit"]').contains('Senden').click()
                    cy.wait('@postPost').then(xhr => {
                      cy.postPost(xhr,false)
                    })
                  }
                }
              })
        })
      })
    }) //it hdiLiabilityCallCenter

    it(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['toni_hdi_tele_check','toni_tele_check','toni_tele_expert'])
    }) //it PDF from commands
  }) //forEach
})

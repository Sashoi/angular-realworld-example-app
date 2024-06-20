/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { makeid } from "../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBodyToni_2.json'

import header from '../fixtures/header.json'

const logFilename = 'cypress/fixtures/logs/hdiLiabilityCC.log'
const b2bBodySave = 'cypress/fixtures/templates/b2bBodyToni_2_Save.json'


describe('Execute b2b/integration/toni-digital/hdiLiabilityCallCenter', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
    cy.wrap(Cypress.automation('remote:debugger:protocol', {
      command: 'Network.clearBrowserCache',
    }))
  })

  beforeEach('Setting up intercepts and common variables', () =>{
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60001;
  const executePost = false
  const role_type = 'client' //or claimant or client
  const selected_parts_count_gte4 = false

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  function fulfilCompoundQuestion(question,instance,lastInstance) {
    cy.get(`div#${question}`).find(`input#${question}-first-name__--__${instance}-input`).type(`first name ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-last-name__--__${instance}-input`).type(`last name ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-street-name__--__${instance}-input`).type(`street name ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-street-number__--__${instance}-input`).type(`${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-zip-code__--__${instance}-input`).type(`1011${instance + 6}`)

    cy.get(`div#${question}`).find(`input#${question}-street-number__--__${instance}-input`).focus()
    cy.wait(300)
    cy.get(`div#${question}`).find(`input[data-test="dropdown-selection-enabled-text-input_${question}-city__--__${instance}"]`).focus()
    //cy.get(`div#${question}`).find(`input#${question}-city__--__${instance}-input`).type(`Sofia ${instance + 1}`)
    cy.get(`div#${question}`).find(`input[data-test="dropdown-selection-enabled-text-input_${question}-city__--__${instance}"]`).type(`Sofia ${instance + 1}`)


    cy.get(`div#${question}`).find(`input#${question}-phone-number__--__${instance}-input`).type(`08880${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-email__--__${instance}-input`).type(Cypress.env("client_email"))
    cy.get(`div#${question}`).find(`input#${question}-objects-description__--__${instance}-input`).type(`objects-description ${instance + 1}`)
    if (!lastInstance) {
      cy.get(`div#${question}`).find(`input#${question}-email__--__${instance}-input`).focus()
    cy.get(`div#${question}`).find('button[type="button"]').click({ force: true })
    }
  }

  const answer = (qId) => {
    return goingPage.elements.find(x => x.id === qId).answer
  }

  const arrayIncludes = (qId,value) => {
    return answer(qId).includes(value)
  }

  const setAnswer = (qId,answer) => {
    goingPage.elements.find(x => x.id === qId).answer = answer
  }

  const visible = (qId) => {
    return eval(goingPage.elements.find(x => x.id === qId).visibleExpression)
  }

  const enable = (qId) => {
    return eval(goingPage.elements.find(x => x.id === qId).enableExpression)
  }

  const file1 = [
    ["WAUZZZ4B73N015435", "Sedan", "01.01.2014", "AUD A6/S6/RS6 Sedan "]
  ]

  file1.forEach($car => {
    it.only(`Execute b2b/integration/toni-digital/hdiLiabilityCallCenter with vin:${$car[0]}`, () =>{

      const vin = $car[0]

      let claim1 = makeid(7)
      let claim2 = getRandomInt(10000,99999)

      let claimNumber = claim1 + claim2
      let licenseplate = `HDI ${getRandomInt(1,9)}-${getRandomInt(100,999)}`

      const photos_available = false;
      const selectAllParts = false;
      const $equipment_2_loading_doors = true

      console.log(`vin: ${vin}`);

      cy.authenticate().then(function (authorization) {

        cy.then(function () {
          questionnaire.authorization = authorization
        })

        b2bBody.supportInformation.claimNumber = claimNumber
        b2bBody.supportInformation.vin =  vin
        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licenseplate
        b2bBody.qas.find(q => {return q.questionId === "role-type"}).answer = role_type


        Cypress._.merge(header, {'authorization' : authorization});

        const options = {
          method: 'POST',
          url: `${baseUrl_lp}b2b/integration/toni-digital/hdiLiabilityCallCenter`,
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
                cy.writeFile(b2bBodySave, b2bBody)
              })
              console.log(`questionnaireId: ${questionnaireId}`)
              const uiUrl = response.body.uiUrl;
              console.log(`uiUrl: ${uiUrl}`);

              cy.visit(uiUrl,{ log : false })
              //cy.get('.loader').should('not.exist')


              const nextButtonLabel ='Weiter'
              const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
              cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

              currentPage()

              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-01'){
                  cy.wait(2000)
                  //console.log(`vehicle-identification answer: ${answer("vehicle-identification")['bodyType']}`);
                  //console.log(`number-of-vehicles answer: ${answer("number-of-vehicles")}`);

                  cy.get('@goingPageElements').then(function (elements) {
                    elements.forEach(element => {
                     //console.log(`id: ${element['id']}`);
                      if (element['visibleExpression'] != undefined){
                        //console.log(`visibleExpression: ${element['visibleExpression']}`);
                        //console.log(`visibleExpression value: ${eval(element['visibleExpression'])}`);
                        eval(element['visibleExpression'])
                      }
                      if (element['answer'] != undefined){
                        //console.log(`answer: ${element['answer']}`);
                      }
                      if (element['readOnly'] != undefined){
                        //console.log(`readOnly: ${element['readOnly']}`);
                      }
                      if (element['optional'] != undefined){
                        //console.log(`optional: ${element['optional']}`);
                      }
                      if(element['id'] == 'vehicle-identification' && eval(element['visibleExpression'])){
                        cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
                          if (res){
                            cy.selectDropDown('select_buildPeriod',2)
                            cy.wait(2000)
                          }
                        })
                      }
                    })
                  })
                  cy.getBodyType($car,logFilename).then(function (bodyType) {
                    cy.then(function () {
                      questionnaire.bodyType = bodyType
                    })
                  })
                  cy.get('@bodyType').then(function (bodyType) {
                    if (visible('vehicle-identification') && (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel')){
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
                      if (visible('vehicle-identification') && visible('equipment-loading-area-cover-type')){
                        cy.selectSingleList('equipment-loading-area-cover-type',1)
                          setAnswer('equipment-loading-area-cover-type','roll-cover')
                      }
                    }
                  })
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
                  cy.get('input#incident-place-street-number-input').focus()
                  cy.wait(500)
                  //cy.get('input#incident-place-city-input').type('Berlin')
                  cy.get('input[data-test="dropdown-selection-enabled-text-input_incident-place-city"]').should('have.value', 'Berlin')

                  cy.selectSingleList('accident-responsible',0)
                  if (visible('vehicle-driver')){
                    cy.selectSingleList('vehicle-driver',0)
                  }
                  cy.selectSingleList('alcohol-drugs-overfatigue-while-driving',1)
                  cy.selectSingleList('excessive-speed-while-driving',1)
                  cy.selectSingleList('police-informed',1)
                  cy.selectSingleList('accident-protocol',0)

                  cy.selectMultipleList('damaged-objects',3)
                  cy.selectSingleList('accident-opponent-damaged-objects-owner-known',0)
                  const compoundQuestion = 'accident-opponent-damaged-objects-owner'
                  fulfilCompoundQuestion(compoundQuestion,0,true)
                  //fulfilCompoundQuestion(compoundQuestion,1,false)
                  //fulfilCompoundQuestion(compoundQuestion,2,true)
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

                    cy.get('input#repair-location-zip-code-input').type('10115')

                    //cy.selectSVG(`exhaust`)

                    //towing-hook if check does not calc iBox
                    if (false && SVGbody.search('g id="towing-hook"') > 0 ){
                      cy.selectSVG(`towing-hook`)
                      cy.selectSingleList('towing-hook-equipment-towhook-type', 0)
                      cy.selectMultipleList('towing-hook-damage-type', 0)
                    }

                    //underbody  if check does not calc iBox
                    //cy.selectSVG(`underbody`)

                    //cy.selectSVG(`airbag`)

                    if (SVGbody.search('g id="right-taillight"') > 0 ){
                      cy.selectSVG(`right-taillight`)
                    }

                    if (selected_parts_count_gte4 && SVGbody.search('g id="left-taillight"') > 0 ){
                       cy.selectSVG(`left-taillight`)
                    }

                    cy.get('@bodyType').then(function (bodyType) {
                      if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                        //load-doors and rear-windows
                        if ($equipment_2_loading_doors){
                          if (SVGbody.search('g id="right-load-door"') > 0 ){
                            cy.selectSVG(`right-load-door`)
                            cy.selectSVG(`left-load-door`)
                            if (SVGbody.search('g id="left-rear-door-window"') > 0 ){
                              cy.selectSVG(`left-rear-door-window`) //right-loading-door-window
                            }
                            if (SVGbody.search('g id="right-rear-door-window"') > 0 ){
                              cy.selectSVG(`right-rear-door-window`) //right-loading-door-window
                            }
                          }
                        }
                      }
                      if (bodyType == 'MPV' || bodyType == 'Hatch3' || bodyType == 'Hatch5' || bodyType == 'Sedan' || bodyType == 'Station' ||
                        bodyType == 'Coupe' || bodyType == 'Cabrio' || bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine' ||
                        bodyType == 'SUV'){
                        const regex = /g .*id="tailgate"/;
                        if (SVGbody.search(regex) > 0 ){
                           cy.selectSVG(`tailgate`)
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

              //pageId: "page-04" pageShowCriteria "answer('role-type') == 'claimant' && answer('selected-parts-count') < 4"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-04'){
                  //console.log(`visible right-taillight-equipment-led-rear-lights : ${visible('right-taillight-equipment-led-rear-lights')}`)
                  if (visible('right-taillight-equipment-led-rear-lights')){
                    cy.selectSingleList('right-taillight-equipment-led-rear-lights', 0)
                    setAnswer('right-taillight-equipment-led-rear-lights','yes')
                    cy.wait(2000)
                    //console.log(`answer right-taillight-equipment-led-rear-lights : ${answer('right-taillight-equipment-led-rear-lights')}`)
                    //console.log(`visible right-taillight-still-working : ${visible('right-taillight-still-working')}`)
                    if (visible('right-taillight-still-working')){
                      cy.selectSingleList('right-taillight-still-working', 1)
                    }
                  }
                  if (visible('left-taillight-equipment-led-rear-lights')){
                    cy.selectSingleList('left-taillight-equipment-led-rear-lights', 0)
                    setAnswer('left-taillight-equipment-led-rear-lights','yes')
                    if (visible('left-taillight-still-working')){
                      cy.selectSingleList('left-taillight-still-working', 1)
                    }
                  }
                  if (visible('tailgate-still-open-close-easily')){
                    cy.selectSingleList('tailgate-still-open-close-easily', 1)
                      setAnswer('left-taillight-equipment-led-rear-lights','no')
                  }
                  if (visible('tailgate-damage-type')){
                    cy.selectMultipleList('tailgate-damage-type', 0)
                    cy.selectMultipleList('tailgate-damage-type', 1)
                      setAnswer('tailgate-damage-type',Array.of('scratches','dents-bumps'))
                  }
                  //console.log(`tailgate-damage-type answer: ${answer("tailgate-damage-type")}`)
                  //console.log(`visible 'tailgate-damage-size': ${visible('tailgate-damage-size')} `)
                  //console.log(`includes in 'tailgate-damage-type': ${answer('tailgate-damage-type').includes('dents-bumps')}`)
                  if (visible('tailgate-damage-size')){
                    cy.selectSingleList('tailgate-damage-size', 2)
                      setAnswer('tailgate-damage-size','big')
                  }
                  cy.selectSingleList('vehicle-damage-repaired', 0)
                  cy.get('@bodyType').then(function (bodyType) {
                    if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                      cy.selectSingleList('loading-floor-area-bend', 0)
                      //load-doors and rear-windows
                      if ($equipment_2_loading_doors){
                          cy.selectMultipleList('right-load-door-damage-type', 1)
                          cy.selectSingleList('right-load-door-damage-size', 2)
                          cy.selectMultipleList('left-load-door-damage-type', 1)
                          cy.selectSingleList('left-load-door-damage-size', 2)
                      }
                    }
                  })
                  nextBtn()
                }
              })

              //pageId: "page-05"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-05'){
                  cy.get('div#triage-recommendation').find('label[for="triage-recommendation_3"]').should('be.visible');
                  cy.selectSingleList('triage-recommendation', 3)
                  nextBtn()
                }
              })

              //pageId: "page-06"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-06'){
                  if (photos_available){
                    cy.selectSingleList('photos-available', 0)
                    cy.selectSingleList('receive-upload-link-by', 0)
                    cy.get('input#claimant-email-for-upload-link-input').type(Cypress.env("client_email"))
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

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['toni_hdi_tele_check','toni_tele_check','toni_tele_expert'])
    }) //it PDF from commands
  }) //forEach
})

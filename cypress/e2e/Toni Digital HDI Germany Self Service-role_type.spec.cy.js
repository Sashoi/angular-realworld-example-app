/// <reference types="cypress" />

//const cypress = require("cypress");

import { getRandomInt } from "../support/utils/common.js";
import { makeid } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBodyToni_1.json'
import header from '../fixtures/header.json'


const logFilename = 'cypress/fixtures/logs/hdiLiabilitySS.log'
const PathToImages ='cypress/fixtures/images/'

describe('Execute b2b/integration/toni-digital/hdiLiabilitySelfService', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up intercepts and common variables', () =>{
    cy.viewport('samsung-note9')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const sendSMS = executePost && false
  const role_types = ['claimant','client']

  const printQuestionnaireIds = (obj) => {
    if(!obj) return;  // Added a null check for  Uncaught TypeError: Cannot convert undefined or null to object
    for (const [key, val] of Object.entries(obj)) {
      if (key == 'id' || key == 'visibleExpression'){
        //console.log(`${key}: ${JSON.stringify(val)}`)
        cy.then(function () {
          goingPage.elements.push(val)
        })
      }
      if (typeof val === "object") {
        printQuestionnaireIds(val);   // recursively call the function
      }
    }
  }

  function uploadImage1(selectorId,toPath,fileName){
    cy.get(`form#${selectorId}`).find('button').selectFile(`${toPath}${fileName}`, {
      action: 'drag-drop',
    })
    cy.wait(['@attachmentAnswer'],{requestTimeout : $requestTimeout}).then(xhr => {
      expect(xhr.response.statusCode).to.equal(200)
    })
    cy.wait('@savePage',{requestTimeout : $requestTimeout}).then(xhr => {
      expect(xhr.response.statusCode).to.equal(200)
    })
    cy.get(`form#${selectorId}`).find(`img[alt="${fileName}"]`).invoke('attr', 'alt').should('eq', fileName)
  }

  function fulfilCompoundQuestion(question,instance,lastInstance) {
    cy.get(`div#${question}`).find(`input#${question}-vehicle-license-plate__--__${instance}-input`).type(`SOF 123 ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-mobile-number__--__${instance}-input`).type(`+359888123 ${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-phone-number__--__${instance}-input`).type(`+359021234 ${instance + 1}`)
	  cy.get(`div#${question}`).find(`input#${question}-email__--__${instance}-input`).type(Cypress.env("client_email"))
    cy.get(`div#${question}`).find(`input#${question}-first-name__--__${instance}-input`).type(`first-name ${instance + 1}`)
	  cy.get(`div#${question}`).find(`input#${question}-last-name__--__${instance}-input`).type(`last-name ${instance + 1}`)
	  cy.get(`div#${question}`).find(`input#${question}-street-name__--__${instance}-input`).type(`street-name ${instance + 1}`)
	  cy.get(`div#${question}`).find(`input#${question}-street-number__--__${instance}-input`).type(`${instance + 1}`)
    cy.get(`div#${question}`).find(`input#${question}-zip-code__--__${instance}-input`).type(`1011${instance + 6}`)
    cy.get(`div#${question}`).find(`input#${question}-street-number__--__${instance}-input`).focus()
    cy.wait(300)
    cy.get(`div#${question}`).find(`input[data-test="dropdown-selection-enabled-text-input_${question}-city__--__${instance}"]`).focus()
    cy.get(`div#${question}`).find(`input[data-test="dropdown-selection-enabled-text-input_${question}-city__--__${instance}"]`).type(`Sofia ${instance + 1}`)
	  //country
	  cy.get(`div#${question}`).find(`input#${question}-vehicle-brand__--__${instance}-input`).type(`vehicle-brand ${instance + 1}`)
	  cy.get(`div#${question}`).find(`input#${question}-vehicle-description__--__${instance}-input`).type(`vehicle-description ${instance + 1}`)
	  cy.get(`div#${question}`).find(`input#${question}-vehicle-insurance__--__${instance}-input`).type(`vehicle-insurance ${instance + 1}`)
    if (!lastInstance) {
      cy.get(`div#${question}`).find(`input#${question}-email__--__${instance}-input`).focus()
    cy.get(`div#${question}`).find('button[type="button"]').click({ force: true })
    }
}

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
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

  const $equipment_2_loading_doors = false
  const eMail = Cypress.env("client_email")

  const file1 = [
    ["WF0KXXTTRKMC81361", "VanMidPanel", "01.01.2020", "Ford Transit 06/2021"],
  [
    "6FPPXXMJ2PCD55635",
    "PickUpDoubleCabine",
    "01.01.2012",
    "Ford Ranger double cabine, Pick-up"
  ]
  ]

  file1.forEach($car => {
    it.only(`Execute b2b/integration/toni-digital/hdiLiabilitySelfService for vin: ${$car[0]}`, () =>{

      const vin = $car[0]

      const claim1 = makeid(7)
      const claim2 = getRandomInt(10000,99999)


      const licensePlate = `HDIL ${getRandomInt(100,999)}`
      console.log(`vin: ${vin}`);

      const claimNumber = claim1 + claim2  // "21PFQ017602MR" works for reopen
      console.log(`License plate: ${licensePlate}`);

      cy.authenticate().then(function (authorization) {

          cy.then(function () {
            questionnaire.authorization = authorization
          })

          b2bBody.supportInformation.claimNumber = claimNumber
          b2bBody.supportInformation.vin =  vin
          b2bBody.supportInformation.workflowType = 'hdiLiabilitySelfService'
          b2bBody.qas.find(q => {return q.questionId === "incident-reporter-email"}).answer = eMail
          b2bBody.qas.find(q => {return q.questionId === "number-of-vehicles"}).answer = 'more-than-two'
          b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "licensePlate-vehicle-insurance-client"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "role-type"}).answer = role_types[0]

          Cypress._.merge(header, {'authorization' : authorization});
          const options = {
            method: 'POST',
            url: `${baseUrl_lp}b2b/integration/toni-digital/hdiLiabilitySelfService`,
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
              console.log(`questionnaireId: ${questionnaireId}`);
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
                  // cy.get('@goingPageElements').then(function (elements) {
                  //   elements.forEach(element => {
                  //     console.log(`id: ${element['id']}`);
                  //     if (element['visibleExpression'] != undefined){
                  //       console.log(`visibleExpression: ${element['visibleExpression']}`);
                  //       console.log(`visibleExpression value: ${eval(element['visibleExpression'])}`);
                  //     }
                  //   })
                  // })
                  cy.getBodyType($car,logFilename).then(function (bodyType) {
                    cy.then(function () {
                      questionnaire.bodyType = bodyType
                    })
                  })
                  cy.get('@bodyType').then(function (bodyType) {
                    if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                      if (visible('vehicle-identification')){
                        cy.wait(2000)
                        cy.selectSingleList('equipment-slide-door',1)
                        cy.selectSingleList('equipment-2-loading-doors',Number($equipment_2_loading_doors))
                        cy.selectSingleList('equipment-length',0)
                        cy.selectSingleList('equipment-height',0)
                        cy.selectSingleList('equipment-vehicle-rear-glassed',0)
                        cy.selectSingleList('vehicle-customized-interior',0)
                      }
                    }
                    if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
                      if (visible('vehicle-identification')){
                        cy.wait(2000)
                        cy.selectSingleList('equipment-loading-area-cover-type',1)
                      }
                    }
                  })
                  //cy.selectSingleList('collision-type',0)
                  //cy.selectSingleList('loss-circumstances',0)
                  if (visible('vehicle-identification')){
                    cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
                      if (res){
                        cy.selectDropDown('select_buildPeriod',2)
                        cy.wait(2000)
                      }
                    })
                  }
                  cy.wait(2000)
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
                  cy.selectMultipleList('damaged-objects',0)
                  cy.selectMultipleList('damaged-objects',1)
                  cy.selectMultipleList('damaged-objects',2)
                  cy.selectSingleList('accident-opponent-damaged-objects-owner-known',1)
                  //cy.get('div#accident-opponent-damaged-objects-owner').find('button[type="button"]').click({ force: true })
                  //cy.selectSingleList('accident-opponent-damaged-objects-owner-known',1)
                  cy.get('textarea#accident-opponent-damaged-objects-owner-unknown-description-textarea').type('1 Bitte geben Sie an, was beschädigt wurde{enter}2 Bitte geben Sie an, was beschädigt wurde{enter}')
                  cy.selectSingleList('accident-responsible',0)
                  if (visible('vehicle-driver')){
                    cy.selectSingleList('vehicle-driver',0)
                  }
                  cy.selectSingleList('alcohol-drugs-overfatigue-while-driving',1)
                  cy.selectSingleList('excessive-speed-while-driving',1)
                  cy.selectSingleList('police-informed',0)
                  cy.get('textarea#police-station-name-textarea').type('1. police-station-name-textarea{Enter}2. police-station-name-textarea{Enter}')
                  cy.selectSingleList('accident-protocol',0)
                  if (visible('accident-opponent-vehicle-owner-known')){
                    cy.selectSingleList('accident-opponent-vehicle-owner-known',0)
                    setAnswer('accident-opponent-vehicle-owner-known','yes')
                  }
                  cy.selectSingleList('injured-person-known',1)
                  cy.get('textarea#injured-person-injury-unknown-description-textarea').type('1 injured-person-injury-unknown-description-textarea{enter}2 injured-person-injury-unknown-description-textarea 2{enter}')
                  if (visible('accident-opponent-vehicle-owner')){
                    const compoundQuestion = 'accident-opponent-vehicle-owner'
                    fulfilCompoundQuestion(compoundQuestion,0,true)
                  }
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
                    if (SVGbody.search('g id="right-load-door"') > 0){
                      cy.selectSVG('right-load-door')
                    }
                    if (SVGbody.search('g id="left-load-door"') > 0){
                      cy.selectSVG('left-load-door')
                    }
                    if (SVGbody.search('g id="tailgate"') > 0){
                      cy.selectSVG('tailgate')
                    }
                    cy.selectSVG('hood')
                    cy.selectSVG('grill')

                    const regex = /g .*id="front-bumper"/;
                    if (SVGbody.search(regex) > 0){
                      cy.selectSVG('front-bumper')
                    }

                    cy.selectSVG('exhaust')
                    //selectSVG('towing-hook')
                    cy.selectSVG('airbag')
                  })
                  nextBtn()
                }
              })

              //pageId: "page-04"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-04'){
                  cy.selectSingleList('vehicle-damage-repaired',0)
                  setAnswer('vehicle-damage-repaired','yes')
                  if (visible('cash-on-hand-settlement-preferred')){
                    cy.selectSingleList('cash-on-hand-settlement-preferred',0)
                  }
                  cy.get('input#repair-location-zip-code-input').type('10115')
                  nextBtn()
                }
              })

              //pageId: "page-05"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-05'){
                  const file5_1 ="registration-part-1.jpg"
                  //cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,file5_1)
                  cy.uploadImage('accident-locaction-photo-upload',PathToImages,file5_1)
                  nextBtn()
                }
              })

              //pageId: "page-06"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-06'){
                  const file6_1 ="vehicle-right-front-photo.jpg"
                  cy.uploadImage('damages-on-vehicle-photo-upload',PathToImages,file6_1)

                  //const file6_2 ="vehicle-left-rear-photo1.jpg"
                  //cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,file6_2)
                  nextBtn()
                }
              })

              //pageId: "page-07"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-07'){
                  cy.get('@goingPageElements').then(function (elements) {
                    elements.forEach(element => {
                      console.log(`id: ${element}`)
                    })
                  })
                  if (false) { // click without image upload

                    cy.get('div#damage-photo-upload-overview-hood').find('label[for="multiple-upload-skip__damage-photo-upload-overview-hood"]').click({ force: true })
                    cy.get('div#damage-photo-upload-detail-hood').find('label[for="multiple-upload-skip__damage-photo-upload-detail-hood"]').click({ force: true })

                    cy.get('div#damage-photo-upload-overview-front-bumper').find('label[for="multiple-upload-skip__damage-photo-upload-overview-front-bumper"]').click({ force: true })
                    cy.get('div#damage-photo-upload-detail-front-bumper').find('label[for="multiple-upload-skip__damage-photo-upload-detail-front-bumper"]').click({ force: true })

                    cy.get('div#damage-photo-upload-overview-grill').find('label[for="multiple-upload-skip__damage-photo-upload-overview-grill"]').click({ force: true })
                    cy.get('div#damage-photo-upload-detail-grill').find('label[for="multiple-upload-skip__damage-photo-upload-detail-grill"]').click({ force: true })

                    //cy.get('div#damage-photo-upload-overview-towing-hook').find('label[for="multiple-upload-skip__damage-photo-upload-overview-towing-hook"]').click({ force: true })
                    //cy.get('div#damage-photo-upload-detail-towing-hook').find('label[for="multiple-upload-skip__damage-photo-upload-detail-towing-hook"]').click({ force: true })

                    cy.get('div#damage-photo-upload-overview-exhaust').find('label[for="multiple-upload-skip__damage-photo-upload-overview-exhaust"]').click({ force: true })
                    cy.get('div#damage-photo-upload-detail-exhaust').find('label[for="multiple-upload-skip__damage-photo-upload-detail-exhaust"]').click({ force: true })

                    cy.get('div#damage-photo-upload-overview-airbag').find('label[for="multiple-upload-skip__damage-photo-upload-overview-airbag"]').click({ force: true })
                    cy.get('div#damage-photo-upload-detail-airbag').find('label[for="multiple-upload-skip__damage-photo-upload-detail-airbag"]').click({ force: true })
                  }

                  const file7_1 ="airbag.jpg"
                  cy.elementExists('form#damage-photo-upload-overview-tailgate').then(($element) => {
                    //console.log(`$element: ${JSON.stringify($element)}`)
                    cy.uploadImage('damage-photo-upload-overview-tailgate',PathToImages,file7_1)
                  })
                  cy.elementExists('form#damage-photo-upload-detail-tailgate').then(($element) => {
                    cy.uploadImage('damage-photo-upload-detail-tailgate',PathToImages,file7_1)
                  })
                  // cy.elementExists('form#damage-photo-upload-overview-left-load-door').then(($element) => {
                  //   console.log(`$element: ` + JSON.stringify($element))
                  //   cy.uploadImage('damage-photo-upload-overview-left-load-door',PathToImages,file7_1)
                  // })
                  // cy.elementExists('form#damage-photo-upload-detail-left-load-door').then(($element) => {
                  //   cy.uploadImage('damage-photo-upload-detail-left-load-door',PathToImages,file7_1)
                  // })
                  // cy.elementExists('form#damage-photo-upload-overview-right-load-door').then(($element) => {
                  //   cy.uploadImage('damage-photo-upload-overview-right-load-door',PathToImages,file7_1)
                  // })
                  // cy.elementExists('form#damage-photo-upload-detail-right-load-door').then(($element) => {
                  //   cy.uploadImage('damage-photo-upload-detail-right-load-door',PathToImages,file7_1)
                  // })

                  cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
                  cy.uploadImage('damage-photo-upload-detail-hood',PathToImages,'hood-d.jpg')
                  cy.uploadImage('damage-photo-upload-overview-front-bumper',PathToImages,file7_1)
                  cy.uploadImage('damage-photo-upload-detail-front-bumper',PathToImages,file7_1)
                  cy.uploadImage('damage-photo-upload-overview-grill',PathToImages,file7_1)
                  cy.uploadImage('damage-photo-upload-detail-grill',PathToImages,file7_1)
                  //uploadImage('damage-photo-upload-overview-towing-hook',PathToImages,file7_1)
                  //uploadImage('damage-photo-upload-detail-towing-hook',PathToImages,file7_1)
                  cy.uploadImage('damage-photo-upload-overview-exhaust',PathToImages,file7_1)
                  cy.uploadImage('damage-photo-upload-detail-exhaust',PathToImages,file7_1)
                  cy.uploadImage('damage-photo-upload-overview-airbag',PathToImages,file7_1)
                  cy.uploadImage('damage-photo-upload-detail-airbag',PathToImages,file7_1)
                  nextBtn()
                }
              })

              //pageId:"summary-page"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'summary-page'){
                  cy.get('textarea#summary-message-from-client-textarea').type('Hier können Sie eine persönliche Mitteilung für das Schadenteam eintragen.')
                  cy.selectSingleList('receive-confirmation-by',0)
                  cy.get('input#claimant-email-for-confirmation-link-input').type(eMail)
                  cy.selectMultipleList('summary-confirmation-acknowledgement',0)
                  cy.get('@questionnaireId').then(function (Id) {
                    console.log(`from summary-page, questionnaireId: ${Id}`);
                  })
                  if (executePost) {
                    cy.get('button[type="submit"]').contains('Senden').click()
                    cy.wait('@postPost').then(xhr => {
                      cy.postPost(xhr,false)
                      if (sendSMS){
                        cy.generateSMS(`${baseUrl_lp}`, 'dekra_sms_self_service_2_customer','toni_hdi_automotive_liability_self_service')
                      }
                    })
                  }
                }
              })

        })  //hdiLiabilitySelfService
      })  //cy.authenticate
    }) //it

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['toni_hdi_tele_check','toni_tele_check','toni_tele_expert'])
    }) //it PDF from commands

    it.skip(`Generate SMS for ${$car[0]}`, function () {
      cy.generateSMS(`${baseUrl_lp}`, 'dekra_sms_self_service_2_customer','toni_hdi_automotive_liability_self_service')
    }) //it PDF from commands


  })  //forEach
}) //describe

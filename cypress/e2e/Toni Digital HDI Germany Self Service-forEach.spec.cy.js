/// <reference types="cypress" />

//const cypress = require("cypress");

import { getRandomInt } from "../support/utils/common.js";
import { makeid } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBodyToni_1.json'
import header from '../fixtures/header.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: ''  }
const logFilename = 'cypress/fixtures/logs/hdiLiabilitySS.log'
const PathTo ='cypress/fixtures/images/'

describe('Execute b2b/integration/toni-digital/hdiLiabilitySelfService', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up intercepts and common variables', () =>{
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
  }) //beforeEach

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true

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

  const $equipment_2_loading_doors = false
  const eMail = 'sivanchevski@soft2run.com'

  const file1 = [
    [
      "WDB2083441T069719",
      "Coupe",
      "01.01.2009",
      "MER CLK Coupe (partial identification, build period to be defined manually)"
    ]
  ]

  file1.forEach($car => {
    it(`Execute b2b/integration/toni-digital/hdiLiabilitySelfService for vin: ${$car[0]}`, () =>{

      const vin = $car[0]

      const claim1 = makeid(7)
      const claim2 = getRandomInt(10000,99999)


      const licensePlate = `HDI ${getRandomInt(100,999)}`

      const claimNumber = claim1 + claim2  // "21PFQ017602MR" works for reopen
      console.log(`vin: ${vin}`);

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

          Cypress._.merge(header, {'authorization' : authorization});
          const options = {
            method: 'POST',
            url: `https://${$dev}.spearhead-ag.ch:443/b2b/integration/toni-digital/hdiLiabilitySelfService`,
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
                  cy.selectSingleList('collision-type',0)
                  cy.selectSingleList('loss-circumstances',0)
                  cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
                    if (res){
                      cy.selectDropDown('select_buildPeriod',2)
                      cy.wait(2000)
                    }
                  })
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
                  cy.get('input#incident-place-city-input').type('Berlin')
                  cy.selectMultipleList('damaged-objects',3)
                  //cy.selectSingleList('accident-opponent-damaged-objects-owner-known',0)
                  //cy.get('div#accident-opponent-damaged-objects-owner').find('button[type="button"]').click({ force: true })
                  cy.selectSingleList('accident-opponent-damaged-objects-owner-known',1)
                  cy.get('textarea#accident-opponent-damaged-objects-owner-unknown-description-textarea').type('1 Bitte geben Sie an, was beschädigt wurde{enter}2 Bitte geben Sie an, was beschädigt wurde{enter}')
                  cy.selectSingleList('accident-responsible',0)
                  cy.selectSingleList('vehicle-driver',0)
                  cy.selectSingleList('alcohol-drugs-overfatigue-while-driving',1)
                  cy.selectSingleList('excessive-speed-while-driving',1)
                  cy.selectSingleList('police-informed',0)
                  cy.get('textarea#police-station-name-textarea').type('1. police-station-name-textarea{Enter}2. police-station-name-textarea{Enter}')
                  cy.selectSingleList('accident-protocol',0)
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
                  cy.get('input#repair-location-zip-code-input').type('10115')
                  nextBtn()
                }
              })

              //pageId: "page-05"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-05'){
                  const file5_1 ="registration-part-1.jpg"
                  cy.uploadImage('vehicle-registration-part-1-photo-upload',PathTo,file5_1)
                  nextBtn()
                }
              })

              //pageId: "page-06"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-06'){
                  const file6_1 ="vehicle-right-front-photo.jpg"
                  cy.uploadImage('vehicle-right-front-photo-upload',PathTo,file6_1)

                  const file6_2 ="vehicle-left-rear-photo1.jpg"
                  cy.uploadImage('vehicle-left-rear-photo-upload',PathTo,file6_2)
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
                    console.log(`$element: ` + $element)
                    cy.uploadImage('damage-photo-upload-overview-tailgate',PathTo,file7_1)
                  })
                  cy.elementExists('form#damage-photo-upload-detail-tailgate').then(($element) => {
                    cy.uploadImage('damage-photo-upload-detail-tailgate',PathTo,file7_1)
                  })
                  // cy.elementExists('form#damage-photo-upload-overview-left-load-door').then(($element) => {
                  //   console.log(`$element: ` + JSON.stringify($element))
                  //   cy.uploadImage('damage-photo-upload-overview-left-load-door',PathTo,file7_1)
                  // })
                  // cy.elementExists('form#damage-photo-upload-detail-left-load-door').then(($element) => {
                  //   cy.uploadImage('damage-photo-upload-detail-left-load-door',PathTo,file7_1)
                  // })
                  // cy.elementExists('form#damage-photo-upload-overview-right-load-door').then(($element) => {
                  //   cy.uploadImage('damage-photo-upload-overview-right-load-door',PathTo,file7_1)
                  // })
                  // cy.elementExists('form#damage-photo-upload-detail-right-load-door').then(($element) => {
                  //   cy.uploadImage('damage-photo-upload-detail-right-load-door',PathTo,file7_1)
                  // })

                  cy.uploadImage('damage-photo-upload-overview-hood',PathTo,'hood.jpg')
                  cy.uploadImage('damage-photo-upload-detail-hood',PathTo,'hood-d.jpg')
                  cy.uploadImage('damage-photo-upload-overview-front-bumper',PathTo,file7_1)
                  cy.uploadImage('damage-photo-upload-detail-front-bumper',PathTo,file7_1)
                  cy.uploadImage('damage-photo-upload-overview-grill',PathTo,file7_1)
                  cy.uploadImage('damage-photo-upload-detail-grill',PathTo,file7_1)
                  //uploadImage('damage-photo-upload-overview-towing-hook',PathTo,file7_1)
                  //uploadImage('damage-photo-upload-detail-towing-hook',PathTo,file7_1)
                  cy.uploadImage('damage-photo-upload-overview-exhaust',PathTo,file7_1)
                  cy.uploadImage('damage-photo-upload-detail-exhaust',PathTo,file7_1)
                  cy.uploadImage('damage-photo-upload-overview-airbag',PathTo,file7_1)
                  cy.uploadImage('damage-photo-upload-detail-airbag',PathTo,file7_1)
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
                    console.log(`from summary-page, questionnaireId:${Id}`);
                  })
                  if (executePost) {
                    cy.get('button[type="submit"]').contains('Senden').click()
                    cy.wait('@postPost').then(xhr => {
                      cy.postPost(xhr,false)
                    })
                  }
                }
              })

        })  //hdiLiabilitySelfService
      })  //cy.authenticate
    }) //it

    it(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['toni_hdi_tele_check','toni_tele_check','toni_tele_expert'])
    }) //it PDF from commands
  })  //forEach
}) //describe

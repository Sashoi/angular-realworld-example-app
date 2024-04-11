/// <reference types="cypress" />
import { getRandomInt } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/b2bBodyErgo.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/ErgoSelfService.log'
//const pdfPath = 'cypress/fixtures/Pdf/'
const PathTo ='cypress/fixtures/'

describe('Ergo Self Service', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    //cy.loginToApplication()
    cy.viewport('samsung-note9')
    console.clear()
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPage')
    cy.intercept('GET', `/questionnaire/*/currentPage?offset=*&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*//picture/clickableCar*`).as('clickableCar')
    cy.intercept('GET', `/questionnaire/generic_elements/attachment/*-example*`).as('generic_elements')
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
    cy.wrap(questionnaire).its('notificationId').as('notificationId')
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000
  const executePost = false
  const generatePdfCondition = true

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
            if (xhr.response.body.uiBlocks[0].elements.sections !=null && xhr.response.body.uiBlocks[0].elements.sections.length > 0){
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

  const lossCauses = ["collision","vandalism","storm","glass","animal"]

  const file1 = [
    ["6FPGXXMJ2GEL59891","PickUpSingleCabine",  "01.01.2012","Ford Ranger single cabine, Pick-up"]
  ]

  lossCauses.forEach(lossCause => {
    file1.forEach($car => {
      it.only(`Execute /questionnaire/ergo_self_service/starts with lossCause:${lossCause}, with vin:${$car[0]}`, () =>{

        const vin = $car[0] // $car[0] or 'wrong' - internalInformation.spearheadVehicle == null

        const userCredentials =  {
          "password": Cypress.env("passwordHukS"),
          "remoteUser": "",
          "sessionLanguage": "en",
          "userName": Cypress.env("usernameHukS")
        }

        let ran1 =  getRandomInt(10,99)
        let ran2 =  getRandomInt(100,999)
        let ran3 =  getRandomInt(100000,999999)

        let licenseplate = `ERG ${getRandomInt(1,9)}-${getRandomInt(100,999)}`

        //const photos_available = false;
        //const selectAllParts = false;
        //const $equipment_2_loading_doors = true

        console.log(`vin: ${vin}`);

        cy.request('POST',`${baseUrl_lp}/member/authenticate`,userCredentials)
            .its('body').then(body => {
              const token = body.accessToken
              const authorization = `Bearer ${ token }`;
              cy.then(function () {
                questionnaire.authorization = authorization
              })

              const claimNumber = ran1 + "-31-"+ ran2 + "/" + ran3 + "-Z";
              console.log(`claimNumber: ${claimNumber}`);
              console.log(`loss-cause: ${lossCause}`);

              b2bBody.supportInformation.vin =  vin
              b2bBody.qas.find(q => {return q.questionId === "client-insurance-claim-number"}).answer = claimNumber
              b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licenseplate
              b2bBody.qas.find(q => {return q.questionId === "loss-cause"}).answer = lossCause



            const options = {
              method: 'POST',
              url: `${baseUrl_lp}questionnaire/ergo_self_service/start`,
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

                const nextButtonLabel ='Speichern und Weiter'
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
                    cy.selectMultipleList('terms-of-service-acknowledgement',0)
                    cy.getQuestionnaireInfo()
                    cy.wait(1000)
                    nextBtn()
                  }
                })

                //pageId: "page-02" pageShowCriteria 'client-vehicle-license-plate' != null && internalInformation.spearheadVehicle == null
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-02'){
                    cy.selectSingleList('vehicle-body-type',0)
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-03" pageShowCriteria 'vehicle-body-type' = 'passenger-car' ||'lcv'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-03'){
                    cy.uploadImage('vehicle-registration-part-1-photo-upload-1',PathTo,'registration-part-1.jpg')
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-04" pageShowCriteria internalInformation.spearheadVehicle == null
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-04'){
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-05" pageShowCriteria "internalInformation.spearheadVehicle == null"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-05'){
                    cy.selectSingleList('hail-damage-glass-parts-lights',0)
                    cy.selectMultipleList('damaged-glass-parts-lights',0)
                    cy.selectMultipleList('damaged-glass-parts-lights',1)
                    cy.selectMultipleList('damaged-glass-parts-lights',2)
                    cy.selectMultipleList('damaged-glass-parts-lights',3)
                    cy.selectMultipleList('damaged-glass-parts-lights',4)
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-06"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-06'){
                    cy.selectMultipleList('headlights-damage-type',0) // here has a bug
                    cy.selectMultipleList('headlights-damage-type',1)
                    // cy.selectSingleList('headlights-still-working',1)
                    // cy.selectMultipleList('windshield-damage-type',0)
                    // cy.selectMultipleList('windshield-damage-type',1)
                    // cy.selectMultipleList('headlights-damage-type',0)
                    // cy.selectMultipleList('headlights-damage-type',1)
                    nextBtn()
                  }
                })

                //pageId: "page-07"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-07'){
                    cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type('123321')
                    cy.selectSingleList('hail-damage-size',2)
                    cy.selectSingleList('entire-vehicle-damaged-by-hail',1)
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-08" SVG pageShowCriteria 'entire-vehicle-damaged-by-hail' = 1
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-08'){
                    cy.selectSVG('hood')
                    cy.selectSVG('roof')
                    cy.selectSVG('windshield')
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-09" pageShowCriteria 'entire-vehicle-damaged-by-hail' = 1
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-09'){
                    cy.selectSingleList('hail-damage-intensity',2)
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-10" pageShowCriteria 'entire-vehicle-damaged-by-hail' = 0
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-10'){
                    cy.selectSingleList('damaged-vehicle-area-left-hail-damage-intensity',0)
                    cy.selectSingleList('damaged-vehicle-area-top-hail-damage-intensity',2)
                    cy.selectSingleList('damaged-vehicle-area-right-hail-damage-intensity',0)
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-13" pageShowCriteria 'glass-parts-damaged-by-hail' == 'yes') || some glass 'selected-parts' == 'yes'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-13'){
                    cy.selectMultipleList('windshield-hail-damage-type',0)
                    cy.selectMultipleList('windshield-hail-damage-type',1)
                    cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-23" pageShowCriteria = true
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-23'){
                    cy.selectSingleList('client-salutation',1)
                    nextBtn()
                  }
                })

                //pageId: "page-24" pageShowCriteria some glass part'-damage-type' == 'glass-broken') || some glass part'-still-working' == 'no'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-24'){
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
      }) //it ergo_self_service/start

      it(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
        cy.GeneratePDFs(['toni_hdi_tele_check','toni_tele_check','toni_tele_expert'])
      }) //it PDF from commands

    }) //forEach
  }) //forEach
})  //describe

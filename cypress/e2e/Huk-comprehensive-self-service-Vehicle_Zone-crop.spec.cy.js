
/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/b2bBody.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/hukVehicleZone-short.log'
const pdfPath = 'cypress/fixtures/Pdf/'
const PathTo ='cypress/fixtures/'

describe('Huk-comprehensive-self-service-Vehicle_Zone', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Login to the app', () =>{
    //cy.loginToApplication()
    console.clear()
    cy.viewport('samsung-note9')
    cy.intercept('GET', `/questionnaire/*/picture/vehicleZones?colour=007d40&areas=&locale=de`).as('vehicleZones')
    //cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    //cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPage')
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
    cy.wrap(questionnaire).its('notificationId').as('notificationId')
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const $requestTimeout = 60000;
  const executePost = false
  const generatePdfCondition = true


  function selectCropImage(selectorId,cropSelectorId,fileName){
    cy.intercept('GET', `/questionnaire/*/attachment/answer/${selectorId}/index-*`).as(`cropOrigin-${selectorId}`)
    cy.intercept('POST', `/questionnaire/*/attachment/answer/${cropSelectorId}/index-*?locale=de`).as(`attachmentAnswer-${cropSelectorId}`)
    cy.get(`form#${selectorId}`)
    .find('.crop-button-container')
    .find('button').click({ force: true,timeout : $requestTimeout });

    cy.wait(`@cropOrigin-${selectorId}`,{log : false, timeout : $requestTimeout}).then(xhr => {
      expect(xhr.response.statusCode).to.equal(200)
      cy.get('div.popup-background')
      .find('div.popup-damage-types')
      .children('label.checkbox-label').then(labels =>{
        cy.wrap(labels).first().click({ force: true })
        cy.wrap(labels).last().click({ force: true })
      })

      cy.get('div.popup-background')
      .find('button').contains('Beschädigung speichern')
      .click('center',{ force: true, timeout:  $requestTimeout })

      cy.wait([`@attachmentAnswer-${cropSelectorId}`],{log : false, timeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
      })
      cy.wait('@savePage',{timeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
      })

      cy.get(`form#${cropSelectorId}`).find(`img[alt="${fileName}"]`).invoke('attr', 'alt').should('eq', fileName)
      cy.get(`form#${cropSelectorId}`).find(`img[alt="${fileName}"]`).should('exist')
    })
  }

  function _waitFor(waitFor) {
    if (waitFor == '@nextPage'){
      cy.get('@nextBtn').click({ force: true })
    }
    cy.wait(waitFor,{timeout : $requestTimeout}).then(xhr => {
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
    ["W1V44760313930767", "Van", "01.01.2017", "Mercedes Vito 09/2021"]
  ]
  file1.forEach($car => {
    it.only(`Huk-comprehensive-self-service-Vehicle_Zone vin : ${$car[0]}`, () =>{

      const $vin = $car[0]

      const userCredentials =  {
        "password": Cypress.env("passwordHukS"),
        "remoteUser": "",
        "sessionLanguage": "en",
        "userName": Cypress.env("usernameHukS")
      }

      let ran1 =  getRandomInt(10,99)
      let ran2 =  getRandomInt(100,999)
      let ran3 =  getRandomInt(100000,999999)


      console.log(`vin: ${$vin}`);
      const licenseplate = `SOF ${getRandomInt(1000,9999)}`
      console.log(`licenseplate: ${licenseplate}`);

      const $equipment_2_loading_doors = true

    cy.request('POST',`${baseUrl_lp}member/authenticate`,userCredentials)
    .its('body').then(body => {

      const token = body.accessToken
      const authorization = `Bearer ${token}`;

        cy.then(function () {
          questionnaire.authorization =authorization
        })
        const claimNumber = ran1 + "-13-"+ ran2 + "/" + ran3 + "-Z";
        console.log(`claimNumber: ${claimNumber}`);
        b2bBody.qas.find(q => {return q.questionId === "client-insurance-claim-number"}).answer = claimNumber
        b2bBody.qas.find(q => {return q.questionId === "vehicle-vin"}).answer = $vin
        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licenseplate


        //const contentType = `application/json`;
        const headers_1 = {
          'Accept': '*/*',
          'Accept-Encoding':'gzip, deflate, br',
          'Content-Type': 'application/json',
          authorization,
        }

        const options = {
          method: 'POST',
          url: `${baseUrl_lp}b2b/integration/huk/huk-comprehensive-self-service-init`,
          body: b2bBody,
          headers: headers_1
        };

        cy.request(options).then(
          (response) => {
          expect(response.status).to.eq(200)
          const questionnaireId = response.body.questionnaireId;
          //console.log(questionnaireId);
          const options1 = {
            method: 'GET',
            url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
            headers: headers_1
          };
          cy.wait(2000)
          cy.request(options1).then(
            (response) => {
            const damageNotificationId = response.body.supportInformation.damageNotificationId;
            cy.then(function () {
              questionnaire.notificationId = damageNotificationId
            })
            Cypress.env('notificationId', damageNotificationId)
            console.log(`damageNotificationId: ${damageNotificationId}`);
            const options2 = {
                        method: 'GET',
                        url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
                        headers: headers_1
            };
            cy.wait(2000)
            cy.request(options2).then(
              (response) => {
              const requestUrl = response.body.body.requestedInformation[0].requestUrl;
              const questionnaireId2 = response.body.body.requestedInformation[0].questionnaireId;
              console.log(`requestUrl: ${requestUrl}`);
              console.log(`Real questionnaireId: ${questionnaireId2}`)
              cy.then(function () {
                questionnaire.Id = questionnaireId2
              })

              cy.visit(requestUrl);
              cy.get('.loader').should('not.exist');
              currentPage()

              const nextButtonLabel ='Speichern und Weiter'
              const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
              cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

              cy.selectMultipleList('terms-of-service-acknowledgement-huk-coburg',0)
              nextBtn()

              //"page-02"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-02'){
                  nextBtn()
                }
              })

              //"page-03"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-03'){
                  cy.get('div[title="VAN"]').find('svg').find('g#selection-mask').click({ force: true})
                  cy.then(function () {
                    questionnaire.bodyType = 'Van'
                  })
                  nextBtn()
                }
              })

              cy.getBodyType($car,logFilename).then(function (bodyType) {
                cy.then(function () {
                  questionnaire.bodyType = bodyType
                })
              })

              //"page-04"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-04'){
                  cy.get('@bodyType').then(function (bodyType) {
                    if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                      cy.selectSingleList('equipment-slide-door',1)
                      cy.selectSingleList('equipment-2-loading-doors',Number($equipment_2_loading_doors))
                      cy.selectSingleList('equipment-length',0)
                      cy.selectSingleList('equipment-height',0)
                      cy.selectSingleList('equipment-vehicle-rear-glassed',0)
                      cy.selectSingleList('vehicle-customized-interior',0)
                    }
                    if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
                      cy.wait(2000)
                      cy.selectSingleList('vehicle-loading-area-cover-type',1)
                    }
                  })
                  nextBtn()
                }
              })

              //"page-05"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-05'){
                  cy.wait('@vehicleZones',{timeout : $requestTimeout}).then(xhr => {
                    expect(xhr.response.statusCode).to.equal(200)
                    cy.selectSVG_VZ('windshield')
                    nextBtn()
                  })
                }
              })


              //"page-06"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-06'){
                  cy.selectSingleList('airbag-deployed',1)
                  cy.selectSingleList('underbody-damage-type2',1)
                  nextBtn()
                }
              })


              //"page-07"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-07'){
                  cy.get('div.svg-selection-container[title="Windschutzscheibe"]').click('center');
                  cy.wait(1000);
                  nextBtn()
                }
              })

              //"page-08"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-08'){
                  cy.uploadImage('vehicle-registration-part-1-photo-upload',PathTo,`registration-part-1.jpg`)
                  nextBtn()
                }
              })



              //"page-09" - new
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-09'){
                  cy.selectSingleList('unrepaired-pre-damages',1)  // Nein

                  nextBtn()
                }
              })


              //"page-10"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-10'){
                  cy.uploadImage('vehicle-interior-front-photo-upload',PathTo,`interior-front.jpg`)
                  cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathTo,`image dashboard-odometer.jpg`)
                  cy.get('input[data-test="vehicle-mileage-question-type-vehicle-mileage"]').type('123456')
                  nextBtn()
                }
              })

              //"page-11"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-11'){
                  cy.uploadImage('vehicle-right-front-photo-upload',PathTo,`vehicle-right-front-photo.jpg`)
                  cy.uploadImage('vehicle-left-rear-photo-upload',PathTo,`vehicle-left-rear-photo1.jpg`)
                  nextBtn()
                }
              })

              //"page-12"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-12'){
                  cy.uploadImage('damage-photo-upload-overview-vehicle-front-left-top-side',PathTo,`airbag1.jpg`)
                  cy.uploadImage('damage-photo-upload-overview-vehicle-front-right-top-side',PathTo,`airbag2.jpg`)
                  nextBtn()
                }
              })

              //"page-13"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-13'){
                  cy.uploadImage('damage-photo-upload-overview-windshield',PathTo,`broken front window_2.jpg`)
                  selectCropImage('damage-photo-upload-overview-windshield',
                                  'damage-photo-upload-detail-windshield',
                                  `“Windschutzscheibe” - Nahaufnahme der Beschädigung`)
                  nextBtn()
                }
              })


              //"page-14" "pageShowCriteria" 'loss-cause': 'glass'
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-14'){
                  nextBtn()
                }
              })

              //"page-15"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-15'){
                  cy.uploadImage('unrepaired-pre-damages-photo-upload',PathTo,`hood-npu1.jpg`)
                  nextBtn()
                }
              })

              //"page-16"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-16'){
                  //cy.uploadImage('police-ranger-report-photo-upload',PathTo,`police-ranger-report-photo-upload.png`)
                  //cy.uploadImage('incident-location-photo-upload',PathTo,`incident-location-photo-upload-1.jpg`)

                  nextBtn()
                }
              })

              //"page-17"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-17'){
                  cy.selectSingleList('vehicle-location-equals-home-address',0)
                  nextBtn()
                }
              })

              //"summary-page"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'summary-page'){
                  if(executePost){
                    //cy.postQuestionnaire() does not work
                    cy.get('button[type="submit"][data-test="questionnaire-complete-button"]').click({ force: true, timeout: 5000 });

                    cy.wait('@postPage',{timeout : $requestTimeout}).then(xhr => {
                      cy.postPost(xhr,false)
                      if (generatePdfCondition){
                        console.log(`Cypress.env('notificationId') = ${Cypress.env('notificationId')}`)
                        //let pdf_template = 'dekra_schadenbilder'
                        //cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
                        //pdf_template = 'dekra_abschlussbericht'
                        //cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
                      } //if
                    }) //cy
                  }
                }
              })
            })
          })
        })
      })
    }) //it Huk

    it(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['dekra_schadenbilder','dekra_abschlussbericht'])
    }) //it PDF from commands
  }) //forEach
})  //describe

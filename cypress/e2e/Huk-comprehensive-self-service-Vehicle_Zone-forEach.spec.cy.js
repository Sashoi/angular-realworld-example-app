
/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBody.json'
import header from '../fixtures/header.json'

const logFilename = 'cypress/fixtures/logs/hukVehicleZone.log'
const pdfPath = 'cypress/fixtures/Pdf/'
const PathToImages ='cypress/fixtures/images/'
const b2bBodySave = 'cypress/fixtures/templates/b2bBodyHuk_vehicle_zone_Save.json'

describe('Huk-comprehensive-self-service-Vehicle_Zone', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up intercepts and common variables', () =>{
    cy.viewport('samsung-note9')
    cy.intercept('GET', `/questionnaire/*/picture/vehicleZones*`,{ log: false }).as('vehicleZones')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const $requestTimeout = 60000;
  const executePost = false
  const typeTextAreasPage13 = false
  //const generatePdfCondition = true

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  const file1 = [
    ["VF7RDRFJF9L510253", "Station", "01.01.2010", "Citroen C5 Limousine 4 türig"]
  ]
  file1.forEach($car => {
    it.only(`Huk-comprehensive-self-service-Vehicle_Zone vin : ${$car[0]}`, () =>{

      const $vin = $car[0]

      let ran1 =  getRandomInt(10,99)
      let ran2 =  getRandomInt(100,999)
      let ran3 =  getRandomInt(100000,999999)

      console.log(`vin: ${$vin}`);
      const licenseplate = `SOF ${getRandomInt(1000,9999)}`
      console.log(`licenseplate: ${licenseplate}`);

      const $equipment_2_loading_doors = true

      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization =authorization
        })
        const claimNumber = ran1 + "-13-"+ ran2 + "/" + ran3 + "-Z";
        console.log(`claimNumber: ${claimNumber}`);

        b2bBody.qas.find(q => {return q.questionId === "client-insurance-claim-number"}).answer = claimNumber
        b2bBody.qas.find(q => {return q.questionId === "vehicle-vin"}).answer = $vin
        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licenseplate
        //b2bBody.qas.find(q => {return q.questionId === "vehicle-zone"}).answer = null
        //b2bBody.qas = b2bBody.qas.filter(obj => obj.questionId !== "vehicle-zone");
        //b2bBody.qas.find(q => {return q.questionId === "client-salutation"}).answer = "ms"
        //b2bBody.qas = b2bBody.qas.filter(obj => obj.questionId !== "client-salutation");

        Cypress._.merge(header, {'authorization' : authorization});
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}b2b/integration/huk/huk-comprehensive-self-service-init`,
          body: b2bBody,
          headers: header
        };

        cy.writeFile(b2bBodySave, b2bBody)

        cy.request(options).then(
          (response) => {
          expect(response.status).to.eq(200)
          const questionnaireId = response.body.questionnaireId;
          //console.log(questionnaireId);
          const options1 = {
            method: 'GET',
            url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
            headers: header
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
              headers: header
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

              cy.visit(requestUrl,{ log : false });
              //cy.get('.loader').should('not.exist');
              currentPage()

              const nextButtonLabel ='Weiter' //'Speichern und Weiter'
              const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
              cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

              //"page-01"
              cy.selectSingleList('terms-of-service-acknowledgement-huk-coburg',0)
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
                  cy.wait('@vehicleZones',{requestTimeout : $requestTimeout}).then(xhr => {
                    expect(xhr.response.statusCode).to.equal(200)
                    cy.selectSVG_VZ('front-center')
                    cy.selectSVG_VZ('front-left')
                    cy.selectSVG_VZ('front-right')
                    cy.selectSVG_VZ('side-left')
                    cy.selectSVG_VZ('side-right')
                    cy.selectSVG_VZ('rear-left')
                    cy.selectSVG_VZ('rear-right')
                    cy.selectSVG_VZ('rear-center')

                    cy.selectSVG_VZ('roof')
                    cy.selectSVG_VZ('windshield')
                    nextBtn()
                  })
                }
              })

              //"page-06"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-06'){
                  cy.selectSingleList('airbag-deployed',0)
                  cy.selectSingleList('underbody-damage-type2',0)
                  nextBtn()
                }
              })

              //"page-07"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-07'){
                  // cy.get('div.svg-selection-container[title="Windschutzscheibe"]').click('center');
                  // cy.get('div.svg-selection-container[title="Dach"]').click('center');
                  //select all
                  cy.get('div.svg-selection-container').click('center',{ multiple: true });
                  cy.wait(1000);
                  nextBtn()
                }
              })

              //"page-08"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-08'){
                  cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,`registration-part-1.jpg`)
                  nextBtn()
                }
              })

              //"page-09" - new
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-09'){
                  cy.selectSingleList('unrepaired-pre-damages',0)
                  cy.wait('@vehicleZones',{requestTimeout : $requestTimeout}).then(xhr => {
                    expect(xhr.response.statusCode).to.equal(200)
                    //cy.get('svg').find('g#front-left').children('path').eq(1).click({force: true });
                    cy.selectSVG_VZ('front-left')
                    cy.selectSVG_VZ('front-center')
                    cy.selectSVG_VZ('front-right')
                    nextBtn()
                  })
                }
              })

              //"page-10"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-10'){
                  cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,`interior-front.jpg`)
                  cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,`image dashboard-odometer.jpg`)
                  cy.get('input[data-test="vehicle-mileage-question-type-vehicle-mileage"]').type('123456')
                  nextBtn()
                }
              })

              //"page-11"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-11'){
                  cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,`vehicle-right-front-photo.jpg`)
                  cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,`vehicle-left-rear-photo1.jpg`)
                  nextBtn()
                }
              })

              //"page-12"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-12'){
                  // cy.uploadImage('damage-photo-upload-overview-vehicle-front-left-top-side',PathToImages,`airbag1.jpg`)
                  // cy.uploadImage('damage-photo-upload-overview-vehicle-front-right-top-side',PathToImages,`airbag2.jpg`)
                  // cy.uploadImage('damage-photo-upload-overview-roof-front-left-top-side',PathToImages,`airbag3.jpg`)
                  // cy.uploadImage('damage-photo-upload-overview-roof-front-right-top-side',PathToImages,`airbag4.jpg`)
                  // cy.uploadImage('damage-photo-upload-overview-roof-rear-right-top-side',PathToImages,`airbag5.jpg`)
                  // cy.uploadImage('damage-photo-upload-overview-roof-rear-left-top-side',PathToImages,`airbag6.jpg`)
                  cy.uploadAllImagesOnPage(PathToImages,4000)
                  nextBtn()
                }
              })

              //"page-13"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-13'){
                  if (typeTextAreasPage13){
                    cy.typeIntoAllTextArea('Anmerkungen zu Nahaufnahme der Beschädigung - 1.<br>Anmerkungen zu Nahaufnahme der Beschädigung - 2.<br>Anmerkungen zu Nahaufnahme der Beschädigung - 3.')
                  }
                  //cy.get('textarea#damage-photo-upload-remarks-*').type()
                  //cy.uploadImage('damage-photo-upload-overview-windshield',PathToImages,`broken front window_2.jpg`)
                  //cy.uploadImage('damage-photo-upload-detail-windshield',PathToImages,`broken front window_1.jpg`)
                  //cy.uploadImage('damage-photo-upload-overview-roof',PathToImages,`roof.jpg`)
                  if(false){
                    cy.get('form#damage-photo-upload-overview-roof').find('button').contains(' Beschädigung markieren ').click({ force: true });
                    cy.get('q-image-analytics-popup').find('div.popup-damage-types').find('input[type="checkbox"]').contains('Kratzer ').click({ force: true });
                  }
                  //cy.uploadImage('damage-photo-upload-detail-roof',PathToImages,`roof-d.jpg`)
                  cy.uploadAllImagesOnPage(PathToImages,4000)
                  //cy.get('textarea#damage-photo-upload-remarks-windshield-textarea').type('Anmerkungen zu Windschutzscheibe - 1.<br>Anmerkungen zu Windschutzscheibe - 2.<br>Anmerkungen zu Windschutzscheibe - 3.')
                  //cy.get('textarea#damage-photo-upload-remarks-roof-textarea').type('Anmerkungen zu Nahaufnahme der Beschädigung - 1.<br>Anmerkungen zu Nahaufnahme der Beschädigung - 2.<br>Anmerkungen zu Nahaufnahme der Beschädigung - 3.')

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
                  cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,`hood-npu1.jpg`)
                  cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,`hood-npu2.jpg`)
                  cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,`hood-npu3.jpg`)
                  nextBtn()
                }
              })

              //"page-16"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-16'){
                  cy.uploadImage('police-ranger-report-photo-upload',PathToImages,`police-ranger-report-photo-upload.png`)
                  cy.uploadImage('incident-location-photo-upload',PathToImages,`incident-location-photo-upload-1.jpg`)
                  cy.uploadImage('incident-location-photo-upload',PathToImages,`incident-location-photo-upload-2.jpg`)
                  cy.uploadImage('incident-location-photo-upload',PathToImages,`incident-location-photo-upload-3.jpg`)
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

              //"page-18"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-18'){
                  cy.selectSingleList('vehicle-location-equals-home-address',0)
                  nextBtn()
                }
              })

              //"page-19"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-19'){
                  cy.get('textarea#additional-remarks-textarea').type('Weitere Anmerkungen  - 1.<br>Weitere Anmerkungen  - 2.<br>Weitere Anmerkungen  - 3.')
                  nextBtn()
                }
              })

              //"summary-page"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'summary-page'){
                  cy.get('section#summary_unrepaired-pre-damages-section').scrollIntoView()
                  if(executePost){
                    //cy.postQuestionnaire() does not work
                    cy.get('button[type="submit"][data-test="questionnaire-complete-button"]').click({ force: true, timeout: 5000 });

                    cy.wait('@postPost',{requestTimeout : $requestTimeout, responseTimeout: $requestTimeout}).then(xhr => {
                      cy.postPost(xhr,false)
                      console.log(`Cypress.env('notificationId') = ${Cypress.env('notificationId')}`)
                    }) //cy.wait
                  }
                }
              })
            })
          })
        })
      })
    }) // it Huk

    it.skip(`Generate PDFs for ${$car[0]}`, function () {

      cy.authenticate().then(function (authorization) {

        cy.then(function () {
          questionnaire.authorization = authorization
        })

        const damageNotificationId = Cypress.env('notificationId')
        cy.then(function () {
          questionnaire.notificationId = damageNotificationId
        })

        Cypress._.merge(header, {'authorization' : authorization});

        const options3 = {
          method: 'GET',
          url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
          headers: header
        }
        cy.request(options3).then(
          (response3) => {
          expect(response3.status).to.eq(200) // true
          const vin = response3.body.body.vehicleIdentification.vin;
          console.log(`vin: ${vin}`)
          let pdf_template = 'dekra_schadenbilder'
          cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
          pdf_template = 'dekra_abschlussbericht'
          cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
        })
      })
    }) //it PDF

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      Cypress.env('notificationId','kSNARtMNsB7dEG29yFIMz')
      cy.GeneratePDFs(['dekra_schadenbilder','dekra_abschlussbericht','dekra_schadenbilder_kommentiert'])
    }) //it PDF from commands

  })  //forEach
})  //describe

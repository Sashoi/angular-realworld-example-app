/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import emailBody from '../fixtures/templates/emailBodyA.json'
import b2bBody from '../fixtures/templates/b2bBodySphSales.json'
import header from '../fixtures/header.json'
const b2bBodySave = 'cypress/fixtures/templates/sph_sales_comprehensive_call_centerSave.json'

const logFilename = 'cypress/fixtures/logs/SphSalesComprehensiveCallCenter.log'
const PathToImages ='cypress/fixtures/images/'

describe('Start and complete Sph_sales comprehensive call center - sph_sales_comprehensive_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {
    cy.intercept('POST', `questionnaire/sph_sales_comprehensive_call_center/start`).as('sphSalesCC')
    cy.intercept('GET',  `/questionnaire/*/page/page-*?locale=de`).as('currentPageR')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const executePost2 = true

  function printUiBlocks(uiBlocks){
    uiBlocks.forEach((uiBlock, index1) => {
      uiBlock.elements.sections.forEach((section, index2) => {
        console.log(`section [${index1}][${index2}]: ${section.label.content}.`)
      })
    })
  }

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  function currentPageR() {
    cy.waitingFor('@currentPageR',goingPage,questionnaire)
  }

  function convertDate(dateString){
    var p = dateString.split(/\D/g)
    return [p[2],p[1],p[0] ].join("-")
    }


  const file1 = [
    [
      "TMBJB7NS4K8027658",
      "SUV",
      "01.09.2018",
      "SKODA Kodiaq 1.5 TSI ACT DSG Style"
    ]
]
  file1.forEach($car => {
    it(`Sph sales - sph_sales_comprehensive_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]

      const intS3 = getRandomInt(100,999).toString()
      const $equipment_2_loading_doors = true

      let  first_registration_date = $car[2]
      //const f_first_registration_date = '2017-06-14'
      console.log(`first registration date: ${first_registration_date}`)
      first_registration_date = convertDate(first_registration_date)

      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)
      const licensePlate = `SP ${intS3}9`
      //Cypress.env('licensePlate', licensePlate)
      console.log(`license plate: ${licensePlate}`)

      cy.authenticate().then(function (authorization) {

        cy.then(function () {
          questionnaire.authorization = authorization
        })
        //b2bBody.supportInformation.vin  = $vin
        //b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
        b2bBody.qas.find(q => {return q.questionId === "vehicle-first-registration-date"}).answer = first_registration_date


        Cypress._.merge(header, {'authorization' : authorization});

        const options = {
          method: 'POST',
          url: `${baseUrl_lp}questionnaire/sph_sales_comprehensive_call_center/start`,
          body: b2bBody,
          headers: header
        };
        cy.request(options).then(
          (response) => {
          // response.body is automatically serialized into JSON
          expect(response.status).to.eq(200) // true
          cy.writeFile(b2bBodySave, b2bBody)
          const questionnaireId = response.body.questionnaireId;
          cy.then(function () {
            questionnaire.Id = questionnaireId
          })
          const uiUrl = response.body.uiUrl;
          console.log(`sph_sales_comprehensive_call_center questionnaireId: ${questionnaireId}`)
          console.log(`sph_sales_comprehensive_call_center uiUrl: ${uiUrl}`)
          cy.visit(uiUrl,{ log : false })
        })
      })

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.wait(1000)

      // Fahrzeugbeschreibung und Schadenhergang - page-01
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.get('input#vin').clear().type($vin)
          cy.get(`button[data-test="identify-button"]`).click()
          cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
            if (res){
              cy.selectDropDown('select_buildPeriod',1)
              cy.wait(2000)
            }
          })

          cy.get('input#client-vehicle-license-plate-input').clear().type(licensePlate)
          cy.selectSingleList('loss-cause',0)
          cy.selectSingleList('loss-circumstances-details',0)

          //cy.get('textarea#loss-cause-client-remarks-textarea').clear().type('Versicherungsinterne Anmerkung zur Schadenursache und/oder Schadenhergang:')
          //cy.selectSingleList('vehicle-ready-to-drive',1)
          //cy.selectSingleList('vehicle-location',2)
          cy.selectSingleList('repair-cost-estimate-available',1)
          cy.selectSingleList('cash-on-hand-settlement-preferred',1)
          //cy.selectSingleList('photo-only-available',1)
          cy.get('#repair-location-zip-code-input').clear().type('22222')
          cy.selectSingleList('switch-to-self-service-workflow',0)


          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })

          cy.get('@bodyType').then(function (bodyType) {
            if (false && (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel')){
              //cy.selectSingleList('loading-floor-area-bend', 0)
              cy.wait(2000)
              cy.selectSingleList('equipment-slide-door',1)
              cy.selectSingleList('equipment-2-loading-doors',Number($equipment_2_loading_doors))

              cy.selectSingleList('equipment-length',0)
              cy.selectSingleList('equipment-height',0)
              cy.selectSingleList('equipment-vehicle-rear-glassed',0)
              cy.selectSingleList('vehicle-customized-interior',0)
            }
            if (false && (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine')){
              cy.wait(2000)
              cy.selectSingleList('equipment-loading-area-cover-type',1)
            }
          })
          cy.wait(4000)
          nextBtn()
        }
      })

      // Schadenbeschreibung - page-02
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)

            if (xhr.response.body.search('g id="right-load-door"') > 0){
              //cy.selectSVG('right-load-door')
            }
            if (xhr.response.body.search('g id="left-load-door"') > 0){
              //cy.selectSVG('left-load-door')
            }
            if (xhr.response.body.search('g id="tailgate"') > 0){
              //cy.selectSVG('tailgate')
            }
            if (xhr.response.body.search('g id="hood"') > 0){
              cy.selectSVG('hood')
              //cy.selectMultipleList('hood-DT2',0)
              cy.selectSingleList('hood-still-open-close-easily',1)
              cy.selectMultipleList('hood-damage-type',1)
              cy.selectSingleList('hood-damage-size',2)
            }

            //cy.selectSingleList('vehicle-safe-to-drive',0)
            //cy.selectSingleList('vehicle-ready-to-drive',0)
            //cy.selectSingleList('unrepaired-pre-damages',1)
            //cy.selectSingleList('vehicle-damage-repaired',0)
            //cy.get('textarea#unrepaired-pre-damages-description-textarea').clear().type('Bitte beschreiben Sie die unreparierten Vorschäden')
            //cy.get('#repair-location-zip-code-input').clear().type('22222')

            if (xhr.response.body.search('g id="rightFrontWheelRim"') > 0){
              cy.selectSVG('rightFrontWheelRim')
              cy.wait(2000)
              cy.selectSingleList('rightFrontWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('rightFrontWheelRim-DT2',1)
            }

            if (xhr.response.body.search('g id="rightRearWheelRim"') > 0){
              cy.selectSVG('rightRearWheelRim')
              cy.selectSingleList('rightRearWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('rightRearWheelRim-DT2',0)
              cy.selectMultipleList('rightRearWheelRim-DT2',1)
            }
            if (xhr.response.body.search('g id="rightFrontTire"') > 0){
              cy.selectSVG('rightFrontTire')
            }
            if (xhr.response.body.search('g id="rightRearTire"') > 0){
              cy.selectSVG('rightRearTire')
            }
            if (xhr.response.body.search('g id="leftFrontWheelRim"') > 0){
              cy.selectSVG('leftFrontWheelRim')
              cy.selectSingleList('leftFrontWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('leftFrontWheelRim-DT2',1)
            }
            if (xhr.response.body.search('g id="leftRearWheelRim"') > 0){
              cy.selectSVG('leftRearWheelRim')
              cy.selectSingleList('leftRearWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('leftRearWheelRim-DT2',0)
              cy.selectMultipleList('leftRearWheelRim-DT2',1)
            }
            if (xhr.response.body.search('g id="leftFrontTire"') > 0){
              cy.selectSVG('leftFrontTire')
            }
            if (xhr.response.body.search('g id="leftRearTire"') > 0){
              cy.selectSVG('leftRearTire')
            }

            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                cy.selectSingleList('loading-floor-area-bend', 0)
                cy.getQuestionAnswer('loss-cause').then(function (answer) {
                  console.log(`loss-cause : ${answer}`);
                })
                cy.wait(1000)
              }
            })
            nextBtn()
          })
        }
      })

      // Regulierungsempfehlung - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('triage-recommendation',0)
          cy.selectSingleList('recommended-action',0)
          cy.selectSingleList('photos-available',1)
          nextBtn()
        }
      })

      // Schadenbilder und Dokumente - page-04
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          //cy.selectSingleList('photos-not-available-because',2)
          nextBtn()
        }
      })
      //cy.then(() => this.skip())    // stop here


      //Zusammenfassung, post questionnaire - summary-page
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, questionnaireId:${Id}`);
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

    it(`sph_sales_comprehensive_self_service_app create vin ${$car[0]}`, () => {
      const notificationId = Cypress.env('notificationId')
      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
        Cypress._.merge(header, {'authorization':authorization});
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/sph_sales_comprehensive_self_service_app`,
          body: emailBody,
          headers: header
        };
        cy.request(options).then(
          (response) => {
            // response.body is automatically serialized into JSON
            expect(response.status).to.eq(200) // true
            console.log(`allianz_comprehensive_self_service:`);
            const arrLength = response.body.requestedInformation.length
            console.log(response.body.requestedInformation[arrLength - 1].requestUrl);
            Cypress.env('requestUrl', response.body.requestedInformation[arrLength - 1].requestUrl)
            console.log(response.body.requestedInformation[arrLength - 1].templateId);
            Cypress.env('templateId', response.body.requestedInformation[arrLength - 1].templateId)
            //cy.printRequestedInformation(response.body.requestedInformation);
        })
      })
    })

    it.skip(`sph_sales_comprehensive_self_service_app.json execute vin ${$car[0]}`, () => {
      cy.viewport('samsung-note9')
      console.log(`Start ${Cypress.env('templateId')} from url: ${Cypress.env('requestUrl')}.`)

      cy.visit(Cypress.env('requestUrl'),{log : false})

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.selectMultipleList('terms-of-service-acknowledgement',0)
          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          nextBtn()
        }
      })
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,'registration-part-1.jpg')
          nextBtn()
        }
      })
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-05'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-06'){
          cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
          cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-07'){
          cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,'interior-front.jpg')
          cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-08'){
          cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-09'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-10'){
          cy.get('input#client-bank-name-input').type('FiBank');
          cy.get('input#client-bank-iban-input').type('IBAN1234');
          cy.get('input#client-bank-bic-input').type('BIC');
          cy.get('input#client-bank-account-holder-input').type('Account Holder');
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('textarea#summary-message-from-client-textarea').type('Hier können Sie eine persönliche Mitteilung für das Muster Versicherungs AG Schadenteam eintragen.')
          if (executePost2) {
            //pageId: "summary-page"
            cy.selectMultipleList('summary-confirmation-acknowledgement',0)
            cy.get('button[type="submit"]').contains('Senden').click()
            cy.wait('@postPost',{ log: false }).then(xhr => {
              cy.postPost(xhr,false).then(function (notificationId) {
                console.log(`notificationId: ${notificationId}`);
              })
            })
          }
        }
      })

    })
  })
})

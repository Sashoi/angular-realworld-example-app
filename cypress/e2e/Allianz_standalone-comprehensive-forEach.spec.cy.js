/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import emailBody from '../fixtures/templates/emailBodyA.json'
import header from '../fixtures/header.json'

const logFilename = 'cypress/fixtures/logs/AllianzComprehensiveCallCenter.log'
const PathToImages ='cypress/fixtures/images/'

describe('Start and complete Allianz standalone questionnaire - Allianz_comprehensive_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {
    //cy.viewport('samsung-note9')
    cy.intercept('POST', `/b2b/integration/allianz/allianz-comprehensive-call-center?identifyVehicleAsync=false`).as('allianzStandaloneCC')
    cy.intercept('GET', `/b2b/integration/allianz/allianz-comprehensive-call-center,allianz-liability-call-center/*`).as('allianzStandaloneCcGET')
    cy.intercept('GET',  `/questionnaire/*/page/page-*?locale=de`).as('currentPageR')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = false
  const executePostR = true  // reopen
  const executePostSS = true // self_service
  const sendSMS = false
  const photos_available = true
  const selectUnderbody = false

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

  const file1 = [
    [
      "6FPPXXMJ2PCD55635",
      "PickUpDoubleCabine",
      "01.01.2012",
      "Ford Ranger double cabine, Pick-up "
    ]
]
  file1.forEach($car => {
    it.only(`allianz standalone - allianz_comprehensive_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]
      //Login()
      cy.standaloneLogin('allianz').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })

      const intS3 = getRandomInt(100,999).toString()
      const intS4 = getRandomInt(1000,9999).toString()
      const intS7 = getRandomInt(1000000,9999999).toString()
      const $equipment_2_loading_doors = true

      const claimNumber = `${intS4} ${intS7}`
      const first_registration_date = $car[2]

      Cypress.env('claimNumber', claimNumber)
      console.log(`claimNumber: ${claimNumber}`)
      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)
      const licensePlate = `ACC ${intS3}`
      //Cypress.env('licensePlate', licensePlate)
      console.log(`license plate: ${licensePlate}`)


      // Fulfill standalone form
      cy.get('[name="claimNumber"]').type(claimNumber);
      cy.get('[data-test="standalone_vin"]').type($vin)
      cy.get('[data-test="standalone_licensePlate"]').type(licensePlate)
      cy.get('input#zipCode').clear().type('2222')
      cy.get('[class="btn btn-primary btn-submit"]').click()

      cy.wait('@allianzStandaloneCC').then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        console.log(`questionnaireId: ${xhr.response.body.questionnaireId}`)
        cy.then(function () {
          questionnaire.Id = xhr.response.body.questionnaireId
        })
        console.log(`uiUrl: ${xhr.response.body.uiUrl}`)
      })
      cy.wait(1000)

      currentPage()
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      // Fahrzeugbeschreibung und Schadenhergang - page-01
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.get('#accident-date-input').type('01.11.2023')
          cy.get('#vehicle-first-registration-date-input').type(first_registration_date)
          cy.get('#vehicle-mileage-input').clear().type('123456')
          cy.selectSingleList('odometer-reading-source-display',0)

          cy.selectorHasAttrClass('select#select_specialModel','field-invalid').then(res =>{
            if (res){
              cy.selectDropDown('select_specialModel',1)
              cy.wait(2000)
            }
          })
          cy.selectorHasAttrClass('select#select_bodyType','field-invalid').then(res =>{
            if (res){
              cy.selectDropDown('select_bodyType',1)
              cy.wait(2000)
            }
          })
          cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
            if (res){
              cy.selectDropDown('select_buildPeriod',2)
              cy.wait(2000)
            }
          })

          cy.selectSingleList('loss-cause',0)
          cy.selectSingleList('loss-circumstances-details',0)

          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })

          cy.get('@bodyType').then(function (bodyType) {
            if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
              //cy.selectSingleList('loading-floor-area-bend', 0)
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

            if (xhr.response.body.search('g id="right-headlight"') > 0){
              cy.selectSVG('right-headlight')
              cy.selectSingleList('right-headlight-equipment-enhanced-headlight-system',0)
              cy.selectSingleList('right-headlight-loose-shifted-by-hand',0)
            }

            if (xhr.response.body.search('g id="left-headlight"') > 0){
              cy.selectSVG('left-headlight')
              cy.selectSingleList('left-headlight-equipment-enhanced-headlight-system',0)
              cy.selectSingleList('left-headlight-loose-shifted-by-hand',0)
            }

            //cy.selectSingleList('vehicle-safe-to-drive',0)
            //cy.selectSingleList('vehicle-ready-to-drive',0)
            //cy.selectSingleList('unrepaired-pre-damages',1)
            cy.selectSingleList('vehicle-damage-repaired',0)
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
            if (xhr.response.body.search('g id="right-front-wheel"') > 0){
              cy.selectSVG('right-front-wheel')
              cy.selectSingleList('right-front-wheel-equipment-rims-type',0)
              cy.selectMultipleList('right-front-wheel-damage-type',0)
            }

            if (xhr.response.body.search('g id="left-front-wheel"') > 0){
              cy.selectSVG('left-front-wheel')
              cy.selectSingleList('left-front-wheel-equipment-rims-type',0)
              cy.selectMultipleList('left-front-wheel-damage-type',0)
            }

            if (xhr.response.body.search('g id="airbag"') > 0){
              cy.selectSVG('airbag')
              cy.selectSingleList('airbag-deployed',0)
            }
            if (selectUnderbody && xhr.response.body.search('g id="underbody"') > 0){
              cy.selectSVG('underbody')
              cy.selectSingleList('underbody-damage-type2',0)
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

            cy.get('textarea#vehicle-damage-internal-note-textarea').type('Hinweis:Dieses Freitext-Eingabefeld ist für Muster Versicherungs AG interne Anmerkungen vorgesehen.')

            nextBtn()
          })
        }
      })

      // Regulierungsempfehlung - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('triage-recommendation',0)
          nextBtn()
        }
      })

      // Schadenbilder und Dokumente - page-04
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          if (photos_available){
            cy.selectSingleList('photos-available',0)
            if (sendSMS){
              cy.selectSingleList('receive-upload-link-by-2',1)
              cy.get('q-country-selection-options').click()
              cy.wait(1000)
              cy.get('ul.dropdown-menu.show').contains('Bulgarien').click()
              cy.get('input#client-mobile-phone-number-for-upload-link-2-input').clear().type('888795023')
            } else {
              cy.selectSingleList('receive-upload-link-by-2',0)
              cy.get('input#client-email-for-upload-link-2-input').clear().type('sivanchevski@soft2run.com')
            }
          } else {
            cy.selectSingleList('photos-available',1)
            cy.selectSingleList('photos-not-available-because',2)
          }
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

    it(`allianz standalone - allianz_comprehensive_call_center - reoprn vin ${$car[0]}`, () => {
      const claimNumber  = Cypress.env('claimNumber')
      //const licensePlate = Cypress.env('licensePlate')

      console.log(`claimNumber: ${claimNumber}`)
      //console.log(`licensePlate: ${licensePlate}`)

      //Login()
      cy.standaloneLogin('allianz').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })

      cy.get('a#OPEN_EXISTING-link').click()
      cy.get('input[name="claimNumber"]').type(claimNumber)
      //cy.get('input#licensePlate').type(licensePlate)
      cy.get('button[data-test="standalone_submit"]').click()

      cy.wait('@allianzStandaloneCcGET').then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        console.log(`questionnaireId: ${xhr.response.body.id}`)
        cy.then(function () {
          questionnaire.Id = xhr.response.body.id
        })
        console.log(`templateId: ${xhr.response.body.templateId}`)
        console.log(`supportInformation.bodyType: ${xhr.response.body.supportInformation.bodyType}`)
      })
      cy.wait(1000)

      currentPageR()
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      // //Fahrzeugbeschreibung und Schadenhergang - page-01
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.wait(1000)
          nextBtn()
        }
      })

      // Schadenbeschreibung - page-02
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            nextBtn()
          })
        }
      })

      // Schadenbilder und Dokumente - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          nextBtn()
        }
      })

      // Regulierungs- und Handlungsempfehlung - page-04
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          nextBtn()
        }
      })

      //Zusammenfassung, post questionnaire - summary-page
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, questionnaireId:${Id}`);
          })
          if (executePostR) {
            cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    })

    it(`allianz_comprehensive_self_service create vin ${$car[0]}`, () => {
      const notificationId = Cypress.env('notificationId') //`wlA4icU77W6LjzUFyrGzy`
      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
        Cypress._.merge(header, {'authorization':authorization});
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/allianz_comprehensive_self_service`,
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

    it(`allianz_comprehensive_self_service execute vin ${$car[0]}`, () => {
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
          if (executePostSS) {
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

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['allianz_abschlussbericht'])
    }) //it PDF from commands
  }) // forEach
})

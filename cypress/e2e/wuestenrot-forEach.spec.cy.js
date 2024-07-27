/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'

const logFilename = 'cypress/fixtures/logs/wuestenrot.log'
const pdfPath = 'cypress/fixtures/Pdf/'
const PathToImages ='cypress/fixtures/images/'

describe('Start and complete wuestenrot standalone questionnaire', () => {

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up intercepts and common variables', () => {
    cy.intercept('POST', `/b2b/integration/wuestenrot/wuestenrot-comprehensive-call-center?identifyVehicleAsync=false`).as('postStart')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const executePost2 = true

  const sectionError = true
  const photos_available = true
  const client_email_for_upload = 'sivanchevski@soft2run.com'

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  function prevBtn() {
    cy.get('@prevBtn').click({ force: true })
    cy.waitingFor('@prevPage',goingPage,questionnaire)
  }

  const file1 = [

    ["SALYL2RV8JA741831", "SUV", "01.01.2019", "Land Rover, SUV"]
  ]
  file1.forEach($car => {
    it(`wuestenrot-comprehensive-call-center for vin: ${$car[0]}`, () => {

      const $vin = $car[0]

      // cy.visit(`${baseUrl_lp}ui/questionnaire/zurich/#/login?theme=wuestenrot`,{ log : false })
      // cy.get('[placeholder="Email"]').type(Cypress.env("usernameHukS"))
      // cy.get('[placeholder="Passwort"]').type(Cypress.env("passwordHukS"))
      // cy.get('form').submit()
      // cy.wait('@token',{requestTimeout : $requestTimeout, log: false}).then(xhr => {
      //   expect(xhr.response.statusCode).to.equal(200)
      //   const access_token = xhr.response.body.access_token
      //   cy.then(function () {
      //     questionnaire.authorization = `Bearer ${access_token}`
      //   })
      // })  //wait @token

      //Login()
      cy.standaloneLogin('wuestenrot').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })



      const intS1 = getRandomInt(1000, 9999).toString()
      const intS2 = getRandomInt(1000, 9999).toString()
      const intS3 = getRandomInt(100, 999).toString()
      const intS4 = getRandomInt(0, 9).toString()
      const $equipment_2_loading_doors = true
      const claimNumber = `${intS1}.${intS2}/${intS3}-${intS4}`
      console.log(`claimNumber: ${claimNumber}`)
      const licenseplate = `WUE ${getRandomInt(1,9)}-${getRandomInt(100,999)}`
      console.log(`vin: ${$vin}`);

      cy.get('[name="claimNumber"]').type(claimNumber)
      cy.get('[data-test="standalone_vin"]').type($vin)
      cy.get('[data-test="standalone_firstRegistrationDate__input"]').type('10.05.2013')
      cy.get('[data-test="standalone_licensePlate"]').type(licenseplate)
      cy.get('[data-test="standalone_zipCode"]').type('2222')
      cy.get('[class="btn btn-primary btn-submit"]').click()
      cy.wait(500)

      cy.wait('@postStart',{log: false}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        console.log(`questionnaireId: ${xhr.response.body.questionnaireId}`)
        cy.then(function () {
          questionnaire.Id = xhr.response.body.questionnaireId
        })
        console.log(`uiUrl: ${xhr.response.body.uiUrl}`)
      })
      cy.wait(1000)


      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){  // Fahrzeugbeschreibung und Schadenhergang
          cy.get('#accident-date-input').type('01.11.2023')
          cy.get('#vehicle-mileage-input').clear().type('123456')
          //cy.selectSingleList('loss-cause',0) // already selected
          cy.selectSingleList('loss-circumstances-details',8)
          cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
            if (res){
              cy.selectDropDown('select_buildPeriod',1)
              cy.wait(2000)
            }
          })
          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })
          cy.get('@bodyType').then(function (bodyType) {
            if (!sectionError){
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
                  cy.selectSingleList('equipment-loading-area-cover-type',1)
              }
            }
          })
          nextBtn()
          cy.wait(1000)
        }
      })

      const PrevButtonLabel ='Zurück'
      const selectorPrevButton = 'button[type="button"][data-test="questionnaire-back-button"]'
      cy.get(selectorPrevButton).contains(PrevButtonLabel).as('prevBtn')

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02' && sectionError){  // Schadenbeschreibung
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout, log: false}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            prevBtn()
          })
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01' && sectionError){  // Fahrzeugbeschreibung und Schadenhergang
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
              cy.selectSingleList('equipment-loading-area-cover-type',1)
            }
          })
          nextBtn()
          cy.wait(1000)
        }
      })


      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){  // Schadenbeschreibung
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout, log: false}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            const SVGbody = xhr.response.body;

            cy.selectSVG('hood')
            cy.selectMultipleList('hood-damage-type',0)

            cy.selectSVG('roof')
            cy.selectMultipleList('roof-damage-type',0)
            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'Cabrio'){
                cy.selectSingleList('roof-equipment-convertible-roof-material',0)
              }
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                cy.selectSingleList('loading-floor-area-bend',0)
              }
            })
            cy.selectSingleList('vehicle-safe-to-drive',0)
            cy.selectSingleList('vehicle-ready-to-drive',0)
            cy.selectSingleList('unrepaired-pre-damages',0)
            cy.selectSingleList('vehicle-damage-repaired',0)

            cy.selectSVG('exhaust') // Welche Art von Beschädigung sehen Sie? - selected
            cy.selectSVG(`right-taillight`)
            cy.selectSingleList('right-taillight-equipment-led-rear-lights', 0)

            cy.selectSVG(`left-sill`)
            cy.selectMultipleList('left-sill-damage-type', 1)
            cy.selectSingleList('left-sill-damage-size', 3)

            cy.selectSVG('windshield')
            cy.selectSingleList('windshield-equipment-windshield-electric',0)
            cy.selectMultipleList('windshield-damage-type',1)
            cy.selectMultipleList('windshield-damage-type',2)
            cy.selectSVG('zone-d')
            cy.selectSingleList('windshield-damage-size-stone-chips-bigger-2cm',0)
            cy.selectSingleList('windshield-damage-size-crack-bigger-2cm',0)
            nextBtn()
          })  //wait('@clickableCar'
        }  // if
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('triage-recommendation',0)
          cy.get('div#transfer-fee').find('input#transfer-fee-feecalculationwithfee').type('99')
          cy.get('div#transfer-fee').find('input#transfer-fee-feecalculation').type('111')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          if (!photos_available){
            cy.selectSingleList('photos-available',1)
            cy.selectSingleList('photos-not-available-because',2)
          } else {
            cy.selectSingleList('photos-available',0)
            cy.selectSingleList('receive-upload-link-by-2',0)
            cy.get('div#client-email-for-upload-link-2').find('input#client-email-for-upload-link-2-input').type(client_email_for_upload)
          }
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, questionnaireId: ${Id}`);
          })
          if (executePost) {
            //pageId: "summary-page"
            cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()
            cy.wait('@postPost',{ log: false }).then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    })  //it wuestenrot

    it(`execute wuestenrot_comprehensive_self_service for vin: ${$car[0]}`, () => {

      cy.viewport('samsung-note9','landscape')
      const requestUrl = Cypress.env('requestUrl')
      console.log(`requestUrl:${requestUrl}`);
      cy.wait(4000)
      cy.visit(requestUrl).then((contentWindow) => {
        // contentWindow is the remote page's window object
        console.log(`contentWindow : ${contentWindow}`)
        console.log(`URL : ${contentWindow.document.URL}`)
      })
      const nextButtonLabel ='Speichern und Weiter'
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
          cy.wait(1000)
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){

          nextBtn()
          cy.wait(1000)
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){

          nextBtn()
          cy.wait(1000)
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
          cy.uploadImage('damage-photo-upload-overview-windshield',PathToImages,'airbag.jpg')
          cy.uploadImage('damage-photo-upload-overview-left-sill',PathToImages,'left-sill-o.jpg')
          cy.uploadImage('damage-photo-upload-overview-roof',PathToImages,'roof.jpg')
          cy.uploadImage('damage-photo-upload-overview-exhaust',PathToImages,'broken exhaust_1.jpg')
          cy.uploadImage('damage-photo-upload-overview-right-taillight',PathToImages,'right-taillight-o.jpg')
          cy.uploadImage('damage-photo-upload-other',PathToImages,'incident-location-photo-upload-1.jpg')
          cy.uploadImage('damage-photo-upload-other',PathToImages,'incident-location-photo-upload-2.jpg')
          cy.uploadImage('damage-photo-upload-other',PathToImages,'incident-location-photo-upload-3.jpg')

          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-9'){
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


    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['wuestenrot_abschlussbericht'])
    }) //it PDF from commands
  })  //forEach
})

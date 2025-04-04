/// <reference types="cypress" />

const { resolveProjectReferencePath } = require("typescript")
import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'

const logFilename = 'cypress/fixtures/logs/hukComprehensiveCallCenter.log'

describe('Start and complete huk standalone questionnaire - huk_comprehensive_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {
    cy.intercept('POST', `/b2b/integration/huk/huk-comprehensive-call-center?identifyVehicleAsync=false`).as('hukStandaloneCC')
    cy.intercept('GET', `/b2b/integration/huk/huk-comprehensive-call-center/*`).as('hukStandaloneCcGET')
    cy.intercept('GET',  `/questionnaire/*/page/page-*?locale=de`).as('currentPageR')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = false
  const executePostR = true

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

  function shiftDateByMonths(sdate, months){
    //console.log(sdate); expect dd.mm.yyyy
    var parts = sdate.split('.');
    // Please pay attention to the month (parts[1]); JavaScript counts months from 0:
    // January - 0, February - 1, etc.
    var mydate = new Date(parts[2], parts[1] - 1, parts[0]);
    //console.log(mydate.toDateString());
    var newDate = new Date(new Date(mydate).setMonth(mydate.getMonth() + months));
    //console.log(newDate.toDateString());
    //  if you need it to be padded with zeros:
    var datestring = ("0" + newDate.getDate()).slice(-2) + "." + ("0"+(newDate.getMonth()+1)).slice(-2) + "." + newDate.getFullYear();
    //console.log(datestring);
    return datestring  // return dd.mm.yyyy
  }

  const file1 = [
    ["WAUZZZ4B73N015435", "Sedan", "01.01.2014", "AUD A6/S6/RS6 Sedan "]
]
  file1.forEach($car => {
    it.only(`huk standalone - huk_comprehensive_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]
      ///Login()
      cy.standaloneLogin('huk').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })

      const intS1 = getRandomInt(10,99).toString()
      const intS2 = getRandomInt(100,999).toString()
      const intS3 = getRandomInt(100000,999999).toString()
      const $equipment_2_loading_doors = true

      const $claimTypes = ['30','31','32','33','34','35','36','37','38','39'];
      const claimType_random = getRandomInt(0,$claimTypes.length);
      const $claimType = $claimTypes[claimType_random];
      const claimNumber = `${intS1}-${$claimType}-${intS2}/${intS3}-C`
      const first_registration_date = shiftDateByMonths($car[2], 1) //$car[2] //'01.11.2003'

      Cypress.env('claimNumber', claimNumber)
      console.log(`claimNumber: ${claimNumber}`)
      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)
      const licensePlate = `HCC ${intS2}`
      Cypress.env('licensePlate', licensePlate)
      console.log(`license plate: ${licensePlate}`)


      // Fulfill standalone form
      cy.get('[name="claimNumber"]').type(claimNumber);
      cy.get('[data-test="standalone_vin"]').type($vin)
      cy.get('[data-test="standalone_licensePlate"]').type(licensePlate)
      cy.get('[class="btn btn-primary btn-submit"]').click()

      cy.wait('@hukStandaloneCC').then(xhr => {
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

      // //Fahrzeugbeschreibung und Schadenhergang - page-01
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.get('#accident-date-input').type('01.11.2023')
          cy.get('#vehicle-first-registration-date-input').type(first_registration_date)
          cy.get('#vehicle-mileage-input').clear().type('123456')
          cy.selectSingleList('odometer-reading-source-display',0)
          cy.selectorHasAttrClass('select#select_buildPeriod','field-invalid').then(res =>{
            if (res){
              cy.selectDropDown('select_buildPeriod',2)
              cy.wait(2000)
            }
          })
          cy.selectSingleList('loss-cause',0)
          cy.selectSingleList('loss-circumstances-details',0)
          cy.selectSingleList('switch-to-self-service-workflow',1)
          cy.selectSingleList('insurance-policy-type',0)

          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })

          cy.get('@bodyType').then(function (bodyType) {
            if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
              cy.selectSingleList('vehicleStatus-VS40',1)
            }
            if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
              cy.selectSingleList('vehicleStatus-VS30',3)
              cy.selectSingleList('vehicleStatus-VS31',Number($equipment_2_loading_doors)) //0- "Eine Ladeklappe"; 1 - "Zwei Ladetüren"
              cy.selectSingleList('vehicleStatus-VS35',0)
              cy.selectSingleList('vehicleStatus-VS36',0)
              cy.selectSingleList('vehicleStatus-VS32',0)
              cy.selectSingleList('vehicleStatus-VS33',0)
            }
          })
          nextBtn()
        }
      })

      // Schadenbeschreibung - page-02
      cy.get('@goingPageId',{timeout : 6000}).then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.get('@goingPageElements',{includeShadowDom:true, timeout : 6000}).then(function (elements) {
            const threeSixtyOptions = elements.find(x => x.id === 'selected-parts').threeSixtyOptions
            if (threeSixtyOptions != null && threeSixtyOptions.vehicleFolderPath != null && threeSixtyOptions.vehicleFolderPath.length > 0){
              //clickableCar 3D
              cy.then(function () {
                questionnaire.is3Dcar = true
              })
              cy.get('div.clickMaskContainer').find('svg',{timeout: 10000}).find('path').then($path => {
                console.log(`paths count: ${$path.length}`);
                if ($path.length > 0) {
                  //const Id = $path.id
                  //cy.wrap($path).click({ force: true, multiple: true, timeout : 4000 })  // select all
                  cy.get('div.clickMaskContainer').find('svg',{timeout: 10000}).find('path#hood').click({ force: true, timeout : 4000 })
                  cy.selectMultipleList('hood-damage-type',0)
                  //cy.selectMultipleList('hood-DT2',0)

                }
              })
            } else {
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
                  cy.selectMultipleList('hood-damage-type',0)
                  //cy.selectMultipleList('hood-DT2',0)
                }

                if (xhr.response.body.search('g id="right-front-wheel"') > 0){
                  cy.selectSVG('right-front-wheel')
                  cy.wait(2000)
                  cy.selectSingleList('right-front-wheel-equipment-rims-type',0)
                  cy.selectMultipleList('right-front-wheel-damage-type',1)
                }

                if (xhr.response.body.search('g id="left-front-wheel"') > 0){
                  cy.selectSVG('left-front-wheel')
                  cy.wait(2000)
                  cy.selectSingleList('left-front-wheel-equipment-rims-type',0)
                  cy.selectMultipleList('left-front-wheel-damage-type',1)
                }

                if (xhr.response.body.search('g id="right-rear-wheel"') > 0){
                  cy.selectSVG('right-rear-wheel')
                  cy.wait(2000)
                  cy.selectSingleList('right-rear-wheel-equipment-rims-type',0)
                  cy.selectMultipleList('right-rear-wheel-damage-type',1)
                }

                if (xhr.response.body.search('g id="left-rear-wheel"') > 0){
                  cy.selectSVG('left-rear-wheel')
                  cy.wait(2000)
                  cy.selectSingleList('left-rear-wheel-equipment-rims-type',0)
                  cy.selectMultipleList('left-rear-wheel-damage-type',1)
                }


                if (xhr.response.body.search('g id="right-front-wheel-tire"') > 0){
                  cy.selectSVG('right-front-wheel-tire')
                }

                if (xhr.response.body.search('g id="right-rear-wheel-tire"') > 0){
                  cy.selectSVG('right-rear-wheel-tire')
                }

                if (xhr.response.body.search('g id="left-front-wheel-tire"') > 0){
                  cy.selectSVG('left-front-wheel-tire')
                }

                if (xhr.response.body.search('g id="left-rear-wheel-tire"') > 0){
                  cy.selectSVG('left-rear-wheel-tire')
                }



                cy.get('@bodyType').then(function (bodyType) {
                  if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                    cy.selectSingleList('loading-floor-area-bend',1)
                  }
                })

              })

            }
            cy.selectSingleList('vehicle-safe-to-drive',0)
            cy.selectSingleList('vehicle-ready-to-drive',0)
            cy.selectSingleList('unrepaired-pre-damages',1)
            cy.selectSingleList('vehicle-damage-repaired',0)
            cy.get('textarea#unrepaired-pre-damages-description-textarea').clear().type('Bitte beschreiben Sie die unreparierten Vorschäden')
            cy.get('#repair-location-zip-code-input').clear().type('01001') //04158  22222
            nextBtn()
          })
        }
      })

      // Schadenbilder und Dokumente - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('photos-available',1)
          cy.selectSingleList('photos-not-available-because',2)
          nextBtn()
        }
      })

      // Regulierungs- und Handlungsempfehlung - page-04
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
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

    it(`huk standalone - huk_comprehensive_call_center - reoprn vin ${$car[0]}`, () => {
      const claimNumber  = Cypress.env('claimNumber')
      const licensePlate = Cypress.env('licensePlate')

      console.log(`claimNumber: ${claimNumber}`)
      console.log(`licensePlate: ${licensePlate}`)

      //Login()
      cy.standaloneLogin('huk').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })

      cy.get('a#OPEN_EXISTING-link').click()
      cy.get('input[name="claimNumber"]').type(claimNumber)
      cy.get('input#licensePlate').type(licensePlate)
      cy.get('button[data-test="standalone_submit"]').click()

      cy.wait('@hukStandaloneCcGET').then(xhr => {
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
  })
})

/// <reference types="cypress" />
import * as util from 'util' // has no default export
//import { inspect } from 'util' // or directly
// or
//var util = require('util')

const { resolveProjectReferencePath } = require("typescript")
import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBodySph.json'


const logFilename = 'cypress/fixtures/logs/sphStandalone.log'

describe('Start and complete Sph standalone questionnaire 3D car - axa_de_comprehensive_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    cy.intercept('POST', `b2b/integration/sph/sphLiabilityCallCenter?identifyVehicleAsync=false`).as('sphStandalone')
    cy.commanBeforeEach(goingPage,questionnaire)
    //cy.clock()
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const executePost2= true
  const interceptSphStandalone = false

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

  function dragStartDrop(element){
    cy.get('div.clickMaskContainer').find('svg',{timeout: 10000}).find('g').first().find(`path#${element}`)
    .trigger('dragstart','left', { force: true })
    cy.wait(2000)

    cy.get('div.clickMaskContainer').find('svg',{timeout: 10000}).find('g').first().find(`path#${element}`)
    .trigger('drop','right', { force: true })
  }

  function mouseDownMoveUp(element){
    cy.get('div.clickMaskContainer').find('svg',{timeout: 10000}).find('g').first().find(`path#${element}`)
    .trigger('mousedown', 'left', { button: 1, force : true, timeout: 2000}) //topRight
    .wait(1000)
    .trigger('mousemove', 'right', {force : true, animationDistanceThreshold : 5, waitForAnimations : true})
    .trigger('mouseup', { force: true })
}

  const file1 = [
    ["YV4A22PK5N1849833", "SUV", "01.01.2020", "Volvo XC90 2022"]
  ]
  file1.forEach($car => {
    it(`Sph standalone questionnaire - axa_de_comprehensive_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]

      //Login()
      cy.standaloneLogin('sph').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })

      cy.wait(500)


      const intS4 = getRandomInt(1000,9999).toString()
      const intS18 = getRandomInt(100000000000000000,999999999999999999).toString()

      const $equipment_2_loading_doors = true

      const first_registration_date = "2024-02-01";
      const f_first_registration_date = '01.02.2024';
      console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)
      console.log(`first_registration_date: ${first_registration_date}`)
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      const claimNumber = `${intS18}`
      const licensePlate = `SPH ${intS4}`
      console.log(`claimNumber: ${claimNumber}`)

      // Fulfill standalone form
      cy.get('select[name="processGroup"]').select(1)
      cy.get('input[name="claimNumber"]').type(claimNumber);
      cy.get('input[data-test="standalone_vin"]').type($vin)
      cy.get('input[formcontrolname="firstRegistrationDate"]').type(f_first_registration_date)

      if (interceptSphStandalone){
       // with this intercept I'm replacing the body of standalone
       // adding 'roof' as selected SVG
        cy.intercept('POST', `b2b/integration/sph/sphLiabilityCallCenter`, (req) => {

          b2bBody.qas.find(q => {return q.questionId === "license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "claimant-vehicle-license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "first-registration-date"}).answer = first_registration_date
          b2bBody.qas.find(q => {return q.questionId === "claim-number"}).answer = claimNumber
          b2bBody.supportInformation.claimNumber = claimNumber
          b2bBody.supportInformation.vin = $vin

          req.body = b2bBody
        })
      }
      cy.get(`input[name="claimNumber"]`).invoke('val').then($val => {
        console.log(`claimNumber after: ${$val}`)
      })
      cy.get('button[data-test="standalone_submit"]').click()

      cy.wait('@sphStandalone',{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const questionnaireId = xhr.response.body.questionnaireId
        console.log(`b2b questionnaireId: ${questionnaireId}`);
        cy.then(function () {
          questionnaire.Id = questionnaireId
        })
        const uiUrl = xhr.response.body.uiUrl
        console.log(`b2b uiUrl: ${uiUrl}`);
      }) //wait('@sphStandalone',

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
          cy.fillInvalidDropDown('select_specialModel')
          cy.wait(2000)
          cy.fillInvalidDropDown('select_buildPeriod')
          cy.wait(2000)
          cy.get('#client-vehicle-license-plate-input').clear().type(licensePlate)
          cy.get('#vehicle-mileage-input').clear().type('123456')
          cy.get('#accident-date-input').type('01.11.2024')
          cy.selectSingleList('loss-circumstances-details',0)
          cy.selectSingleList('cash-on-hand-settlement-preferred',0)
          cy.selectSingleList('repair-cost-estimate-available',1)
          cy.get('#repair-location-zip-code-input').clear().type('10115')
          cy.selectSingleList('switch-to-self-service-workflow', 0)
          cy.intercept('POST', '/questionnaire/*/page/page-01?navigateTo=next&offset=120&locale=de').as('page01')
          nextBtn()
          //cy.tick(1001)
          cy.wait('@page01').its('response').should('have.property', 'statusCode', 200)
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          console.log(`Comming SVG with 3D car`)
          cy.get('@bodyType').then(function (bodyType) {
            console.log(`bodyType: ${bodyType}`);
          }) //get('@bodyType'
          cy.wait(10000)

          const dragElement = 'windshield' //'hood'

          if (false){
            mouseDownMoveUp(dragElement)
          }


          dragStartDrop(dragElement)

          if (false) { //search by alternativeId
            cy.get('@goingPageElements').then(function (elements) {
            const areas = elements.find(x => x.id === 'selected-parts').areas
            areas.forEach(area =>{
              if (area.visible && area.enabled && area.alternativeIds != null && area.alternativeIds.length > 0 && area.alternativeIds[0] != null) {
                const alternativeId = area.alternativeIds[0].toString()
                if (!alternativeId.startsWith('rim') && !alternativeId.startsWith('tyre') && !alternativeId.startsWith('door') &&
                    !alternativeId.startsWith('windowdoor') && !alternativeId.startsWith('sideskirt') && !alternativeId.startsWith('sideframe') &&
                    !alternativeId.startsWith('rearwindow')){
                  console.log(alternativeId)
                  //cy.selectSVG(area.id)
                  cy.get(`path#${alternativeId}`).click({ force: true })
                }
              }
            })
            })
          }
          if (true) { //path#Id
              cy.get('div.clickMaskContainer').find('svg',{timeout: 10000}).find('path').then($path => {
                console.log(`$path length: ${$path.length}`);
                //const Id = $path.id
                cy.wrap($path).click({ force: true, multiple: true, timeout : 4000 })
              }
            )
          }

          dragStartDrop(dragElement)

          //cy.get('path#hood').click()
          nextBtn()
        } //'page-02'
      }) //get('@goingPageId'


      // Schadenbilder und Dokumente - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('photos-available',0)
          cy.selectSingleList('receive-upload-link-by',0)
          cy.get('input#client-email-for-upload-link-input').clear().type('sivanchevski@soft2run.com')
          cy.wait(2000)
          nextBtn()
        }
      })

      //Zusammenfassung, post questionnaire - summary-page
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, saved questionnaireId: ${Id}`);
          })
          if (executePost) {
            cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    }) //it

    it(`axa_de_liability_self_service_upload get requestUrl vin ${$car[0]}`, () => {
      cy.getLastRequestUrl()
    })


    it(`Execute axa_de_liability_self_service_upload for ${$car[0]}`, function () {
      cy.viewport('samsung-note9')
      cy.wait(2000)
      let requestUrl = Cypress.env('requestUrl')
      //requestUrl = 'https://dev03.spearhead-ag.ch:443/p/r/cyXdGLmaW1EEoMS4CODdQ'
      if(requestUrl == undefined || requestUrl == null || !requestUrl.length > 0){
        throw new Error(`test fails : requestUrl = ${requestUrl}`)
      }
      console.log(`Start ${Cypress.env('templateId')} from url: ${requestUrl}.`)

      const questionnaireId = Cypress.env('questionnaireId')
      console.log(`questionnaireId : ${questionnaireId}`);
      cy.then(function () {
        questionnaire.Id = questionnaireId
      })

      cy.wait(4000)

      cy.visit(requestUrl,{log : false})

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.wait(1000)
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
          nextBtn()
        }
      })


      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-07'){
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-08'){
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
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.selectMultipleList('summary-confirmation-acknowledgement',0)
          if (executePost2) {
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
      cy.GeneratePDFs(['zurich_default','zurich_pg1_schadenbericht','zurich_pg1_schadenprotokoll'])
    }) //it PDF from commands

  })  //forEach
}) //describe

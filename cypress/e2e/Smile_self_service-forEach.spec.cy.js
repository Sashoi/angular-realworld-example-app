/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import emailBody from '../fixtures/templates/emailBodyA.json'
import b2bBody from '../fixtures/templates/b2bBodySmile.json'
import header from '../fixtures/header.json'
const b2bBodySave = 'cypress/fixtures/templates/smile_self_serviceSave.json'

const logFilename = 'cypress/fixtures/logs/SphSalesComprehensiveCallCenter.log'
const PathToImages ='cypress/fixtures/images/'

describe('Start and complete Smile self service', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {
    cy.viewport('samsung-note9')
    //cy.viewport(3840,2160)
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const sendButtonText = 'Vorschadenmeldung senden'


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

    ["WVWZZZ7NZDV041367", "MPV", "01.01.2011", "VW Sharan MPV"]
]

  file1.forEach($car => {
    it.only(`Smile - smile_self_service vin ${$car[0]}`, () => {

      const $vin = $car[0]

      const intS3 = getRandomInt(100,999).toString()
      const intS41 = getRandomInt(1000,9999).toString()
      const intS42 = getRandomInt(1000,9999).toString()
      const $equipment_2_loading_doors = true
      const claimNumber =`${intS41}-${intS42}A`

      let  first_registration_date = $car[2]
      //const f_first_registration_date = '2017-06-14'
      console.log(`first registration date: ${first_registration_date}`)
      first_registration_date = convertDate(first_registration_date)

      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)
      const licensePlate = `SM ${intS3}9`
      //Cypress.env('licensePlate', licensePlate)
      console.log(`license plate: ${licensePlate}`)

      cy.authenticate().then(function (authorization) {

        cy.then(function () {
          questionnaire.authorization = authorization
        })

        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
        b2bBody.qas.find(q => {return q.questionId === "vehicle-first-registration-date"}).answer = first_registration_date
        b2bBody.supportInformation.vin = $vin
        b2bBody.supportInformation.claimNumber = claimNumber


        Cypress._.merge(header, {'authorization' : authorization});

        const options = {
          method: 'POST',
          url: `${baseUrl_lp}questionnaire/smile_self_service/start`,
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
          console.log(`smile_self_service questionnaireId: ${questionnaireId}`)
          console.log(`smile_self_service uiUrl: ${uiUrl}`)
          cy.visit(uiUrl,{ log : false })
        })
      })

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.wait(1000)

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.selectSingleList('terms-of-service-acknowledgement',0)
          cy.wait(4000)
          nextBtn()
        }
      })

      // Schadenbeschreibung - page-02
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
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
          cy.wait(5000)
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

      // Regulierungsempfehlung - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('vehicle-damaged',1)
          nextBtn()
        }
      })

      // Schadenbilder und Dokumente - page-04
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
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

            if (xhr.response.body.search('g id="roof"') > 0){
              cy.selectSVG('roof')
              cy.selectSingleList('roof-equipment-panorama-roof',0)
              cy.selectMultipleList('roof-damage-type',1)
              cy.selectSingleList('roof-damage-size',3)
            }

            if (xhr.response.body.search('g id="right-front-wheel-tire"') > 0){
              cy.selectSVG('right-front-wheel-tire')
              cy.selectMultipleList('right-front-wheel-tire-damage-type',0)
            }


			      if (xhr.response.body.search('g id="right-front-wheel"') > 0){
              cy.selectSVG('right-front-wheel')
			        cy.selectSingleList('right-front-wheel-equipment-rims-type',0)
              cy.selectMultipleList('right-front-wheel-damage-type',1)
            }

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
                //cy.selectSingleList('loading-floor-area-bend', 0)
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
      //cy.then(() => this.skip())    // stop here

      // cy.get('@goingPageId').then(function (aliasValue) {
      //   if (aliasValue == 'page-05'){
      //     EmptyError, no questions
      //     nextBtn()
      //   }
      // })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-06'){
          cy.uploadAllImagesOnPage(PathToImages)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-07'){
          cy.uploadAllImagesOnPage(PathToImages)
          nextBtn()
        }
      })


      //Zusammenfassung, post questionnaire - summary-page
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, questionnaireId:${Id}`);
          })
          if (executePost) {
            cy.get('textarea#summary-message-from-client-textarea').type('Hier können Sie eine persönliche Mitteilung für das Schadenteam eintragen.')
            cy.selectMultipleList('summary-confirmation-acknowledgement',0)
            cy.get('button[type="submit"]').contains(sendButtonText).click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr,false)
            })
          }
        }
      })
    })

  })
})

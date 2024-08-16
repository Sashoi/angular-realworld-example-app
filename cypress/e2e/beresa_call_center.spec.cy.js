/// <reference types="cypress" />
import * as util from 'util' // has no default export
//import { inspect } from 'util' // or directly
// or
//var util = require('util')

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
//import b2bBody from '../fixtures/templates/dekraIntLiabilityCallCenterBody.json'liability
//import injectQuestions from '../fixtures/templates/injectQuestions.json'
import emailBody from '../fixtures/templates/emailBodyD.json'
import header from '../fixtures/header.json'


const logFilename = 'cypress/fixtures/logs/beresa_call_center.log'
const PathToImages ='cypress/fixtures/images/'

describe('Start and complete beresa_call_center standalone questionnaire', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    cy.intercept('POST', `/b2b/integration/pnw/dekraGarageCallCenter`).as('dekraGarageCallCenter')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const executePost2 = false
  const sendSMS = false
  const interceptBeresaStandalone = false
  const $equipment_2_loading_doors = true

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

  const file1 = [

    ["W1V44760313930767", "Van", "01.01.2020", "Mercedes Vito  09/2021 "]

  ]
  file1.forEach($car => {
    it(`beresa_call_center standalone questionnaire, vin ${$car[0]}`, () => {

      const $vin = $car[0]

      cy.standaloneLogin('dekra_bodyshop_cc').then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
      })

      const intS1 = getRandomInt(10,99).toString()
      const intS2 = getRandomInt(1000000,9999999).toString()
      const intS3 = getRandomInt(1000,9999).toString()
      const intS4 = getRandomInt(1,9).toString()




      console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      const claimNumber = `${intS2}`
      const licensePlate = `BER${intS2}`
      console.log(`claimNumber: ${claimNumber}`)

      // Fulfill standalone form
      cy.get('input[name="claimNumber"]').type(claimNumber);

      cy.get('input#licensePlate').type(licensePlate)


      if (interceptBeresaStandalone){
       // with this intercept I'm replacing the body of standalone
        cy.intercept('POST', `/b2b/integration/pnw/dekraGarageCallCenter`, (req) => {
          b2bBody.qas.find(q => {return q.questionId === "license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "claimant-vehicle-license-plate"}).answer = licensePlate
          b2bBody.qas.find(q => {return q.questionId === "claim-number"}).answer = claimNumber
          b2bBody.supportInformation.claimNumber = claimNumber
          b2bBody.supportInformation.vin = $vin

          req.body = b2bBody
        })
      }
      cy.get('button[data-test="standalone_submit"]').click()

      cy.wait('@dekraGarageCallCenter',{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const questionnaireId = xhr.response.body.questionnaireId
        console.log(`b2b questionnaireId: ${questionnaireId}`);
        cy.then(function () {
          questionnaire.Id = questionnaireId
        })
        const uiUrl = xhr.response.body.uiUrl
        console.log(`b2b uiUrl: ${uiUrl}`);
      }) //wait('@dekraGarageCallCenter',

      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          cy.getBodyType($car,logFilename).then(function (bodyType) {
            cy.then(function () {
              questionnaire.bodyType = bodyType
            })
          })

          cy.get('input#accident-date-input').type('01.05.2024')
          cy.selectSingleList('coverage-type', 2)
          cy.selectSingleList('loss-cause', 0)
          cy.selectDropDown('dropdown-selection-company-branch',3)
          cy.wait(4000)
          cy.selectDropDown('dropdown-selection-beresa-ahl-employee',2)
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
            cy.get('button[type="submit"]').contains('Vorgangsanlage abschließen und Self-Service Link versenden').click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    }) //it


    it(`beresa_self_service_app_employee create vin ${$car[0]}`, () => {
      const notificationId = Cypress.env('notificationId')
      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
        Cypress._.merge(header, {'authorization':authorization});
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/beresa_self_service_app_employee?unknownReceiver=true`,
          body: emailBody,
          headers: header
        };
        cy.request(options).then(
          (response) => {
            // response.body is automatically serialized into JSON
            expect(response.status).to.eq(200) // true
            //console.log(`dekra_int_liability_self_service_app:`);
            const arrLength = response.body.requestedInformation.length
            const requestUrl = response.body.requestedInformation[arrLength - 1].requestUrl
            const templateId = response.body.requestedInformation[arrLength - 1].templateId
            console.log(`requestUrl : ${requestUrl}`);
            console.log(`templateId : ${templateId}`);
            Cypress.env('requestUrl', requestUrl)
            Cypress.env('templateId', templateId)
            //cy.printRequestedInformation(response.body.requestedInformation);
        })
        if (sendSMS){
          const options = {
            method: 'POST',
            url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/beresa_self_service_app_employee`,
            body : `{
              "receiver": "+359888795023",
              "contact": {
                "firstName": "first name",
                "lastName": "lastName",
                "mobileNumber": "+359888795023",
                "type": "PERSON"
              },
              "smsTemplate": "dekra_sms_self_service_2_customer"
            }`,
            headers: header
          };
          cy.request(options).then(
            (response) => {
              // response.body is automatically serialized into JSON
              expect(response.status).to.eq(200) // true
              const arrLength = response.body.requestedInformation.length
              const requestUrl = response.body.requestedInformation[arrLength - 1].requestUrl
              const templateId = response.body.requestedInformation[arrLength - 1].templateId
              console.log(`notificationId : ${notificationId}`);
              console.log(`SMS templateId : ${templateId}`);
              console.log(`SMS requestUrl : ${requestUrl}`);
              //Cypress.env('requestUrl', requestUrl)
              //Cypress.env('templateId', response.body.requestedInformation[arrLength - 1].templateId)
              //cy.printRequestedInformation(response.body.requestedInformation);
          })
        }
      })

    })

    it(`beresa_self_service_app_employee execute vin ${$car[0]}`, () => {
      cy.viewport('samsung-note9')
      const requestUrl = Cypress.env('requestUrl')
      console.log(`Start ${Cypress.env('templateId')} from url: ${requestUrl}.`)

      cy.visit(requestUrl,{log : false})

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      currentPage()

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          // cy.getBodyType($car,logFilename).then(function (bodyType) {
          //   cy.then(function () {
          //     questionnaire.bodyType = bodyType
          //   })
          // })
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.uploadImage('order-form-upload-beresa-ahl',PathToImages,'airbag.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,'registration-part-1.jpg')
          nextBtn()
        }
      })
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          //vehicle-vin-photo-upload
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-05'){
          cy.selectSingleList('vehicle-body-type',10) //0..10
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-06'){
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

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-07'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout, log : false}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            const SVGbody = xhr.response.body;
            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){}

              if (bodyType == 'MPV' || bodyType == 'Hatch3' || bodyType == 'Hatch5' || bodyType == 'Sedan' ||
                  bodyType == 'Coupe' || bodyType == 'Cabrio' || bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine' ||
                  bodyType == 'SUV'){}
            }) //get('@bodyType'
            const SVGs = ['hood','roof','grill','leftRearWindow','right-front-door']
            SVGs.forEach((svg) => {
              //console.log(svg)
              if (SVGbody.search(`g id="${svg}"`) > 0){
                cy.selectSVG(svg)
              }
            });
            //cy.selectSVG('windshield')
          }) //wait('@clickableCar'
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-08'){
          cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,'interior-front.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-09'){
          cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
          cy.get('input#vehicle-mileage-input').type('321334')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-10'){
          cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
          cy.uploadImage('vehicle-left-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
          cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
          cy.uploadImage('vehicle-right-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-11'){
          cy.uploadAllImagesOnPage(PathToImages)
          cy.get('input#damage-photo-upload-remarks-hood-input').type('damage-photo-upload-remarks-hood')
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-12'){
          cy.get('form').each(($form, index, $list) => {
            cy.wrap($form)
            .invoke('attr', 'id')
            .then((id) => {
              console.log(`$form[${index}] : ${id}.`) //prints id
              cy.uploadImage(id,PathToImages,'airbag.jpg')
              cy.uploadImage(id,PathToImages,'airbag.jpg')
              cy.uploadImage(id,PathToImages,'airbag.jpg')
              cy.uploadImage(id,PathToImages,'airbag.jpg')
              cy.uploadImage(id,PathToImages,'airbag.jpg')
            })
          })
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-13'){
          cy.get('@bodyType').then(function (bodyType) {
            const remarks = `additional-remarks for bodyType : ${bodyType}.`
            cy.get('textarea#additional-remarks-textarea').type(remarks)
          })
          nextBtn()
        }
      })


      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          if (executePost2) {
            //pageId: "summary-page"
            //cy.selectMultipleList('`summary-confirmation-acknowledgement`',0)
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

    // it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
    //   cy.GeneratePDFs(['beresa_abschlussbericht'])
    // }) //it PDF from commands

  })  //forEach
}) //describe

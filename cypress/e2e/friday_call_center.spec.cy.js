
import * as util from 'util' // has no default export
//import { inspect } from 'util' // or directly
// or
//var util = require('util')

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBodyFriday.json'

import emailBody from '../fixtures/templates/emailBodyD.json'
import header from '../fixtures/header.json'

//https://dev02.spearhead-ag.ch/questionnaire/friday_callCenter/start


const logFilename = 'cypress/fixtures/logs/friday_call_center.log'
const PathToImages ='cypress/fixtures/images/'
const b2bBodySave = 'cypress/fixtures/templates/b2bBodyFridaySave.json'

describe('Start and complete friday_call_center standalone questionnaire', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    //cy.intercept('POST', `questionnaire//friday_callCenter/start`).as('/fridayCC')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000;
  const executePost = true
  const executePost2 = false
  const sendSMS = false
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

  function convertDate(dateString){
    var p = dateString.split(/\D/g)
    return [p[2],p[1],p[0] ].join("-")
  }

  function cleanStringify(object) {
    if (object && typeof object === 'object') {
        object = copyWithoutCircularReferences([object], object);
    }
    return JSON.stringify(object);

    function copyWithoutCircularReferences(references, object) {
        var cleanObject = {};
        Object.keys(object).forEach(function(key) {
            var value = object[key];
            if (value && typeof value === 'object') {
                if (references.indexOf(value) < 0) {
                    references.push(value);
                    cleanObject[key] = copyWithoutCircularReferences(references, value);
                    references.pop();
                } else {
                    cleanObject[key] = '###_Circular_###';
                }
            } else if (typeof value !== 'function') {
                cleanObject[key] = value;
            }
        });
        return cleanObject;
    }
  }

  const file1 = [
    [
      "WVWZZZ3CZME020680",
      "Station",
      "01.09.2020",
      "Passat Variant 1.4 TSI Plug-In-Hybrid DSG GTE"
    ]
  ]
  file1.forEach($car => {
    it(`friday_call_center standalone questionnaire, vin ${$car[0]}`, () => {

      const $vin = $car[0]
      const first_registration_date = convertDate($car[2]) //"2024-02-01";
      const intS2 = getRandomInt(10,99).toString()
      const intS6 = getRandomInt(100000,999999).toString()
      const intS3 = getRandomInt(100,999).toString()
      const intS4 = getRandomInt(1000,9999).toString()

      console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)

      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })

        const claimNumber = `${intS3}-${intS2}-${intS6}`
        const licensePlate = `FRI ${intS4}`
        console.log(`claimNumber: ${claimNumber}`)

        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licensePlate
        b2bBody.qas.find(q => {return q.questionId === "claimant-vehicle-license-plate"}).answer = licensePlate
        b2bBody.qas.find(q => {return q.questionId === "license-plate"}).answer = licensePlate
        b2bBody.qas.find(q => {return q.questionId === "first-registration-date"}).answer = first_registration_date
        b2bBody.qas.find(q => {return q.questionId === "claim-number"}).answer = claimNumber
        b2bBody.supportInformation.claimNumber = claimNumber
        b2bBody.supportInformation.vin = $vin

        Cypress._.merge(header, {'authorization' : authorization});

        const options = {
          method: 'POST',
          url: `${baseUrl_lp}questionnaire/friday_callCenter/start`,
          body: b2bBody,
          headers: header
        };
        cy.request(options).then(
          (response) => {
          // response.body is automatically serialized into JSON
          expect(response.status).to.eq(200) // true
          const questionnaireId = response.body.questionnaireId;
          cy.then(function () {
            questionnaire.Id = questionnaireId
          })
          const uiUrl = response.body.uiUrl;
          console.log(`friday_callCenter questionnaireId: ${questionnaireId}`)
          console.log(`friday_callCenter uiUrl: ${uiUrl}`)
          cy.writeFile(b2bBodySave, b2bBody)
          cy.visit(uiUrl,{ log : false })
        })
      })

      const nextButtonLabel ='Weiter'
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

          cy.get('input#insured-email-address-input').type('sivanchevski@soft2run.com',{delay : 100})
          cy.get('input#insured-mobile-phone-number-input').type('+359888779933')
          cy.get('input#insured-first-name-input').type('First name')
          cy.get('input#insured-last-name-input').type('Last name')

          cy.selectSingleList('receive-upload-link-by',0)
          cy.selectSingleList('insured-salutation',1)

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
            cy.get('button[type="submit"]').contains('Link senden').click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    }) //it

    it(`friday_self_service create vin ${$car[0]}`, () => {
      const notificationId = Cypress.env('notificationId')
      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
        Cypress._.merge(header, {'authorization':authorization});
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/friday_self_service?unknownReceiver=true`,
          //url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/wgv_self_service_upload?unknownReceiver=true`,
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
          cy.generateSMS(`${baseUrl_lp}`, 'dekra_sms_self_service_2_customer','friday_self_service')
            if (false){
            const options = {
              method: 'POST',
              url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/friday_self_service`,
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
        }
      })

    })


    it.skip(`friday_self_service execute vin ${$car[0]}`, () => {
      cy.viewport('samsung-note9')
      cy.intercept('GET', `/questionnaire/extended_generic_elements/attachment/*`,{ log: false }).as('clickableCarFri')
      const requestUrl = Cypress.env('requestUrl')
      console.log(`Start ${Cypress.env('templateId')} from url: ${requestUrl}.`)

      cy.visit(requestUrl,{log : false})

      const nextButtonLabel ='Weiter'
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
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02-part-selection'){
          cy.wait('@clickableCarFri',{requestTimeout : $requestTimeout, log : false}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)
            const SVGbody = xhr.response.body;
            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){}

              if (bodyType == 'MPV' || bodyType == 'Hatch3' || bodyType == 'Hatch5' || bodyType == 'Sedan' ||
                  bodyType == 'Coupe' || bodyType == 'Cabrio' || bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine' ||
                  bodyType == 'SUV'){}
            }) //get('@bodyType'

            // if (xhr.response.body.search('g id="hood"') > 0){
            //   cy.selectSVG('hood')
            // }
            const SVGs = ['hood','roof','grill','rightSill','leftSill','leftRearWindow','leftFrontWheelRim']
            SVGs.forEach((svg) => {
              //console.log(svg)
              if (xhr.response.body.search(`g id="${svg}"`) > 0){
                cy.selectSVG(svg)
              }
            });

            //cy.selectSVG('windshield')
            // cy.selectSVG('roof')
            // cy.selectSVG('grill')
            // cy.selectSVG('rightSill')
            // cy.selectSVG('leftSill')
            // cy.selectSVG('leftRearWindow')
            // cy.selectSVG('leftFrontWheelRim')
          }) //wait('@clickableCarFri'
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03-damage-description'){
          // cy.selectSingleList('vehicleStatus-CI1',0)
          // cy.selectSingleList('hood-DS7',0)
          // cy.selectMultipleList('hood-DT2',0)
          // cy.selectMultipleList('roof-DT2',0)
          // cy.selectMultipleList('grill-DT2',0)
          // cy.selectMultipleList('rightSill-DT2',0)
          // cy.selectSingleList('frontZone-HD1',0)

          cy.selectAllSingleLists(0)
          cy.selectAllMultipleList(0)



          // cy.get('div.single-list-container')
          // .should('be.visible')
          // .each(($container, index, $list) => {
          //   //const firstDit = $container
          //   cy.wrap($container)
          //   .find('label.form-check-label').then(labels =>{
          //     //cy.wrap(labels).first().click({ force: true })
          //     cy.wrap(labels).first().invoke('attr','for').then($for => {
          //       console.log(`sls: ${$for.slice(0, -2)}`)
          //       cy.selectSingleList($for.slice(0, -2),0)
          //     })
          //   })
          // })

          // cy.get('div.multiple-list-container')
          // .should('be.visible')
          // .each(($container, index, $list) => {
          //   //const firstDit = $container
          //   cy.wrap($container)
          //   .find('label.form-check-label').then(labels =>{
          //     //cy.wrap(labels).first().click({ force: true })
          //     cy.wrap(labels).first().invoke('attr','for').then($for => {
          //       console.log(`mls : ${$for.slice(0, -2)}`)
          //       cy.selectMultipleList($for.slice(0, -2),0)
          //     })
          //   })
          // })

          //cy.selectSingleList('stopHere',0)

          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04-photos'){
          cy.uploadImage('vehicle-photo-upload-front-view',PathToImages,'vehicle-right-front-photo.jpg')
          cy.uploadImage('vehicle-photo-upload-rear-view',PathToImages,'vehicle-left-rear-photo1.jpg')
          //cy.uploadAllImagesOnPage(PathToImages)
          nextBtn()
        }
      })

      // cy.get('@goingPageId').then(function (aliasValue) {
      //   if (aliasValue == 'page-05'){
      //     cy.uploadImage('odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
      //     nextBtn()
      //   }
      // })

      // cy.get('@goingPageId').then(function (aliasValue) {
      //   if (aliasValue == 'page-06-multi-upload-damaged-parts'){
      //     cy.uploadAllImagesOnPage(PathToImages)
      //     cy.get('form').each(($form, index, $list) => {
      //       cy.wrap($form)
      //       .invoke('attr', 'id')
      //       .then((id) => {
      //         if (id.includes('hood')){
      //           console.log(`$form[${index}] : ${id}.`) //prints id
      //           cy.uploadImage(id,PathToImages,'hood.jpg')
      //           cy.uploadImage(id,PathToImages,'hood.jpg')
      //         }
      //       })
      //     })
      //     //
      //     nextBtn()
      //   }
      // })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          if (executePost2) {
            //pageId: "summary-page"
            cy.selectMultipleList('summary-confirmation-acknowledgement',0)
            cy.get('button[type="submit"]').contains('Unverbindliches Angebot erhalten').click()
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
      cy.GeneratePDFs(['friday_default'])
    }) //it PDF from commands

    it.skip('log browser info', function () {
      console.log(Cypress.browser)
      console.log(Cypress.spec)

      // {
      //   channel: 'stable',
      //   displayName: 'Chrome',
      //   family: 'chromium',
      //   isChosen: true,
      //   majorVersion: 80,
      //   name: 'chrome',
      //   path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      //   version: '80.0.3987.87',
      //   isHeaded: true,
      //   isHeadless: false
      // }
    })



  })  //forEach
}) //describe

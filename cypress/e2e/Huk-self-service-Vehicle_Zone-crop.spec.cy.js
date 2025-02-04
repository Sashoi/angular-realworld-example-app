
/// <reference types="cypress" />

import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBody.json'
import emailBody from '../fixtures/templates/emailBody.json'
import header from '../fixtures/header.json'


const logFilename = 'cypress/fixtures/logs/hukVehicleZone-short.log'
const pdfPath = 'cypress/fixtures/Pdf/'
const PathToImages ='cypress/fixtures/images/'
const b2bBodySave = 'cypress/fixtures/templates/b2bBodyHuk_vehicle_zone_Save.json'

describe('Huk-self-service-Vehicle_Zone', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Login to the app', () =>{
    //cy.viewport('samsung-note9','landscape')
    cy.viewport('samsung-note9')
    cy.intercept('GET', `/questionnaire/*/picture/vehicleZones*`,{ log: false }).as('vehicleZones')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const $requestTimeout = 60000;
  const executePost = false
  const triage_categorys = ["total-loss" , "concrete", "fictitious"]
  const triage_category = triage_categorys[2]
  const insurance_names = ["huk-coburg", "huk24", "default"]
  const insurance_name = insurance_names[0]
  const loss_causes = ["collision", "vandalism", "storm", "glass", "animal"]
  const loss_cause = loss_causes[1]
  const coverage_types = ["comprehensive","liability",""]
  const coverage_type = coverage_types[2]
  const vehicle_body_type_options =  [
            {
              "value": "Sedan",
              "label": "Limousine (viertürig)"
            },
            {
              "value": "SUV",
              "label": "SUV"
            },
            {
              "value": "Station",
              "label": "Kombi (fünftürig)"
            },
            {
              "value": "Hatch5",
              "label": "Schrägheck (fünftürig)"
            },
            {
              "value": "Hatch3",
              "label": "Schrägheck (dreitürig)"
            },
            {
              "value": "Coupe",
              "label": "Coupe (zweitürig)"
            },
            {
              "value": "Cabrio",
              "label": "Cabriolet"
            },
            {
              "value": "Van",
              "label": "VAN"
            },
            {
              "value": "MiniBus",
              "label": "Kleintransporter"
            },
            {
              "value": "PickUpDoubleCabine",
              "label": "Pick-Up (viertürig)"
            },
            {
              "value": "PickUpSingleCabine",
              "label": "Pick-Up (zweitürig)"
            }
          ]
  const vehicle_body_type = 7
  const check_elements_on_page_02 = false
  const event_abroad = '' // yes
  const noVin = false
  const unrepaired_pre_damages = 0 //0 - Yes, 1 -  Nein

  function selectCropImage(selectorId,cropSelectorId,fileName){
    cy.intercept('GET', `/questionnaire/*/attachment/answer/${selectorId}/index-*`,{ log: false }).as(`cropOrigin-${selectorId}`)
    cy.intercept('POST', `/questionnaire/*/attachment/answer/${cropSelectorId}/index-*?locale=de`,{ log: false }).as(`attachmentAnswer-${cropSelectorId}`)
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

      cy.get(`form#${cropSelectorId}`).find(`img[alt="${fileName}"]`).should('exist')
      cy.get(`form#${cropSelectorId}`).find(`img[alt="${fileName}"]`).invoke('attr', 'alt').should('eq', fileName)
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
    [
      "VF7RDRFJF9L510253",
      "Station",
      "01.01.2010",
      "Citroen C5 Limousine 4 türig"
    ]
]
  file1.forEach($car => {
    it(`Huk-self-service-Vehicle_Zone vin : ${$car[0]}`, () =>{

      const $vin = noVin ? "" : $car[0]

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
        const claimNumber = ran1 + "-33-"+ ran2 + "/" + ran3 + "-Z"; //13

        console.log(`claimNumber: ${claimNumber}`);
        console.log(`loss_cause: ${loss_cause}`);
        console.log(`vehicle-body-type: ${vehicle_body_type_options[vehicle_body_type].value}, ${vehicle_body_type_options[vehicle_body_type].label}`);

        b2bBody.qas.find(q => {return q.questionId === "client-insurance-claim-number"}).answer = claimNumber
        b2bBody.qas.find(q => {return q.questionId === "vehicle-vin"}).answer = $vin
        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licenseplate
        b2bBody.qas.find(q => {return q.questionId === "loss-cause"}).answer = loss_cause
        b2bBody.qas.find(q => {return q.questionId === "insurance-name"}).answer = insurance_name
        b2bBody.qas.find(q => {return q.questionId === "huk-coburg-triage-category"}).answer = triage_category
        b2bBody.qas.find(q => {return q.questionId === "event-abroad"}).answer = event_abroad
        //b2bBody.qas.find(q => {return q.questionId === "coverage-type"}).answer = coverage_type
        //b2bBody.qas.find(q => {return q.questionId === "part-selection-type"}).answer = null



        Cypress._.merge(header, {'authorization' : authorization});

        const options = {
          method: 'POST',
          url: `${baseUrl_lp}b2b/integration/huk/huk-comprehensive-self-service-from-call-center-init`,  //huk-comprehensive-self-service-init, huk-comprehensive-self-service-from-call-center-init, huk-liability-self-service-from-call-center-init
          body: b2bBody,
          headers: header
        };

        cy.writeFile(b2bBodySave, b2bBody)

        cy.request(options).then(
          (response) => {
          expect(response.status).to.eq(200)
          const questionnaireId = response.body.questionnaireId;
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

              cy.visit(requestUrl,{log : false});
              //cy.get('.loader').should('not.exist');

              const nextButtonLabel ='Weiter' //'Speichern und Weiter'
              const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
              cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

              currentPage()

              cy.get('@goingPageId').then(function (aliasValue) {
                    if (aliasValue == 'page-01'){
                      if (insurance_name == "huk-coburg"){
                        cy.selectSingleList('terms-of-service-acknowledgement-huk-coburg',0)
                      }
                      if (insurance_name == "huk24"){
                        cy.selectSingleList('terms-of-service-acknowledgement-huk24',0)
                      }
                      if (insurance_name != "huk24" && insurance_name != "huk-coburg" ){
                        cy.selectSingleList('terms-of-service-acknowledgement-default',0)
                      }

                      cy.getBodyType($car,logFilename).then(function (bodyType) {
                        cy.then(function () {
                          questionnaire.bodyType = bodyType
                        })
                      })
                      nextBtn()
                    }
                  })

              //"page-02"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-02'){
                  if (check_elements_on_page_02){
                    cy.get('@goingPageElements').then(function (elements) {
                      console.log(`triage category: ${triage_category}`)
                      console.log(`insurance name: ${insurance_name}`)

                      elements.forEach(element => {
                        let visible = element.visibleExpression
                        if (visible == undefined){
                          visible = true
                        } else {
                          visible = eval(element.visibleExpression)
                        }
                        console.log(`id: ${element.id.padEnd(50, " ")}, visible: ${visible.toString().padEnd(6, " ")}, content: ${element.label.content}`)

                        //Does not work because the same sentences exist in visible and no visible questions.label.content
                        // const contentStrArray = element.label.content.match(/<[^>]+>[^<]*<\/[^>]+>|[^<]+/g);
                        // console.log(contentStrArray);
                        //
                        // if (Array.isArray(contentStrArray) && contentStrArray.length > 0){
                        //   contentStrArray.forEach(str => {
                        //     const $str = str.replace("<b>", '').replace("</b>", '').replace("<li>", '').replace("</li>", '').replace("<br>", '').replace("br>", '')
                        //     if ($str.length > 0){
                        //       if (visible){
                        //         cy.get('div.rootQuestions').contains($str).should('be.visible')
                        //         console.log(`pass true`)
                        //       }else {
                        //         cy.get('div.rootQuestions').contains($str).should('not.exist')
                        //         console.log(`pass false`)
                        //       }
                        //     }
                        //   })
                        // }
                        if (visible){
                          cy.get(`div#${element.id}`).should('be.visible')
                          console.log(`pass true`)
                        }else {
                          cy.get(`div#${element.id}`).should('not.exist')
                          console.log(`pass false`)
                        }
                      })
                    })
                  }
                  nextBtn()
                }
              })

              //"page-03"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-03'){
                  const value = vehicle_body_type_options[vehicle_body_type].value
                  const label = vehicle_body_type_options[vehicle_body_type].label
                  cy.get(`div[title="${label}"]`).find('svg').find('g#selection-mask').click({ force: true})
                  cy.then(function () {
                    questionnaire.bodyType = value
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

              //"page-05"  "internalInformation.spearheadVehicle == null" etc vin =''
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-05'){
                  cy.getQuestionAnswer('event-abroad').then(function (event_abroad) {
                    console.log(`event-abroad : ${event_abroad}`)
                    if (event_abroad == 'yes'){
                      cy.uploadImage('vehicle-registration-ocr-part-1-photo-upload-abroad',PathToImages,'registration-part-1.jpg')
                    } else {
                      cy.uploadImage('vehicle-registration-ocr-part-1-photo-upload',PathToImages,'zulassungsbescheinigung-teil-1-fahrzeugidentifizierungsnummer.png')
                    }
                  })
                  nextBtn()
                }
              })

              //"page-06"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-06'){
                  cy.wait('@vehicleZones',{timeout : $requestTimeout}).then(xhr => {
                    expect(xhr.response.statusCode).to.equal(200)
                    cy.selectSVG_VZ('windshield')
                    cy.selectSVG_VZ('front-center')
                    nextBtn()
                  })
                }
              })

              //"page-07"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-07'){
                  cy.selectSingleList('airbag-deployed',0)
                  cy.selectSingleList('underbody-damage-type2',1)
                  nextBtn()
                }
              })

              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-08'){
                  //"selected-parts-zones"
                  cy.get('div.svg-selection-container[title="Windschutzscheibe"]').click('center');
                  cy.get('div.svg-selection-container[title="Grill"]').click('center');
                  cy.wait(1000);
                  nextBtn()
                }
              })



              //"page-09"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-09'){
                  cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,`registration-part-1.jpg`)
                  nextBtn()
                }
              })

              //"page-10"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-10'){
                  cy.selectSingleList('unrepaired-pre-damages',unrepaired_pre_damages)
                  if (unrepaired_pre_damages == 0){
                    //"selected-zones"
                    cy.wait('@vehicleZones',{requestTimeout : $requestTimeout}).then(xhr => {
                      expect(xhr.response.statusCode).to.equal(200)
                      cy.selectSVG_VZ('front-center')
                      // cy.selectSVG_VZ('front-left')
                      // cy.selectSVG_VZ('front-right')
                      // cy.selectSVG_VZ('side-left')
                      // cy.selectSVG_VZ('side-right')
                      // cy.selectSVG_VZ('rear-left')
                      // cy.selectSVG_VZ('rear-right')
                      // cy.selectSVG_VZ('rear-center')

                      cy.selectSVG_VZ('roof')
                      // cy.selectSVG_VZ('windshield')
                    })
                  }
                  nextBtn()
                }
              })

              //"page-11"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-11'){
                  cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,`interior-front.jpg`)
                  cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,`image dashboard-odometer.jpg`)
                  cy.get('input[data-test="vehicle-mileage-question-type-vehicle-mileage"]').type('123456')
                  nextBtn()
                }
              })

              //"page-12"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-12'){
                  cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,`vehicle-right-front-photo.jpg`)
                  cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,`vehicle-left-rear-photo1.jpg`)
                  nextBtn()
                }
              })

              //"page-13"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-13'){
                  cy.uploadAllImagesOnPage(PathToImages)
                  //cy.uploadImage('damage-photo-upload-overview-vehicle-front-left-top-side',PathToImages,`airbag1.jpg`)
                  //cy.uploadImage('damage-photo-upload-overview-vehicle-front-right-top-side',PathToImages,`airbag2.jpg`)
                  nextBtn()
                }
              })

              //"page-14"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-14'){
                  cy.typeIntoAllTextArea('Anmerkungen zu Nahaufnahme der Beschädigung - 1.\nAnmerkungen zu Nahaufnahme der Beschädigung - 2.\nAnmerkungen zu Nahaufnahme der Beschädigung - 3.')
                  cy.uploadImage('damage-photo-upload-overview-windshield',PathToImages,`broken front window_2.jpg`)
                  selectCropImage('damage-photo-upload-overview-windshield',
                                  'damage-photo-upload-detail-windshield',
                                  `“Windschutzscheibe” - Nahaufnahme der Beschädigung`)

                  cy.uploadImage('damage-photo-upload-overview-grill',PathToImages,`broken front window_2.jpg`)
                  selectCropImage('damage-photo-upload-overview-grill',
                                  'damage-photo-upload-detail-grill',
                                  `“Kühlergrill” - Nahaufnahme der Beschädigung`)
                  nextBtn()
                }
              })

              //"page-15" "pageShowCriteria" 'loss-cause': 'glass'
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-15'){
                  cy.selectAllSingleLists(0)
                  cy.selectAllMultipleList(0)
                  cy.elementExists('div#windshield-damage-location').then((res) => {
                    console.log(res)
                    if (res){
                      cy.selectSVG('zone-d')
                    }
                  })
                  cy.selectAllSingleLists(0)
                  nextBtn()
                }
              })

              //"page-16"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-16'){
                  cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,`hood-npu1.jpg`)
                  nextBtn()
                }
              })

              //"page-17"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-17'){
                  //cy.uploadImage('police-ranger-report-photo-upload',PathToImages,`police-ranger-report-photo-upload.png`)
                  //cy.uploadImage('incident-location-photo-upload',PathToImages,`incident-location-photo-upload-1.jpg`)

                  nextBtn()
                }
              })

              //"page-18"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-18'){
                  cy.getQuestionAnswer('loss-cause').then(function (loss_cause) {
                    console.log(`loss-cause : ${loss_cause}`);
                    if(loss_cause == 'animal' || loss_cause == 'collision'){
                      if(loss_cause == 'animal'){
                        cy.selectSingleList('collision-with-animal',0)
                        cy.get('textarea#collision-with-animal-description-textarea').type('collision-with-animal-description - 1.\ncollision-with-animal-description - 2.')
                      }
                      if(loss_cause == 'collision'){
                        cy.selectSingleList('loss-circumstances',0)
                        cy.get('textarea#loss-circumstances-description-other-textarea').type('loss-circumstances-description-other - 1.\nloss-circumstances-description-other - 2.')
                      }
                    }
                  })

                  nextBtn()
                }
              })

              //"page-19"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-19'){
                  cy.getQuestionAnswer('event-abroad').then(function (event_abroad) {
                    console.log(`event-abroad : ${event_abroad}`)
                    if (event_abroad == 'yes'){
                      cy.selectSingleList('vehicle-location-salutation',1)
                      cy.get('input#vehicle-location-street-name-input').type(`Vasil Levski`)
                      cy.get('input#vehicle-location-street-number-input').type(`13 A 1`)
                      cy.get('input#vehicle-location-city-input').type(`Sofia`)
                    } else {
                      cy.selectSingleList('vehicle-location-equals-home-address',0)
                    }
                  })
                  nextBtn()
                }
              })

              //"page-20"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-20'){ // this is a bug, must be page-20
                  cy.get('textarea#additional-remarks-textarea').type('Weitere Anmerkungen  - 1.\nWeitere Anmerkungen  - 2.\nWeitere Anmerkungen  - 3.')
                  nextBtn()
                }
              })

              //"summary-page"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'summary-page'){
                  if(executePost){
                    //cy.postQuestionnaire() does not work
                    cy.get('button[type="submit"][data-test="questionnaire-complete-button"]').click({ force: true, timeout: 5000 });

                    cy.wait('@postPost',{timeout : $requestTimeout}).then(xhr => {
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
    }) //it Huk

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['dekra_schadenbilder','dekra_abschlussbericht'])
    }) //it PDF from commands

    it.skip(`huk_comprehensive_self_service_vehicle_zones_vi create vin ${$car[0]}`, () => {
      const notificationId = Cypress.env('notificationId')
      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
        Cypress._.merge(header, {'authorization':authorization});
        emailBody.emailTemplate = 'huk_start_self_service'
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/huk_comprehensive_self_service_vehicle_zones_vi`,
          body : emailBody,
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
            console.log(`templateId : ${templateId}`);
            Cypress.env('templateId', templateId)
            console.log(`requestUrl : ${requestUrl}`);
            Cypress.env('requestUrl', requestUrl)

            //executeQuestionnaire(requestUrl,$car,true)
            //cy.printRequestedInformation(response.body.requestedInformation);
        })
      })
    })

    it(`Generate Emails for ${$car[0]}`, function () {
      //huk_request_information, huk_request_information_reminder_16h, huk_request_information_reminder_32h, huk_request_information_reminder_cancellation,
      //huk_request_information_reminder_completion
      cy.GenerateEmails(['huk_request_information_reminder_32h'],'huk_self_service')
    })
  }) //forEach
})  //describe

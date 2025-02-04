/// <reference types="cypress" />
import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/templates/b2bBody.json'
import header from '../fixtures/header.json'

const logFilename = 'cypress/fixtures/logs/hukClickableCar.log'
const pdfPath = 'cypress/fixtures/Pdf/'
const PathToImages ='cypress/fixtures/images/'
const b2bBodySave = 'cypress/fixtures/templates/b2bBodyHuk_clickable_car_Save.json'

describe('Huk_comprehensive_self_service_clickable_car', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    cy.viewport('samsung-note9')
    cy.intercept('GET', `/questionnaire/generic_elements/attachment/*-example?size=original&locale=de`).as('generic_elements')
                      // /questionnaire/generic_elements/attachment/sedan-selection-example?size=original&locale=de
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000
  const executePost = true
  const generatePdfCondition = executePost && true
  const newPhoneNumber = `+3598887950`
  const $equipment_2_loading_doors = true
  const initOnly = false
  const triage_category = "concrete" // "total-loss" , "concrete", "fictitious"
  const insurance_name = "default"// "huk-coburg", "huk24", "default"

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  function executeQuestionnaire(requestUrl,$car,hood3) {
    cy.visit(requestUrl, {log : false})

    const nextButtonLabel ='Weiter' //Speichern und Weiter
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

    //pageId: "page-02"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-02'){
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
            console.log(`id: ${element.id.padEnd(50, " ")}, visible: ${visible.toString().padEnd(5, " ")}, content: ${element.label.content}`)
          })
        })
        nextBtn()
      }
    })

    //pageId: "page-03"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-03'){
        cy.wait(['@generic_elements','@generic_elements','@generic_elements','@generic_elements','@generic_elements',
        '@generic_elements','@generic_elements','@generic_elements','@generic_elements','@generic_elements','@generic_elements'],
        {requestTimeout : $requestTimeout}).then(xhr => {
          cy.get('div[title="VAN"]').find('g#Layer_4').click({ force: true, timeout: 3000 })
        })
        cy.then(function () {
          questionnaire.bodyType = 'Van'
        })
        nextBtn()
      }
    })

    //pageId: before "page-04" must check (supportInformation('bodyType')
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

    //pageId:"page-05" SVG
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-05'){
        cy.get('@goingPageElements').then(function (elements) {
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
                //cy.wrap($path).click({ force: true, multiple: true, timeout : 4000 }) select all
                //cy.wrap($path).find('#hood').click({ force: true, timeout : 4000 }) does not work ??
                cy.get('div.clickMaskContainer').find('svg',{timeout: 10000}).find('path#hood').click({ force: true, timeout : 4000 })
                cy.wait(4000)
              }
            })
          } else {
              //clickableCar 2D
              cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
                expect(xhr.response.statusCode).to.equal(200)
                console.log(`Comming SVG with clickableCar`)
                const SVGbody = xhr.response.body;
                //exhaust
                cy.selectSVG('exhaust')


                //towing-hook if check does not calc iBox
                if (false){
                  cy.selectSVG('towing-hook')
                }

                //underbody  if check does not calc iBox
                //cy.selectSVG('underbody`)

                //airbag
                cy.selectSVG('airbag')


                //right-taillight
                cy.selectSVG('right-taillight')

                //hood
                cy.selectSVG('hood')

                //roof
                cy.selectSVG('roof')

                //windshield
                cy.selectSVG('windshield')

                cy.get('@bodyType').then(function (bodyType) {
                  if (bodyType == 'MiniBusMidPanel' || bodyType == 'VanMidPanel' || bodyType == 'Van' || bodyType == 'MiniBus'){
                    if ($equipment_2_loading_doors){
                      cy.selectSVG('right-load-door')
                      cy.selectSVG('left-load-door')
                      //cy.selectSVG('left-rear-door-window')
                      //cy.selectSVG('right-rear-door-window')
                    } else {
                      cy.selectSVG('tailgate')
                    }
                  }
                })
              })
          }
          nextBtn()
        })
      }
    })

    //"page-06"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-06'){
        cy.uploadImage('vehicle-registration-part-1-photo-upload',PathToImages,'registration-part-1.jpg')
        nextBtn()
        cy.wait(1000)
      }
    })

    //"page-07"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-07'){
        cy.selectSingleList('unrepaired-pre-damages',0)
        nextBtn()
        cy.wait(1000)
      }
    })

    //"page-08"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-08'){
        cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,'interior-front.jpg')
        cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
        cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type('123321')
        nextBtn()
      }
    })

    //"page-09"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-09'){
        cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
        cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
        nextBtn()
      }
    })


    //"page-10"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-10'){
        if (false){
          cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
          if (hood3){
            cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
            cy.uploadImage('damage-photo-upload-overview-hood',PathToImages,'hood.jpg')
          }
          cy.uploadImage('damage-photo-upload-detail-hood',PathToImages,'hood-d.jpg')
          if (hood3){
            cy.uploadImage('damage-photo-upload-detail-hood',PathToImages,'hood-d.jpg')
            cy.uploadImage('damage-photo-upload-detail-hood',PathToImages,'hood-d.jpg')
          }

          cy.uploadImage('damage-photo-upload-overview-exhaust',PathToImages,'broken exhaust_1.jpg')
          cy.uploadImage('damage-photo-upload-detail-exhaust',PathToImages,'broken exhaust_2.jpg')
          cy.uploadImage('damage-photo-upload-overview-right-taillight',PathToImages,'right-taillight-o.jpg')
          cy.uploadImage('damage-photo-upload-detail-right-taillight',PathToImages,'right-taillight-d.jpg')



          cy.uploadImage('damage-photo-upload-overview-roof',PathToImages,'roof.jpg')
          cy.uploadImage('damage-photo-upload-detail-roof',PathToImages,'roof-d.jpg')

          cy.uploadImage('damage-photo-upload-overview-windshield',PathToImages,'broken front window_2.jpg')
          cy.uploadImage('damage-photo-upload-detail-windshield',PathToImages,'broken front window_1.jpg')

          cy.get('@bodyType').then(function (bodyType) {
            if (bodyType == 'MiniBusMidPanel' || bodyType == 'VanMidPanel' || bodyType == 'Van' || bodyType == 'MiniBus'){
              if ($equipment_2_loading_doors){
                //cy.uploadImage('damage-photo-upload-overview-left-rear-door-window',PathToImages,'airbag.jpg')
                //cy.uploadImage('damage-photo-upload-detail-left-rear-door-window',PathToImages,'airbag.jpg')
                //cy.uploadImage('damage-photo-upload-overview-right-rear-door-window',PathToImages,'airbag.jpg')
                //cy.uploadImage('damage-photo-upload-detail-right-rear-door-window',PathToImages,'airbag.jpg')
                cy.uploadImage('damage-photo-upload-overview-left-load-door',PathToImages,'airbag.jpg')
                cy.uploadImage('damage-photo-upload-detail-left-load-door',PathToImages,'airbag.jpg')
                cy.uploadImage('damage-photo-upload-overview-right-load-door',PathToImages,'airbag.jpg')
                cy.uploadImage('damage-photo-upload-detail-right-load-door',PathToImages,'airbag.jpg')
              } else {
                cy.uploadImage('damage-photo-upload-overview-tailgate',PathToImages,'airbag.jpg')
                cy.uploadImage('damage-photo-upload-detail-tailgate',PathToImages,'airbag.jpg')
              }
            }
          })
        }
        cy.uploadAllImagesOnPage(PathToImages,6000)
        nextBtn()
      }
    })

    //page-11
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-11'){
        cy.get('@is3Dcar').then(function (is3Dcar) {
          if (is3Dcar){
            cy.selectAllSingleLists(0)
            cy.selectAllMultipleList(0)
          } else {
            cy.selectSingleList('right-taillight-equipment-led-rear-lights',0)
            cy.selectMultipleList('hood-damage-type',0)
            cy.selectMultipleList('roof-damage-type',0)
            cy.selectSingleList('windshield-equipment-windshield-electric',0)
            cy.selectMultipleList('windshield-damage-type',0)
            cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',0)
            cy.selectSVG('zone-a')
            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBusMidPanel' || bodyType == 'VanMidPanel' || bodyType == 'Van' || bodyType == 'MiniBus') {
                cy.selectSingleList('loading-floor-area-bend', 0)
                if ($equipment_2_loading_doors ){
                  cy.selectMultipleList('left-load-door-damage-type', 0)
                  cy.selectMultipleList('left-load-door-damage-type', 1)
                  cy.selectSingleList('left-load-door-damage-size', 2)

                  cy.selectMultipleList('right-load-door-damage-type', 0)
                  cy.selectMultipleList('right-load-door-damage-type', 1)
                  cy.selectSingleList('right-load-door-damage-size', 2)
                } else {
                  cy.selectSingleList('tailgate-still-open-close-easily', 0)
                  cy.selectMultipleList('tailgate-damage-type', 1)
                  cy.selectSingleList('tailgate-damage-size', 0)
                }
              }
            })
          }
        })

        nextBtn()
      }
    })

    //"page-12"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-12'){
        cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu1.jpg')
        cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu2.jpg')
        cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu3.jpg')
        nextBtn()
      }
    })

    //"page-13"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-13'){
        cy.getQuestionAnswer('loss-cause').then(function (loss_cause_l) {
          console.log(`loss-cause : ${loss_cause_l}`);
          if(loss_cause_l == 'animal'){
            cy.uploadImage('police-ranger-report-photo-upload',PathToImages,'police-ranger-report-photo-upload.png')
          }
        })

        cy.uploadImage('incident-location-photo-upload',PathToImages,'incident-location-photo-upload-1.jpg')
        cy.uploadImage('incident-location-photo-upload',PathToImages,'incident-location-photo-upload-2.jpg')
        cy.uploadImage('incident-location-photo-upload',PathToImages,'incident-location-photo-upload-3.jpg')
        nextBtn()
      }
    })

    //"page-14"  "(hasAnswer('huk-coburg-triage-category', 'fictitious') && (hasAnswer('loss-cause','animal') || hasAnswer('loss-cause','collision')))"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-14'){
        // "collision-with-animal",
        // "collision-with-animal-description",
        // "loss-circumstances",
        // "loss-circumstances-description-other",
        // "loss-circumstances-description-other-mandatory"
        nextBtn()
      }
    })

    //"page-15"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-15'){
        cy.selectSingleList('vehicle-location-equals-home-address',0)
        nextBtn()
      }
    })

    //"page-16"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'page-16'){
        cy.get('textarea#additional-remarks-textarea').type('Weitere Anmerkungen  - 1./nWeitere Anmerkungen  - 2./nWeitere Anmerkungen  - 3.')
        nextBtn()
      }
    })


    //"summary-page"
    cy.get('@goingPageId').then(function (aliasValue) {
      if (aliasValue == 'summary-page'){
        if(executePost){
          cy.get('button[type="submit"]').contains('Schadenmeldung senden').click({ force: true, timeout: 1000 })
          cy.wait('@postPost',{requestTimeout : $requestTimeout, responseTimeout: $requestTimeout}).then(xhr => {
            cy.postPost(xhr,false)
          })
          if (generatePdfCondition){
            console.log(`Cypress.env('notificationId') = ${Cypress.env('notificationId')}`)
          }
        }
      }
    })
  }

  const loss_causes = ["collision", "vandalism", "storm", "glass", "animal"]

  const file1 = [
    ["U5YPH816HML010002", "SUV", "01.09.2020", "3D Kia Sportage"]
  ]

  file1.forEach($car => {
    it.only(`Huk-comprehensive-self-service-clickable-car vin :  ${$car[0]}`, function () {

      const vin = $car[0]
      const loss_cause = loss_causes[0]

      let ran2 =  getRandomInt(10,99)
      let ran3 =  getRandomInt(100,999)
      let ran6 =  getRandomInt(100000,999999)

      let claimNumber = ran2 + "-33-"+ ran3 + "/" + ran6 + "-S";

      let licenseplate = `HSS ${getRandomInt(1,9)}-${getRandomInt(100,999)}`

      console.log(`vin:${vin}`)
      console.log(`loss cause:${loss_cause}`)

      cy.authenticate().then(function (authorization) {

        cy.then(function () {
          questionnaire.authorization = authorization
        })

        b2bBody.qas.find(q => {return q.questionId === "client-insurance-claim-number"}).answer = claimNumber
        b2bBody.qas.find(q => {return q.questionId === "vehicle-vin"}).answer = vin
        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licenseplate
        b2bBody.qas.find(q => {return q.questionId === "part-selection-type"}).answer = 'clickable-car' //'vehicle-zones'
        b2bBody.qas.find(q => {return q.questionId === "client-mobile-phone-number"}).answer = newPhoneNumber
        b2bBody.qas.find(q => {return q.questionId === "client-phone-number"}).answer = newPhoneNumber
        b2bBody.qas.find(q => {return q.questionId === "loss-cause"}).answer = loss_cause
        b2bBody.qas.find(q => {return q.questionId === "insurance-name"}).answer = insurance_name
        b2bBody.qas.find(q => {return q.questionId === "huk-coburg-triage-category"}).answer = triage_category


        Cypress._.merge(header, {'authorization' : authorization});

        const options = {
              method: 'POST',
              url: `${baseUrl_lp}b2b/integration/huk/huk-comprehensive-self-service-init`,
              body: b2bBody,
              headers: header
        };
        cy.request(options).then(
          (response) => {
          // response.body is automatically serialized into JSON
          expect(response.status).to.eq(200) // true
          const questionnaireId = response.body.questionnaireId;
          console.log(`self-service-init questionnaireId: ${questionnaireId}`)
          cy.writeFile(b2bBodySave, b2bBody)

          const options2 = {
            method: 'GET',
            url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
            headers: header
          };
          cy.wait(5000) // time to create DN and send link via e-mail
          cy.request(options2).then(
            (response2) => {
            expect(response2.status).to.eq(200) // true
            console.log('supportInformation: '+JSON.stringify(response2.body.supportInformation))
            const damageNotificationId = response2.body.supportInformation.damageNotificationId
            cy.then(function () {
              questionnaire.notificationId = damageNotificationId
            })
            Cypress.env('notificationId', damageNotificationId)

            if (!initOnly){
              const options3 = {
                method: 'GET',
                url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
                headers: header
              }
              cy.request(options3).then(
                (response3) => {
                expect(response3.status).to.eq(200) // true
                const requestUrl = response3.body.body.requestedInformation[0].requestUrl;
                const questionnaireId2 = response3.body.body.requestedInformation[0].questionnaireId;
                console.log(`Real questionnaireId: ${questionnaireId2}`)
                cy.then(function () {
                  questionnaire.Id = questionnaireId2
                })
                console.log(`requestUrl : ${requestUrl}`)

                executeQuestionnaire(requestUrl,$car,false)
              })
            }
          })
        })
      })
    }) //it Huk

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

    it(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      cy.GeneratePDFs(['dekra_schadenbilder','dekra_abschlussbericht'])
    }) //it PDF from commands

    it.skip(`huk_comprehensive_self_service_clickable_car create vin ${$car[0]}`, () => {
      const notificationId = Cypress.env('notificationId')
      cy.authenticate().then(function (authorization) {
        cy.then(function () {
          questionnaire.authorization = authorization
        })
        Cypress._.merge(header, {'authorization':authorization});
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/huk_comprehensive_self_service_clickable_car`,
          body : `{
            "receiver": "+3598887950",
            "contact": {
              "firstName": "first name",
              "lastName": "lastName",
              "mobileNumber": "+3598887950",
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
            console.log(`templateId : ${templateId}`);
            Cypress.env('templateId', templateId)
            console.log(`requestUrl : ${requestUrl}`);
            Cypress.env('requestUrl', requestUrl)

            executeQuestionnaire(requestUrl,$car,true)
            //cy.printRequestedInformation(response.body.requestedInformation);
        })
      })
    })

    it.skip(`Generate Emails for ${$car[0]}`, function () {
      //huk_request_information, huk_request_information_reminder_16h, huk_request_information_reminder_32h, huk_request_information_reminder_cancellation,
      //huk_request_information_reminder_completion
      cy.GenerateEmails(['huk_request_information', 'huk_request_information_reminder_16h', 'huk_request_information_reminder_32h', 'huk_request_information_reminder_cancellation',
        'huk_request_information_reminder_completion'],'huk_comprehensive_self_service_clickable_car')
    })



 }) //forEach
})  //describe

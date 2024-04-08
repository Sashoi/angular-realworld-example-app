/// <reference types="cypress" />
import { getRandomInt } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import b2bBody from '../fixtures/b2bBody.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/hukClickableCar.log'
const pdfPath = 'cypress/fixtures/Pdf/'

describe('Huk_comprehensive_self_service_clickable_car', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () =>{
    //cy.loginToApplication()
    console.clear()
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPage')
    cy.intercept('GET', `/questionnaire/*/currentPage?offset=*&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*//picture/clickableCar*`).as('clickableCar')
    cy.intercept('GET', `/questionnaire/generic_elements/attachment/*-example*`).as('generic_elements')
    cy.intercept('POST', '/questionnaire/*/page/page-*', (req) => {
      if (req.url.includes('navigateTo')) {
        req.alias = "nextPage"
      } else {
        req.alias = "savePage"
      }
    })
    cy.intercept('POST', `/member/oauth/token`).as('token')
    cy.wrap(goingPage).its('pageId').as('goingPageId')
    cy.wrap(goingPage).its('elements').as('goingPageElements')
    cy.wrap(questionnaire).its('Id').as('questionnaireId')
    cy.wrap(questionnaire).its('authorization').as('authorization')
    cy.wrap(questionnaire).its('bodyType').as('bodyType')
    cy.wrap(questionnaire).its('notificationId').as('notificationId')
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000
  const executePost = true
  const generatePdfCondition = true

  function _waitFor(waitFor) {
    if (waitFor == '@nextPage'){
      cy.get('@nextBtn').click({ force: true })
    }
    cy.wait(waitFor,{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const gPage = xhr.response.body.pageId
        let title = xhr.response.body.pageTitle
        if ((title.length <= 2)){
          title = xhr.response.body.uiBlocks[0].label.content
          if ((title.length <= 2)){
            if (title = xhr.response.body.uiBlocks[0].elements.sections.length > 0){
              title = xhr.response.body.uiBlocks[0].elements.sections[0].label.content
            }
          }
        }
        console.log(`Comming page ${gPage} - ${title}.`)
        cy.then(function () {
          goingPage.elements = []
        })
        //printQuestionnaireIds(xhr.response.body.elements)
        cy.then(function () {
          goingPage.pageId = gPage
        })
        if (false && waitFor == '@currentPage'){
          const nextUrl = xhr.response.body.links.next
          //"https://dev02.spearhead-ag.ch:443/questionnaire/7uRjDM92M9eWEhZVkBrSr/page/page-01?navigateTo=next"
          const startStr = '/questionnaire/'
          const endStr = '/page/page'
          const pos = nextUrl.indexOf(startStr) + startStr.length;
          const questionnaireId =  nextUrl.substring(pos, nextUrl.indexOf(endStr, pos));
          cy.then(function () {
            questionnaire.Id = questionnaireId
          })
          console.log(`questionnaireId: ${questionnaireId}`)
        }
    })
  }

  function nextBtn() {
    _waitFor('@nextPage')
  }

  function currentPage() {
    _waitFor('@currentPage')
  }

  const file1 = [
    ["6FPGXXMJ2GEL59891","PickUpSingleCabine",  "01.01.2012","Ford Ranger single cabine, Pick-up"]
  ]

  file1.forEach($car => {
    it(`Huk-comprehensive-self-service-clickable-car vin :  ${$car[0]}`, function () {

      const vin = $car[0]

      const userCredentials =  {
        "password": Cypress.env("passwordHukS"),
        "remoteUser": "",
        "sessionLanguage": "en",
        "userName": Cypress.env("usernameHukS")
      }

      let ran1 =  getRandomInt(10,99)
      let ran2 =  getRandomInt(100,999)
      let ran3 =  getRandomInt(100000,999999)

      let claimNumber = ran1 + "-33-"+ ran2 + "/" + ran3 + "-S";

      let licenseplate = `HSS ${getRandomInt(1,9)}-${getRandomInt(100,999)}`

      const $equipment_2_loading_doors = true
      const selectAllParts = false


      console.log(`vin:${vin}`)
      cy.request('POST',`https://${$dev}.spearhead-ag.ch/member/authenticate`,userCredentials)
      .its('body').then(body => {

        const token = body.accessToken
        cy.then(function () {
          questionnaire.authorization = `Bearer ${token}`
        })

        b2bBody.qas.find(q => {return q.questionId === "client-insurance-claim-number"}).answer = claimNumber
        b2bBody.qas.find(q => {return q.questionId === "vehicle-vin"}).answer = vin
        b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = licenseplate
        b2bBody.qas.find(q => {return q.questionId === "part-selection-type"}).answer = 'clickable-car'

        const b2bBody1 =  {
          "qas": [
              {
                  "questionId": "role-type",
                  "answer": ["client"]
              },
              {
                  "questionId": "accident-date",
                  "answer": ["2020-01-01"]
              },
              {
                  "questionId": "loss-cause",
                  "answer": ["animal"]
              },
              {
                  "questionId": "loss-circumstances",
                  "answer": ["rear-end-collision"]
              },
              {
                  "questionId": "client-insurance-claim-number",
                  "answer": [claimNumber]
              },
              {
                  "questionId": "animal-species",
                  "answer": ["fox"]
              },
              {
                  "questionId": "huk-coburg-triage-category",
                  "answer": ["total-loss"]
              },
              {
                  "questionId": "client-insurance-policy-number",
                  "answer": ["123456789X"]
              },
              {
                  "questionId": "insurance-policy-type",
                  "answer": "select"
              },
              {
                  "questionId": "insurance-name",
                  "answer": ["huk-coburg"]
              },
              {
                  "questionId": "client-zip-code",
                  "answer": ["96450"]
              },
              {
                  "questionId": "client-country",
                  "answer": ["DE"]
              },
              {
                  "questionId": "vehicle-vin",
                  "answer": [vin]
              },
              {
                  "questionId": "vehicle-first-registration-date",
                  "answer": ["2019-10-01"]
              },
              {
                  "questionId": "client-vehicle-license-plate",
                  "answer": [licenseplate]
              },
              {
                  "questionId": "vehicle-financed",
                  "answer": ["yes"]
              },
              {
                  "questionId": "vehicle-leased",
                  "answer": ["no"]
              },
              {
                  "questionId": "vehicle-owner-entitled-for-pre-tax-deduction",
                  "answer": ["no"]
              },
              {
                  "questionId": "client-email",
                  "answer": ["yourEmail@soft2run.com"]
              },
              {
                  "questionId": " vehicle-location-zip-code",
                  "answer": ["22222"]
              },
              {
                  "questionId": "client-mobile-phone-number",
                  "answer": ["123654789"]
              },
              {
                  "questionId": "part-selection-type",
                  "answer": ["clickable-car"]
              }
          ],
          "supportInformation": null,
          "readOnlyQuestions": null
        }

        //const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
        const authorization = `Bearer ${token}`;
        const headers_1 = {
          'Accept': '*/*',
          'Accept-Encoding':'gzip, deflate, br',
          'Content-Type': 'application/json',
          authorization,
        }
        const options = {
              method: 'POST',
              url: `${baseUrl_lp}b2b/integration/huk/huk-comprehensive-self-service-init`,
              body: b2bBody,
              headers: headers_1
        };
        cy.request(options).then(
          (response) => {
          // response.body is automatically serialized into JSON
          expect(response.status).to.eq(200) // true
          const questionnaireId = response.body.questionnaireId;
          console.log(`self-service-init questionnaireId: ${questionnaireId}`)

          const options2 = {
            method: 'GET',
            url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
            headers: headers_1
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

            const options3 = {
              method: 'GET',
              url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
              headers: headers_1
            }
            cy.request(options3).then(
              (response3) => {
              expect(response3.status).to.eq(200) // true
              const questionnaireUrl = response3.body.body.requestedInformation[0].requestUrl;
              const questionnaireId2 = response3.body.body.requestedInformation[0].questionnaireId;
              console.log(`Real questionnaireId: ${questionnaireId2}`)
              cy.then(function () {
                questionnaire.Id = questionnaireId2
              })
              console.log(`questionnaireUrl: ${questionnaireUrl}`)
              cy.visit(questionnaireUrl)

              const nextButtonLabel ='Speichern und Weiter'
              const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
              cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

              currentPage()

              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-01'){
                  cy.selectMultipleList('terms-of-service-acknowledgement-huk-coburg',0)
                  nextBtn()
                }
              })

              //pageId: "page-02"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-02'){
                  nextBtn()
                }
              })

              //pageId: "page-03"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-03'){
                  cy.wait(['@','@generic_elements','@generic_elements','@generic_elements','@generic_elements',
                  '@generic_elements','@generic_elements','@generic_elements','@generic_elements','@generic_elements','@generic_elements'],
                  {requestTimeout : $requestTimeout}).then(xhr => {
                    cy.get('div[title="VAN"]').find('g#Layer_4').click({ force: true })
                    cy.wait(3000)
                  })
                  nextBtn()
                }
              })

              cy.getBodyType($car,logFilename).then(function (bodyType) {
                cy.then(function () {
                  questionnaire.bodyType = bodyType
                })
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
                  cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
                    expect(xhr.response.statusCode).to.equal(200)
                    console.log(`Comming SVG with clickableCar`)
                    const SVGbody = xhr.response.body;
                  })

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

                  if (selectAllParts) {

                    //left-taillight
                    cy.selectSVG('left-taillight')


                    //right-mirror
                    cy.selectSVG('right-mirror')

                    //left-mirror
                    cy.selectSVG('left-mirror')

                    //right-front-wheel
                    cy.selectSVG('right-front-wheel')


                    //right-rear-wheel
                    cy.selectSVG('right-rear-wheel')


                    //right-front-wheel-tire
                    cy.selectSVG(`right-front-wheel-tire`)

                    //right-rear-wheel-tire
                    cy.selectSVG(`right-rear-wheel-tire`)

                    //left-front-wheel
                    cy.selectSVG(`left-front-wheel`)


                    //left-front-wheel-tire
                    cy.selectSVG(`left-front-wheel-tire`)

                    //left-rear-wheel
                    cy.selectSVG(`left-rear-wheel`)


                    //left-rear-wheel-tire
                    cy.selectSVG(`left-rear-wheel-tire`)

                    //right-headlight
                    if (true && vin != "WAUZZZ4B73N015435") { //for this vin questions are pre-answered
                      cy.selectSVG(`right-headlight`)

                    }
                    if (true && vin == "WAUZZZ4B73N015435") {
                      cy.selectSVG(`right-headlight`)
                    }

                    //left-headlight
                    if (true && vin != "WAUZZZ4B73N015435") {  ////for this vin questions are pre-answered
                      cy.selectSVG(`left-headlight`)
                    }
                    if (true && vin == "WAUZZZ4B73N015435") {  ////for this vin questions are pre-answered
                      cy.selectSVG(`left-headlight`)
                    }

                    //grill
                    cy.selectSVG('grill')


                    //right-front-additional-light
                    cy.selectSVG(`right-front-additional-light`)

                    //left-front-additional-light
                    cy.selectSVG(`left-front-additional-light`)

                    //left-front-fender
                    cy.selectSVG(`left-front-fender`)


                    //right-front-fender
                    cy.selectSVG('right-front-fender')


                    //form_def or front_bumper_gray or front-bumper
                    if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666"){
                      cy.selectSVG('form_def')
                    }
                    if (vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845" || vin == "WF0KXXTTRKMC81361"){
                      cy.selectSVG('front-bumper')
                    }
                    if (vin == "VF3VEAHXKLZ080921" || vin == "6FPPXXMJ2PCD55635"){
                      cy.selectSVG('front-bumper')
                    }

                    //left-front-door
                    cy.selectSVG('left-front-door')

                    //left-front-door_window_and_handle
                    cy.selectSVG('left-front-door-window')

                    //right-front-door
                    cy.selectSVG('right-front-door')


                    //right-front-door_window_and_handle
                    cy.selectSVG('right-front-door-window')

                    //left-rear-door
                    if (vin == "WVWZZZ6RZGY304402" || vin == "WAUZZZ4B73N015435" || vin == "WF0KXXTTRKMC81361"){
                      cy.selectSVG('left-rear-door')

                    }

                    //left-rear-door-window
                    if (vin != "VF3VEAHXKLZ080921" && vin != "WF0KXXTTRKMC81361"){
                      cy.selectSVG('left-rear-door-window')
                    }

                    //right-rear-door
                    if (vin == "WVWZZZ6RZGY304402" || vin == "WAUZZZ4B73N015435"){
                      cy.selectSVG('right-rear-door')
                    }

                    //right-rear-door
                    if (vin == "6FPPXXMJ2PCD55635"){
                      cy.selectSVG('right-rear-door')
                    }

                    //right-rear-door-window
                    if (vin != "VF3VEAHXKLZ080921" && vin != "WF0KXXTTRKMC81361"){
                      cy.selectSVG('right-rear-door-window')
                    }

                    //left-sill
                    cy.selectSVG('left-sill')


                    //right-sill
                    cy.selectSVG('right-sill')


                    //tailgate and rear-window
                    if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666" || vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845" || vin == "6FPPXXMJ2PCD55635"){
                      cy.selectSVG('rear-window')
                      cy.selectSVG('tailgate')
                    }

                    //load-doors and rear-windows
                    if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361"){
                      cy.selectSVG('right-load-door')
                      cy.selectSVG('left-load-door')
                      cy.selectSVG('left-rear-door-window')
                      cy.selectSVG('right-rear-door-window')
                    }


                    //rear-bumper
                    cy.selectSVG('rear-bumper')

                    //left-rear-side-panel
                    cy.selectSVG('left-rear-side-panel')

                    //right-rear-side-panel
                    cy.selectSVG('right-rear-side-panel')


                    //left-rear-door
                    if (vin == "VF3VEAHXKLZ080921" || vin == "6FPPXXMJ2PCD55635"){
                      cy.selectSVG('left-rear-door')
                    }

                    //right-middle-side-panel
                    if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361"){
                      cy.selectSVG('right-middle-side-panel')
                    }
                  }
                  nextBtn()
                }
              })

              const PathTo ='D://Projects/Cypress/bondar-artem/angular-realworld-example-app/cypress/fixtures/'

              //"page-06"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-06'){
                  cy.uploadImage('vehicle-registration-part-1-photo-upload',PathTo,'registration-part-1.jpg')
                  nextBtn()
                  cy.wait(1000)
                }
              })

              //"page-07"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-07'){
                  cy.uploadImage('vehicle-interior-front-photo-upload',PathTo,'interior-front.jpg')
                  cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathTo,'image dashboard-odometer.jpg')
                  cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type('123321')
                  nextBtn()
                }
              })

              //"page-08"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-08'){
                  cy.uploadImage('vehicle-right-front-photo-upload',PathTo,'vehicle-right-front-photo.jpg')
                  cy.uploadImage('vehicle-left-rear-photo-upload',PathTo,'vehicle-left-rear-photo1.jpg')
                  nextBtn()
                }
              })

              //"page-09"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-09'){
                  cy.selectSingleList('unrepaired-pre-damages',0)
                  nextBtn()
                }
              })

              //"page-10"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-10'){
                  cy.uploadImage('damage-photo-upload-overview-exhaust',PathTo,'broken exhaust_1.jpg')
                  cy.uploadImage('damage-photo-upload-detail-exhaust',PathTo,'broken exhaust_2.jpg')
                  cy.uploadImage('damage-photo-upload-overview-right-taillight',PathTo,'right-taillight-o.jpg')
                  cy.uploadImage('damage-photo-upload-detail-right-taillight',PathTo,'right-taillight-d.jpg')

                  cy.uploadImage('damage-photo-upload-overview-hood',PathTo,'hood.jpg')
                  cy.uploadImage('damage-photo-upload-detail-hood',PathTo,'hood-d.jpg')

                  cy.uploadImage('damage-photo-upload-overview-roof',PathTo,'roof.jpg')
                  cy.uploadImage('damage-photo-upload-detail-roof',PathTo,'roof-d.jpg')

                  cy.uploadImage('damage-photo-upload-overview-windshield',PathTo,'broken front window_2.jpg')
                  cy.uploadImage('damage-photo-upload-detail-windshield',PathTo,'broken front window_1.jpg')

                  nextBtn()
                }
              })

              //page-11
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-11'){
                  cy.selectSingleList('right-taillight-equipment-led-rear-lights',0)
                  cy.selectMultipleList('hood-damage-type',0)
                  cy.selectMultipleList('roof-damage-type',0)
                  cy.selectSingleList('windshield-equipment-windshield-electric',0)
                  cy.selectMultipleList('windshield-damage-type',0)
                  cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',0)
                  cy.selectSVG('zone-a')
                  cy.get('@bodyType').then(function (bodyType) {
                    if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                      cy.selectSingleList('loading-floor-area-bend',0)
                    }
                  })


                  nextBtn()
                }
              })

              //"page-12"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-12'){
                  cy.selectSingleList('vehicle-location-equals-home-address',0)
                  nextBtn()
                }
              })

              //"page-13"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-13'){
                  cy.uploadImage('unrepaired-pre-damages-photo-upload',PathTo,'hood-npu1.jpg')
                  cy.uploadImage('unrepaired-pre-damages-photo-upload',PathTo,'hood-npu2.jpg')
                  cy.uploadImage('unrepaired-pre-damages-photo-upload',PathTo,'hood-npu3.jpg')
                  nextBtn()
                }
              })

              //"page-14"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-14'){
                  cy.uploadImage('police-ranger-report-photo-upload',PathTo,'police-ranger-report-photo-upload.png')

                  cy.uploadImage('incident-location-photo-upload',PathTo,'incident-location-photo-upload-1.jpg')
                  cy.uploadImage('incident-location-photo-upload',PathTo,'incident-location-photo-upload-2.jpg')
                  cy.uploadImage('incident-location-photo-upload',PathTo,'incident-location-photo-upload-3.jpg')
                  nextBtn()
                }
              })

              //"summary-page"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'summary-page'){
                  if(executePost){
                    cy.get('button[type="submit"]').contains('Senden').click({ force: true, timeout: 1000 })
                    cy.wait('@postPage',{requestTimeout : $requestTimeout, responseTimeout: $requestTimeout}).then(xhr => {
                      cy.postPost(xhr,false)
                    })
                    if (generatePdfCondition){
                      console.log(`Cypress.env('notificationId') = ${Cypress.env('notificationId')}`)
                      // let pdf_template = 'dekra_schadenbilder'
                      // cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
                      // pdf_template = 'dekra_abschlussbericht'
                      // cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
                    }
                  }
                }
              })
            })
          })
        })
      })
    }) //it Huk

    it.skip(`Generate PDFs for ${$car[0]}`, function () {

      const userCredentials =  {
        "password": Cypress.env("passwordHukS"),
        "remoteUser": "",
        "sessionLanguage": "en",
        "userName": Cypress.env("usernameHukS")
      }

      cy.request('POST',`https://${$dev}.spearhead-ag.ch/member/authenticate`,userCredentials)
      .its('body').then(body => {

        const token = body.accessToken
        const authorization = `Bearer ${token}`;
        cy.then(function () {
          questionnaire.authorization = authorization
        })

        const headers_1 = {
          'Accept': '*/*',
          'Accept-Encoding':'gzip, deflate, br',
          'Content-Type': 'application/json',
          authorization,
        }

        const damageNotificationId = Cypress.env('notificationId')
        cy.then(function () {
          questionnaire.notificationId = damageNotificationId
        })

        const options3 = {
          method: 'GET',
          url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
          headers: headers_1
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

 }) //forEach
})  //describe

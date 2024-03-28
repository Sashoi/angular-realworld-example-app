/// <reference types="cypress" />

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: ''  }

describe('Huk_comprehensive_self_service_clickable_car', () =>{

  beforeEach('Login to the app', () =>{
    //cy.loginToApplication()
    console.clear()
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPage')
    cy.intercept('GET', `/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
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
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 40000;
  const executePost = false




  function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }

  function uploadImage(selectorId,toPath,fileName){
    cy.get(`form#${selectorId}`).find('button').selectFile(`${toPath}${fileName}`, {
      action: 'drag-drop',
    })
    cy.wait(['@attachmentAnswer'],{requestTimeout : $requestTimeout}).then(xhr => {
      expect(xhr.response.statusCode).to.equal(200)
    })
    cy.wait('@savePage',{requestTimeout : $requestTimeout}).then(xhr => {
      expect(xhr.response.statusCode).to.equal(200)
    })
    cy.get(`form#${selectorId}`).find(`img[alt="${fileName}"]`).invoke('attr', 'alt').should('eq', fileName)
  }


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
            title = xhr.response.body.uiBlocks[0].elements.sections[0].label.content
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
    })
  }

  function nextBtn() {
    _waitFor('@nextPage')
  }

  function currentPage() {
    _waitFor('@currentPage')
  }

  const $vins1 = [ 'VF3VEAHXKLZ080921',  // MiniBusMidPanel Peugeot Expert 09/2020
                   '6FPPXXMJ2PCD55635',  // Ford Ranger double cabine, Pick-up
                   '6FPGXXMJ2GEL59891',  // Ford Ranger single cabine, Pick-up
                   'WDB1704351F077666',  // MER SLK Cabrio
                   'WBAUB310X0VN69014',  // BMW 1 Series Hatch3
                   'WVWZZZ6RZGY304402',  // Volkswagen Polo Limousine 5 Doors 201404 – 209912, driving/parking help but this vehicle doesn’t have an equipment list (if you check the vin equipment list)
                   'VF7SA5FS0BW550414',  // CIT DS3 Hatch3
                   'WAUZZZ4B73N015435',  // AUD A6/S6/RS6 Sedan
                   'WDB2083441T069719',  // MER CLK Coupe (partial identification, build period to be defined manually)
                   'W0L0XCR975E026845',  // OPE Tigra Cabrio
                   'WAUZZZ8V3HA101912 ', // AUD A3/S3/RS3 Hatch5
                   'WVWZZZ7NZDV041367', //11 VW Sharan MPV
                   'SALYL2RV8JA741831']; //12 Land Rover, SUV
  const $vins = ['VF7SA5FS0BW550414','WAUZZZ4B73N015435','WDB2083441T069719','W0L0XCR975E026845','WAUZZZ8V3HA101912 ','WVWZZZ7NZDV041367','SALYL2RV8JA741831']

  $vins.forEach(vin => {
    it(`Execute {{baseUrl}}/b2b/integration/huk/huk-comprehensive-self-service-init ${vin}`, function () {

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

      let licenseplate = `PVD ${getRandomInt(1,9)}-${getRandomInt(100,999)}`


      //let vin_random = getRandomInt(0,vins.length);
      //vin_random = 0;
      //let vin =  vins[vin_random]
      //vin = 'WVWZZZ6RZGY304402';

      const $equipment_2_loading_doors = true
      const selectAllParts = false


      console.log(`vin:${vin}`)
      cy.request('POST',`https://${$dev}.spearhead-ag.ch/member/authenticate`,userCredentials)
        .its('body').then(body => {

          const token = body.accessToken
          cy.then(function () {
            questionnaire.authorization = `Bearer ${token}`
          })
          const b2bBody =  {
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

          const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
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
              console.log(`self-service-init questionnaireId:${questionnaireId}`)

              const options2 = {
                method: 'GET',
                url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
                headers: headers_1
              };
              cy.wait(3000)
              cy.request(options2).then(
                (response2) => {
                  expect(response2.status).to.eq(200) // true
                  console.log('supportInformation:'+JSON.stringify(response2.body.supportInformation))
                  const damageNotificationId = response2.body.supportInformation.damageNotificationId

                  const options3 = {
                    method: 'GET',
                    url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
                    headers: headers_1
                  };
                  cy.request(options3).then(
                    (response3) => {
                      expect(response3.status).to.eq(200) // true
                      const questionnaireUrl = response3.body.body.requestedInformation[0].requestUrl;
                      const questionnaireId2 = response3.body.body.requestedInformation[0].questionnaireId;
                      console.log(`Real questionnaireId:${questionnaireId2}`)
                      cy.then(function () {
                        questionnaire.Id = questionnaireId2
                      })
                      console.log(`questionnaireUrl: ${questionnaireUrl}`)
                      cy.visit(questionnaireUrl)
                      cy.get('.loader').should('not.exist');
                      //pageId: "page-01"
                      currentPage()

                      const nextButtonLabel ='Speichern und Weiter'
                      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
                      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

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
                          cy.wait(['@generic_elements','@generic_elements','@generic_elements','@generic_elements','@generic_elements',
                          '@generic_elements','@generic_elements','@generic_elements','@generic_elements','@generic_elements','@generic_elements'],
                          {requestTimeout : $requestTimeout}).then(xhr => {
                            //expect(xhr.response.statusCode).to.equal(200)
                            cy.get('div[title="VAN"]').find('g#Layer_4').click({ force: true })
                            cy.wait(3000)
                          })
                          nextBtn()
                        }
                      })
                      const options4 = {
                        method: 'GET',
                        url: `${baseUrl_lp}questionnaire/${questionnaireId2}`,
                        headers:
                        {
                          'Accept': '*/*',
                          'Accept-Encoding':'gzip, deflate, br',
                          'Content-Type': 'application/json',
                          token,
                        }
                      };
                      cy.request(options4).then(
                        (response4) => {
                          expect(response4.status).to.eq(200) // true
                          const bodyType = response4.body.supportInformation.bodyType
                          console.log(`supportInformation.bodyType :  ${bodyType}.`)
                          cy.then(function () {
                            questionnaire.bodyType = bodyType
                          })
                          if (false){
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
                          }
                          //nextBtn()

                          //pageId: "page-04" must check (supportInformation('bodyType')
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
                              uploadImage('vehicle-registration-part-1-photo-upload',PathTo,'registration-part-1.jpg')
                              nextBtn()
                              cy.wait(1000)
                            }
                          })


                          //"page-07"
                          cy.get('@goingPageId').then(function (aliasValue) {
                            if (aliasValue == 'page-07'){
                              uploadImage('vehicle-interior-front-photo-upload',PathTo,'interior-front.jpg')
                              uploadImage('vehicle-dashboard-odometer-photo-upload',PathTo,'image dashboard-odometer.jpg')
                              cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type('123321')
                              nextBtn()
                            }
                          })


                          //"page-08"
                          cy.get('@goingPageId').then(function (aliasValue) {
                            if (aliasValue == 'page-08'){
                              uploadImage('vehicle-right-front-photo-upload',PathTo,'vehicle-right-front-photo.jpg')
                              uploadImage('vehicle-left-rear-photo-upload',PathTo,'vehicle-left-rear-photo1.jpg')
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
                              uploadImage('damage-photo-upload-overview-exhaust',PathTo,'airbag.jpg')
                              uploadImage('damage-photo-upload-detail-exhaust',PathTo,'airbag.jpg')
                              uploadImage('damage-photo-upload-overview-right-taillight',PathTo,'airbag.jpg')
                              uploadImage('damage-photo-upload-detail-right-taillight',PathTo,'airbag.jpg')

                              uploadImage('damage-photo-upload-overview-hood',PathTo,'hood.jpg')
                              uploadImage('damage-photo-upload-detail-hood',PathTo,'hood-d.jpg')

                              uploadImage('damage-photo-upload-overview-roof',PathTo,'roof.jpg')
                              uploadImage('damage-photo-upload-detail-roof',PathTo,'roof-d.jpg')

                              uploadImage('damage-photo-upload-overview-windshield',PathTo,'broken front window_2.jpg')
                              uploadImage('damage-photo-upload-detail-windshield',PathTo,'broken front window_1.jpg')

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
                              uploadImage('unrepaired-pre-damages-photo-upload',PathTo,'hood-npu1.jpg')
                              uploadImage('unrepaired-pre-damages-photo-upload',PathTo,'hood-npu2.jpg')
                              uploadImage('unrepaired-pre-damages-photo-upload',PathTo,'hood-npu3.jpg')
                              nextBtn()
                            }
                          })

                          //"page-14"
                          cy.get('@goingPageId').then(function (aliasValue) {
                            if (aliasValue == 'page-14'){
                              uploadImage('police-ranger-report-photo-upload',PathTo,'police-ranger-report-photo-upload.png')

                              uploadImage('incident-location-photo-upload',PathTo,'incident-location-photo-upload-1.jpg')
                              uploadImage('incident-location-photo-upload',PathTo,'incident-location-photo-upload-2.jpg')
                              uploadImage('incident-location-photo-upload',PathTo,'incident-location-photo-upload-3.jpg')
                              nextBtn()
                            }
                          })

                          //"summary-page"
                          cy.get('@goingPageId').then(function (aliasValue) {
                            if (aliasValue == 'summary-page'){
                              if(executePost){
                                cy.get('button[type="submit"]').contains('Senden').click({ force: true, timeout: 1000 })

                                cy.wait('@postPage',{requestTimeout : $requestTimeout}).then(xhr => {
                                  //console.log(xhr)
                                  expect(xhr.response.statusCode).to.equal(200)
                                  const notificationId = xhr.response.body.notification.id;
                                  console.log(`notificationId:${notificationId}`);
                                  const requestedInformation = xhr.response.body.notification.body.requestedInformation;
                                  console.log(`requestedInformation:${requestedInformation}`);
                                  if (requestedInformation != null && requestedInformation.length > 0){
                                    requestedInformation.forEach((element, index) => {
                                      console.log(`ri[${index}]:`);
                                      console.log(`questionnaireId:${element.questionnaireId}`);
                                      console.log(`workflowType:${element.workflowType}`);
                                      console.log(`templateId:${element.templateId}`);
                                      console.log(`requestUrl:${element.requestUrl}`);
                                    });
                                    // cy.visit(requestedInformation[0].requestUrl)
                                    // cy.get('.loader')
                                    // .should('not.exist')
                                    // cy.wait(1000)

                                  }
                                })
                              }
                            }
                          })
                      })
                  })
              })


          })

        }) //authenticate
    }) //it
 }) //forEach
})  //describe

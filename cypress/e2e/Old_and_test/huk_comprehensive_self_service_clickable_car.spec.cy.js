/// <reference types="cypress" />

//const { post } = require("cypress/types/jquery");

describe('Execute huk_comprehensive_self_service_clickable_car', () =>{
    beforeEach('Login to the app', () =>{
      //cy.loginToApplication()
      console.clear()
    })

    function uploadImages(fileToUpload,URL,auth){
      cy.fixture(fileToUpload,'base64')
            .then(image => {
              const blob = Cypress.Blob.base64StringToBlob(image,'image/jpeg');
              var formdata = new FormData();
              formdata.set("content", blob, fileToUpload);
              var requestOptions = {
                method: 'POST',
                url: `${URL}`,
                headers: {
                  'Authorization' : auth
                },
                body: formdata,
                redirect: 'follow'
              };

              //works
              cy.request(requestOptions).then(
                (response) => {
                  // response.body is automatically serialized into JSON
                  expect(response.status).to.eq(200) // true
                  console.log(response.body)
                })
            })
    }

    function saveQuestions(aBody,URL,auth){
      var requestOptions = {
        method: 'POST',
        url: `${URL}`,
        headers: {
          'Authorization' : auth
        },
        body: aBody
      }

      cy.request(requestOptions).then(
        (response) => {
          // response.body is automatically serialized into JSON
          expect(response.status).to.eq(200) // true
          console.log(response.body)
      })
    }

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

    it('Execute {{baseUrl}}/b2b/integration/huk/huk-comprehensive-self-service-init', () =>{
      const $dev = Cypress.env("dev");
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
      const vins = ["6FPPXXMJ2PCD55635","WVWZZZ6RZGY304402" , "VF3VEAHXKLZ080921" , "WDB1704351F077666" , "WBAUB310X0VN69014" , "WAUZZZ4B73N015435" , "W0L0XCR975E026845"]
      let vin =  vins[getRandomInt(0,vins.length)]//;
      vin = 'WF0KXXTTRKMC81361';
      console.log(`vin:${vin}`)
      cy.request('POST',`https://${$dev}.spearhead-ag.ch/member/authenticate`,userCredentials)
        .its('body').then(body => {

          const token = body.accessToken
          //cy.wrap(token).as('token')
          //console.log(body)
          const b2bBody =  {
            "qas": [
                {
                    "questionId": "role-type",
                    "answer": [
                        "client"
                    ]
                },
                {
                    "questionId": "accident-date",
                    "answer": [
                        "2020-01-01"
                    ]
                },
                {
                    "questionId": "loss-cause",
                    "answer": [
                        "collision"
                    ]
                },
                {
                    "questionId": "loss-circumstances",
                    "answer": [
                        "rear-end-collision"
                    ]
                },
                {
                    "questionId": "client-insurance-claim-number",
                    "answer": [claimNumber]
                },
                {
                    "questionId": "animal-species",
                    "answer": [
                        "fox"
                    ]
                },
                {
                    "questionId": "huk-coburg-triage-category",
                    "answer": [
                        "total-loss"
                    ]
                },
                {
                    "questionId": "client-insurance-policy-number",
                    "answer": [
                        "123456789X"
                    ]
                },
                {
                    "questionId": "insurance-policy-type",
                    "answer": "select"
                },
                {
                    "questionId": "insurance-name",
                    "answer": [
                        "huk-coburg"
                    ]
                },
                {
                    "questionId": "client-zip-code",
                    "answer": [
                        "96450"
                    ]
                },
                {
                    "questionId": "client-country",
                    "answer": [
                        "DE"
                    ]
                },
                {
                    "questionId": "vehicle-vin",
                    "answer": [vin]
                },
                {
                    "questionId": "vehicle-first-registration-date",
                    "answer": [
                        "2019-10-01"
                    ]
                },
                {
                    "questionId": "client-vehicle-license-plate",
                    "answer": [licenseplate]
                },
                {
                    "questionId": "vehicle-financed",
                    "answer": [
                        "yes"
                    ]
                },
                {
                    "questionId": "vehicle-leased",
                    "answer": [
                        "no"
                    ]
                },
                {
                    "questionId": "vehicle-owner-entitled-for-pre-tax-deduction",
                    "answer": [
                        "no"
                    ]
                },
                {
                    "questionId": "client-email",
                    "answer": [
                        "yourEmail@soft2run.com"
                    ]
                },
                {
                    "questionId": " vehicle-location-zip-code",
                    "answer": [
                        "22222"
                    ]
                },
                {
                    "questionId": "client-mobile-phone-number",
                    "answer": [
                        "123654789"
                    ]
                },
                {
                     "questionId": "part-selection-type",
                     "answer": [
                         "clickable-car"
                     ]
                 }
            ],
            "supportInformation": null,
            "readOnlyQuestions": null
        }

          const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
          const authorization = `Bearer ${token}`;
          const options = {
                method: 'POST',
                url: `${baseUrl_lp}b2b/integration/huk/huk-comprehensive-self-service-init`,
                body: b2bBody,
                headers: {
                  'Accept': '*/*',
                  'Accept-Encoding':'gzip, deflate, br',
                  'Content-Type': 'application/json',
                  authorization,
                }
          };
          cy.request(options).then(
            (response) => {
              // response.body is automatically serialized into JSON
              expect(response.status).to.eq(200) // true
              const questionnaireId = response.body.questionnaireId;
              console.log(`questionnaireId:${response.body.questionnaireId}`)

              const options2 = {
                method: 'GET',
                url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
                headers: {
                  'Accept': '*/*',
                  'Accept-Encoding':'gzip, deflate, br',
                  'Content-Type': 'application/json',
                  authorization,
                }
              };
              cy.wait(3000)
              cy.request(options2).then(
                (response) => {
                  expect(response.status).to.eq(200) // true
                  console.log(`supportInformation:${response.body.supportInformation}`)
                  const damageNotificationId = response.body.supportInformation.damageNotificationId
                  //console.log(response.body)

                  const options3 = {
                    method: 'GET',
                    url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
                    headers: {
                      'Accept': '*/*',
                      'Accept-Encoding':'gzip, deflate, br',
                      'Content-Type': 'application/json',
                      authorization,
                    }
                  };
                  cy.request(options3).then(
                    (response) => {
                      expect(response.status).to.eq(200) // true
                      const questionnaireUrl = response.body.body.requestedInformation[0].requestUrl;
                      const questionnaireId2 = response.body.body.requestedInformation[0].questionnaireId;
                      cy.visit(questionnaireUrl)
                      cy.get('.loader').should('not.exist');
                      cy.wait(1000);

                      //pageId: "page-01"
                      cy.get('div#terms-of-service-acknowledgement-huk-coburg').find('label[for="terms-of-service-acknowledgement-huk-coburg_0"]').click({ force: true })
                      cy.get('button[type="submit"]').contains('Weiter').click()
                      cy.wait(1000)

                      const nextButtonLabel ='Speichern und Weiter'

                      //pageId: "page-02"
                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(1000)

                      //pageId: "page-04"
                      if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361"){
                        cy.get('div#equipment-slide-door').find('label[for="equipment-slide-door_1"]').click({ force: true })
                        cy.get('div#equipment-2-loading-doors').find('label[for="equipment-2-loading-doors_0"]').click({ force: true })
                        cy.get('div#equipment-length').find('label[for="equipment-length_0"]').click({ force: true })
                        cy.get('div#equipment-height').find('label[for="equipment-height_0"]').click({ force: true })
                        cy.get('div#equipment-vehicle-rear-glassed').find('label[for="equipment-vehicle-rear-glassed_0"]').click({ force: true })
                        cy.get('div#vehicle-customized-interior').find('label[for="vehicle-customized-interior_0"]').click({ force: true })
                      }

                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(1000)

                      //pageId:"page-05" SVG
                      //exhaust
                      cy.get('svg').find(`g#exhaust`).click({ force: true })

                      //towing-hook if check does not calc iBox
                      if (false){
                        cy.get('svg').find(`g#towing-hook`).click({ force: true })
                      }

                      //underbody  if check does not calc iBox
                      //cy.get('svg').find(`g#underbody`).click({ force: true })

                      //airbag
                      cy.get('svg').find(`g#airbag`).click({ force: true })


                      //right-taillight
                      cy.get('svg').find(`g#right-taillight`).click({ force: true })

                      if (false) {


                      //left-taillight
                      cy.get('svg').find(`g#left-taillight`).click({ force: true })


                      //right-mirror
                      cy.get('svg').find(`g#right-mirror`).click({ force: true })

                      //left-mirror
                      cy.get('svg').find(`g#left-mirror`).click({ force: true })

                      //right-front-wheel
                      cy.get('svg').find(`g#right-front-wheel`).click({ force: true })


                      //right-rear-wheel
                      cy.get('svg').find(`g#right-rear-wheel`).click({ force: true })


                      //right-front-wheel-tire
                      cy.get('svg').find(`g#right-front-wheel-tire`).click({ force: true })

                      //right-rear-wheel-tire
                      cy.get('svg').find(`g#right-rear-wheel-tire`).click({ force: true })

                      //left-front-wheel
                      cy.get('svg').find(`g#left-front-wheel`).click({ force: true })


                      //left-front-wheel-tire
                      cy.get('svg').find(`g#left-front-wheel-tire`).click({ force: true })

                      //left-rear-wheel
                      cy.get('svg').find(`g#left-rear-wheel`).click({ force: true })


                      //left-rear-wheel-tire
                      cy.get('svg').find(`g#left-rear-wheel-tire`).click({ force: true })

                      //right-headlight
                      if (true && vin != "WAUZZZ4B73N015435") { //for this vin questions are pre-answered
                        cy.get('svg').find(`g#right-headlight`).click({ force: true })

                      }
                      if (true && vin == "WAUZZZ4B73N015435") {
                        cy.get('svg').find(`g#right-headlight`).click({ force: true })
                      }

                      //left-headlight
                      if (true && vin != "WAUZZZ4B73N015435") {  ////for this vin questions are pre-answered
                        cy.get('svg').find(`g#left-headlight`).click({ force: true })
                      }
                      if (true && vin == "WAUZZZ4B73N015435") {  ////for this vin questions are pre-answered
                        cy.get('svg').find(`g#left-headlight`).click({ force: true })
                      }

                      //hood
                      cy.get('svg').find('#hood').click()

                      //grill
                      cy.get('svg').find('#grill').click()


                      //right-front-additional-light
                      cy.get('svg').find(`g#right-front-additional-light`).click({ force: true })

                      //left-front-additional-light
                      cy.get('svg').find(`g#left-front-additional-light`).click({ force: true })

                      //left-front-fender
                      cy.get('svg').find(`g#left-front-fender`).click({ force: true })


                      //right-front-fender
                      cy.get('svg').find('g#right-front-fender').click({ force: true })


                      //form_def or front_bumper_gray or front-bumper
                      if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666"){
                        cy.get('svg').find('g#form_def').click({ force: true })
                      }
                      if (vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845" || vin == "WF0KXXTTRKMC81361"){
                        cy.get('svg').find('#front-bumper').click({ force: true })
                      }
                      if (vin == "VF3VEAHXKLZ080921" || vin == "6FPPXXMJ2PCD55635"){
                        cy.get('svg').find('#front_bumper_gray').click({ force: true })
                      }

                      //windshield
                      cy.get('svg').find('#windshield').click({ force: true })

                      //roof
                      cy.get('svg').find('g#roof').click({ force: true })


                      //left-front-door
                      cy.get('svg').find('g#left-front-door').click({ force: true })

                      //left-front-door_window_and_handle
                      cy.get('svg').find('g#left-front-door-window').click({ force: true })

                      //right-front-door
                      cy.get('svg').find('g#right-front-door').click({ force: true })


                      //right-front-door_window_and_handle
                      cy.get('svg').find('g#right-front-door-window').click({ force: true })

                      //left-rear-door
                      if (vin == "WVWZZZ6RZGY304402" || vin == "WAUZZZ4B73N015435" || vin == "WF0KXXTTRKMC81361"){
                        cy.get('svg').find('g#left-rear-door').click({ force: true })

                      }

                      //left-rear-door-window
                      if (vin != "VF3VEAHXKLZ080921" && vin != "WF0KXXTTRKMC81361"){
                        cy.get('svg').find('g#left-rear-door-window').click({ force: true })
                      }

                      //right-rear-door
                      if (vin == "WVWZZZ6RZGY304402" || vin == "WAUZZZ4B73N015435"){
                        cy.get('svg').find('g#right-rear-door').click({ force: true })
                      }

                      //right-rear-door
                      if (vin == "6FPPXXMJ2PCD55635"){
                        cy.get('svg').find('g#right-rear-door').click({ force: true })
                      }

                      //right-rear-door-window
                      if (vin != "VF3VEAHXKLZ080921" && vin != "WF0KXXTTRKMC81361"){
                        cy.get('svg').find('g#right-rear-door-window').click({ force: true })
                      }

                      //left-sill
                      cy.get('svg').find('g#left-sill').click({ force: true })


                      //right-sill
                      cy.get('svg').find('g#right-sill').click({ force: true })


                      //tailgate and rear-window
                      if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666" || vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845" || vin == "6FPPXXMJ2PCD55635"){
                        cy.get('svg').find('g#rear-window').click({ force: true })
                        cy.get('svg').find('g#tailgate').click({ force: true })
                      }

                      //load-doors and rear-windows
                      if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361"){
                        cy.get('svg').find('g#right-load-door').click({ force: true })
                        cy.get('svg').find('g#left-load-door').click({ force: true })
                        cy.get('svg').find('g#LCV_both_sliding').find('g#left-rear-window').click({ force: true })
                        cy.get('svg').find('g#LCV_both_sliding').find('g#right-rear-window').click({ force: true })
                      }


                      //rear-bumper
                      cy.get('svg').find('g#rear-bumper').click({ force: true })

                      //left-rear-side-panel
                      cy.get('svg').find('g#left-rear-side-panel').click({ force: true })

                      //right-rear-side-panel
                      cy.get('svg').find('g#right-rear-side-panel').click({ force: true })


                      //left-rear-door
                      if (vin == "VF3VEAHXKLZ080921" || vin == "6FPPXXMJ2PCD55635"){
                        cy.get('svg').find('g#left-rear-door').click({ force: true })
                      }

                      //right-middle-side-panel
                      if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361"){
                        cy.get('svg').find('g#right-middle-side-panel').click({ force: true })
                      }
                      }


                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-registration-part-1-photo-upload/index-1?locale=de`
                        uploadImages('airbag.jpg',URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "vehicle-registration-part-1-photo-upload",
                                  "answer": {
                                      "value": {
                                          "index-1": "vehicle-registration-part-1-photo-upload-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              }
                          ]
                        }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-06?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(3000)

                      //"page-06"

                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-interior-front-photo-upload/index-1?locale=de`
                        uploadImages('airbag.jpg',URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "vehicle-interior-front-photo-upload",
                                  "answer": {
                                      "value": {
                                          "index-1": "vehicle-interior-front-photo-upload-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "vehicle-dashboard-odometer-photo-upload",
                                  "answer": {
                                      "value": {},
                                      "fileUploaded": false
                                  }
                              }
                          ]
                      }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-07?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-dashboard-odometer-photo-upload/index-1?locale=de`
                        uploadImages('airbag.jpg',URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "vehicle-interior-front-photo-upload",
                                  "answer": {
                                      "value": {
                                          "index-1": "vehicle-interior-front-photo-upload-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "vehicle-dashboard-odometer-photo-upload",
                                  "answer": {
                                      "value": {
                                          "index-1": "vehicle-dashboard-odometer-photo-upload-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              }
                          ]
                      }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-07?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(3000)

                      //"page-07"
                      cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type('123321')

                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-right-front-photo-upload/index-1?locale=de`
                        uploadImages('airbag.jpg',URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "vehicle-right-front-photo-upload",
                                  "answer": {
                                      "value": {
                                          "index-1": "vehicle-right-front-photo-upload-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "vehicle-left-rear-photo-upload",
                                  "answer": {
                                      "value": {},
                                      "fileUploaded": false
                                  }
                              }
                          ]
                      }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-08?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-left-rear-photo-upload/index-1?locale=de`
                        uploadImages('airbag.jpg',URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "vehicle-right-front-photo-upload",
                                  "answer": {
                                      "value": {
                                          "index-1": "vehicle-right-front-photo-upload-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "vehicle-left-rear-photo-upload",
                                  "answer": {
                                      "value": {
                                          "index-1": "vehicle-left-rear-photo-upload-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              }
                          ]
                      }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-08?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(3000)


                      //"page-08"

                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/damage-photo-upload-overview-exhaust/index-1?locale=de`
                        uploadImages('airbag.jpg',URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "damage-photo-upload-overview-exhaust",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-overview-exhaust-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-detail-exhaust",
                                  "answer": {
                                      "value": {},
                                      "fileUploaded": false
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-overview-right-taillight",
                                  "answer": {
                                      "value": {},
                                      "fileUploaded": false
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-detail-right-taillight",
                                  "answer": {
                                      "value": {},
                                      "fileUploaded": false
                                  }
                              }
                          ]
                        }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-09?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/damage-photo-upload-detail-exhaust/index-1?locale=de`
                        uploadImages('airbag.jpg',URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "damage-photo-upload-overview-exhaust",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-overview-exhaust-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-detail-exhaust",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-detail-exhaust-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-overview-right-taillight",
                                  "answer": {
                                      "value": {},
                                      "fileUploaded": false
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-detail-right-taillight",
                                  "answer": {
                                      "value": {},
                                      "fileUploaded": false
                                  }
                              }
                          ]
                        }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-09?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/damage-photo-upload-overview-right-taillight/index-1?locale=de`
                        uploadImages(fileToUpload,URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "damage-photo-upload-overview-exhaust",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-overview-exhaust-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-detail-exhaust",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-detail-exhaust-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-overview-right-taillight",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-overview-right-taillight-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-detail-right-taillight",
                                  "answer": {
                                      "value": {},
                                      "fileUploaded": false
                                  }
                              }
                          ]
                        }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-09?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.getCookie('access_token')
                      .should('exist')
                      .then((c) => {
                        // save cookie until we need it
                        //console.log(c)
                        const fileToUpload = "airbag.jpg";
                        const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/damage-photo-upload-detail-right-taillight/index-1?locale=de`
                        uploadImages('airbag.jpg',URL1,c.value)

                        const b2bBody2 = {
                          "answers": [
                              {
                                  "questionId": "damage-photo-upload-overview-exhaust",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-overview-exhaust-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-detail-exhaust",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-detail-exhaust-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-overview-right-taillight",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-overview-right-taillight-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              },
                              {
                                  "questionId": "damage-photo-upload-detail-right-taillight",
                                  "answer": {
                                      "value": {
                                          "index-1": "damage-photo-upload-detail-right-taillight-index-1"
                                      },
                                      "fileUploaded": true
                                  }
                              }
                          ]
                        }

                        const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-09?locale=de`
                        saveQuestions(b2bBody2,URL2,c.value)
                      })

                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(3000)

                      //page-09

                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(3000)

                      //page-10
                      cy.get('div#right-taillight-equipment-led-rear-lights').find('label[for="right-taillight-equipment-led-rear-lights_0"]').click({ force: true })
                      cy.get('div#loading-floor-area-bend').find('label[for="loading-floor-area-bend_0"]').click({ force: true })

                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(1000)

                      //"page-11"
                      cy.get('div#vehicle-location-equals-home-address').find('label[for="vehicle-location-equals-home-address_0"]').click({ force: true })

                      cy.get('button[type="submit"]').contains(nextButtonLabel).click()
                      cy.wait(1000)


                      //"summary-page"

                      cy.get('button[type="submit"]').contains('Senden').click()


                    }
                  )
                }
              )
            }
          )
      })
    })
  }
)

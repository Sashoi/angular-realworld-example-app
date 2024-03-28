/// <reference types="cypress" />

describe('Test log out', () =>{
  beforeEach('Login to the app', () =>{
    //cy.loginToApplication()
  })

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

  function uploadImages(fileToUpload,URL,auth){
    cy.fixture(fileToUpload,'base64')
          .then(image => {
            const blob = Cypress.Blob.base64StringToBlob(image,'image/jpeg');
            let formdata = new FormData();
            formdata.set("content", blob, fileToUpload);
            var requestOptions = {
              method: 'POST',
              url: `${URL}`,
              headers: {
                //'Referer' : 'https://dev02.spearhead-ag.ch/ui/questionnaire/mdekra/',
                'Authorization' : auth
              },
              body: formdata,
              redirect: 'follow'
            };

            //works
            cy.request(requestOptions).then(
              (response) => {
                // response.body is automatically serialized into JSON
                expect(response.status).to.eq(200) // uploadImages
                console.log(`uploadImages:${response.body}`)
              })
          })
  }

  function saveQuestions(aBody,URL,auth){
    let requestOptions = {
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
        expect(response.status).to.eq(200) // saveQuestions
        console.log(`saveQuestions:${response.body}`)
    })
  }

  it('Huk-comprehensive-self-service-Vehicle_Zone', () =>{

    const $dev = Cypress.env("dev");
    const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
    const userCredentials =  {
      "password": Cypress.env("passwordHukS"),
      "remoteUser": "",
      "sessionLanguage": "en",
      "userName": Cypress.env("usernameHukS")
    }


    let ran1 =  getRandomInt(10,99)
    let ran2 =  getRandomInt(100,999)
    let ran3 =  getRandomInt(100000,999999)

    const vins = ["6FPPXXMJ2PCD55635","WVWZZZ6RZGY304402" , "VF3VEAHXKLZ080921" , "WDB1704351F077666" , "WBAUB310X0VN69014" , "WAUZZZ4B73N015435" , "W0L0XCR975E026845"]
    let $vin =  vins[getRandomInt(0,vins.length)]//;
    $vin = 'WVWZZZ6RZGY304402'//'W0L0XCR975E026845';
    console.log(`vin:${$vin}`);
    const licenseplate = `SOF ${getRandomInt(1000,9999)}`
    console.log(`licenseplate:${licenseplate}`);

  cy.request('POST',`${baseUrl_lp}member/authenticate`,userCredentials)
  .its('body').then(body => {
      const token = body.accessToken
      const claimNumber = ran1 + "-13-"+ ran2 + "/" + ran3 + "-Z";

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
                  "answer": [`${ claimNumber }`]
              },
              {
                  "questionId": "animal-species",
                  "answer": ["fox"]
              },
              {
                  "questionId": "insurance-name",
                  "answer": ["huk-coburg"]
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
                  "answer": [""]
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
                  "answer": [`${ $vin }`]
              },
              {
                  "questionId": "vehicle-first-registration-date",
                  "answer": ["2019-10-01"]
              },
              {
                  "questionId": "client-vehicle-license-plate",
                  "answer": [`${licenseplate}`]
              },
              {
                  "questionId": "client-email",
                  "answer": ["sivanchevski1@soft2run.com"]
              },
              {
                  "questionId": "client-mobile-phone-number",
                  "answer": ["123654789"]
              },
              {
                  "questionId": "vehicle-mileage",
                  "answer": {
                      "unit": "km",
                      "value": 300123,
                      "fileUploaded": "false"
                  }
              },
              {
                  "questionId": "part-selection-type",
                  "answer": ["vehicle-zones"]
              }
          ],
          "supportInformation": null,
          "readOnlyQuestions": null
      }

      const authorization = `Bearer ${token}`;
      //const contentType = `application/json`;
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
        expect(response.status).to.eq(200)
        const questionnaireId = response.body.questionnaireId;
        console.log(questionnaireId);
        const options1 = {
          method: 'GET',
          url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
          headers: headers_1
        };
        cy.wait(2000)
        cy.request(options1).then(
          (response) => {
          const damageNotificationId = response.body.supportInformation.damageNotificationId;
          console.log(`damageNotificationId:${damageNotificationId}`);
          const options2 = {
                      method: 'GET',
                      url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
                      headers: headers_1
          };
          cy.wait(2000)
          cy.request(options2).then(
            (response) => {
            const requestUrl = response.body.body.requestedInformation[0].requestUrl;
            const questionnaireId2 = response.body.body.requestedInformation[0].questionnaireId;
            console.log(`requestUrl:${requestUrl}`);
            console.log(`questionnaireId2:${questionnaireId2}`);

            cy.visit(requestUrl);
            cy.get('.loader').should('not.exist');
            //cy.wait(1000);

            //"page-01"
            cy.get('div[title="Ich stimme zu"]').click()
            cy.get('button[type="submit"]').click()
            cy.wait(1000);

            //"page-02"
            //cy.intercept('POST', `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-02?navigateTo=next&offset=120&locale=de`).as('page-05')
            //cy.intercept('POST', `${baseUrl_lp}questionnaire/${questionnaireId2}/picture/vehicleZones?colour=007d40&areas=&locale=de`).as('page05')
            cy.get('button[type="submit"]').click();
            cy.wait(1000);

            //"page-05"
            //cy.wait('@page05', {requestTimeout: 20000}).then(xhr => {
              //console.log(xhr)
              //expect(xhr.response.statusCode).to.equal(200)
              //expect(xhr.response.body.pageId).to.equal("page-05")
            //})
            cy.wait(5000);
            cy.get('svg').find('g#roof').children('path').eq(1).click({force: true });
            cy.get('svg').find('g#windshield').children('path').eq(1).click({force: true });
            cy.get('button[type="submit"]').click();
            cy.wait(1000);


            //"page-06"
            cy.get('div#airbag-deployed').find('label[for="airbag-deployed_0"]').click()
            cy.get('div#underbody-damage-type2').find('label[for="underbody-damage-type2_0"]').click()
            cy.get('button[type="submit"]').click();
            cy.wait(1000);

            //"page-07"
            cy.get('div.svg-selection-container[title="Dach"]')
            .click('center');
            cy.wait(1000);

            //save page-07
            cy.getCookie('access_token')
            .should('exist')
            .then((c) => {
              const b2bBody2 = {
                "answers": [
                    {
                        "questionId": "selected-parts-zones",
                        "answer": "roof"
                    }
                ]
            }
              const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-07?locale=de`
              saveQuestions(b2bBody2,URL2,c.value)
            })

            //add images for page-08
            cy.getCookie('access_token')
            .should('exist')
            .then((c) => {
              // save cookie until we need it
              //console.log(c)
              const fileToUpload = "registration-part-1.jpg";
              const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-registration-part-1-photo-upload/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)

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

              const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-08?locale=de`
              cy.wait(4000)
              saveQuestions(b2bBody2,URL2,c.value)
            })

            cy.get('button[type="submit"]').click();
            cy.wait(1000);

            //"page-08"
            //cy.fixture(fileToUpload, null).as('MyfileToUpload')
            //cy.get('input[type=file]').selectFile('@MyfileToUpload',{ force: true, timeout: timeoutFileUpload})

            //add images for page-09

            cy.getCookie('access_token')
            .should('exist')
            .then((c) => {
              // save cookie until we need it
              //console.log(c)
              let fileToUpload = "interior-front.jpg";
              let URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-interior-front-photo-upload/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)

              fileToUpload = "image dashboard-odometer.jpg";
              URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-dashboard-odometer-photo-upload/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)

              const b2bBody2 ={
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

              const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-09?locale=de`
              saveQuestions(b2bBody2,URL2,c.value)
            })

            cy.get('button[data-test="questionnaire-next-button"]').click({ force: true });
            cy.wait(1000);

            //"page-09"
            cy.get('input[data-test="vehicle-mileage-question-type-vehicle-mileage"]').type('123456')


            //add images for page-10
            cy.getCookie('access_token')
            .should('exist')
            .then((c) => {
              // save cookie until we need it
              //console.log(c)
              const fileToUpload = "airbag.jpg";
              let URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-left-rear-photo-upload/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)
              URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-right-front-photo-upload/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)

              const b2bBody2 ={
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

              const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-10?locale=de`
              saveQuestions(b2bBody2,URL2,c.value)
            })


            cy.get('button[data-test="questionnaire-next-button"]').click({ force: true });
            cy.wait(1000);

            //"page-10"
            //add images for page-11
            cy.getCookie('access_token')
            .should('exist')
            .then((c) => {
              // save cookie until we need it
              //console.log(c)
              const b2bBody1 = {
                "answers": [
                    {
                        "questionId": "damage-photo-upload-overview-roof-front-left-top-side",
                        "answer": {
                            "value": {},
                            "fileUploaded": false
                        }
                    },
                    {
                        "questionId": "damage-photo-upload-overview-roof-front-right-top-side",
                        "answer": {
                            "value": {},
                            "fileUploaded": false
                        }
                    },
                    {
                        "questionId": "damage-photo-upload-overview-roof-rear-right-top-side",
                        "answer": {
                            "value": {},
                            "fileUploaded": false
                        }
                    },
                    {
                        "questionId": "damage-photo-upload-overview-roof-rear-left-top-side",
                        "answer": {
                            "value": {},
                            "fileUploaded": false
                        }
                    }
                ]
              }
              const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-10?locale=de`
              saveQuestions(b2bBody1,URL2,c.value)


              const fileToUpload = "airbag.jpg";
              let URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/damage-photo-upload-overview-roof-front-left-top-side/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)
              URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/damage-photo-upload-overview-roof-front-right-top-side/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)
              URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/damage-photo-upload-overview-roof-rear-right-top-side/index-1/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)
              URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/damage-photo-upload-overview-roof-rear-left-top-side/index-1/index-1?locale=de`
              uploadImages(fileToUpload,URL1,c.value)

              const b2bBody2 ={
                "answers": [
                    {
                        "questionId": "damage-photo-upload-overview-roof-front-left-top-side",
                        "answer": {
                            "value": {
                                "index-1": "damage-photo-upload-overview-roof-front-left-top-side-index-1"
                            },
                            "fileUploaded": true
                        }
                    },
                    {
                        "questionId": "damage-photo-upload-overview-roof-front-right-top-side",
                        "answer": {
                            "value": {
                                "index-1": "damage-photo-upload-overview-roof-front-right-top-side-index-1"
                            },
                            "fileUploaded": true
                        }
                    },
                    {
                        "questionId": "damage-photo-upload-overview-roof-rear-right-top-side",
                        "answer": {
                            "value": {
                                "index-1": "damage-photo-upload-overview-roof-rear-right-top-side-index-1"
                            },
                            "fileUploaded": true
                        }
                    },
                    {
                        "questionId": "damage-photo-upload-overview-roof-rear-left-top-side",
                        "answer": {
                            "value": {
                                "index-1": "damage-photo-upload-overview-roof-rear-left-top-side-index-1"
                            },
                            "fileUploaded": true
                        }
                    }
                ]
            }

              //const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-10?locale=de`
              saveQuestions(b2bBody2,URL2,c.value)
            })


            cy.get('button[data-test="questionnaire-next-button"]').click({ force: true });
            cy.wait(1000);

            //"page-11"

            cy.get('button[data-test="questionnaire-next-button"]').click({ force: true });
            cy.wait(1000);

            //"page-12"

            cy.get('button[data-test="questionnaire-next-button"]').click({ force: true });
            cy.wait(1000);

            //"page-14"

            cy.get('div#vehicle-location-equals-home-address').find('label[for="vehicle-location-equals-home-address_0"]').click({ force: true })
            cy.get('button[data-test="questionnaire-next-button"]').click({ force: true, timeout: 1000 });
            cy.wait(1000);

          })
        })
      })
    })
  })
})

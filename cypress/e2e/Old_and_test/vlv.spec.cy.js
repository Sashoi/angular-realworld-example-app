/// <reference types="cypress" />

describe('Start and complete vlv standalone questionnaire', () => {

  beforeEach('Login to the app', () => {
    cy.intercept('POST', `/b2b/integration/vlv/vlv-comprehensive-call-center?identifyVehicleAsync=false`).as('postStart')
    console.clear()
  })

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }

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

  it('vlv Standalone', () => {
    const $dev = Cypress.env("dev");
    const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
    cy.visit(`${baseUrl_lp}ui/questionnaire/zurich/#/login?theme=vlv`)
    // login
    cy.get('[placeholder="Email"]').type(Cypress.env("usernameHukS"))
    cy.get('[placeholder="Passwort"]').type(Cypress.env("passwordHukS"))
    cy.get('form').submit()
    cy.wait(500)

    const intS1 = getRandomInt(1000, 9999).toString()
    const intS2 = getRandomInt(1000, 9999).toString()
    const intS3 = getRandomInt(100, 999).toString()
    const intS4 = getRandomInt(0, 9).toString()

    const claimNumber = `${intS1}.${intS2}/${intS3}-${intS4}`
    console.log(claimNumber)
    const vins = ["6FPPXXMJ2PCD55635","WVWZZZ6RZGY304402" , "VF3VEAHXKLZ080921" , "WDB1704351F077666" , "WBAUB310X0VN69014" , "WAUZZZ4B73N015435" , "W0L0XCR975E026845"]
    let $vin =  vins[getRandomInt(0,vins.length)]//;
    $vin = 'W0L0XCR975E026845';
    console.log(`vin:${$vin}`);
    const licenseplate = `SOF ${getRandomInt(1,9)}-${getRandomInt(100,999)}`
    console.log(`licenseplate:${licenseplate}`);

    cy.get('[name="claimNumber"]').type(claimNumber)
    cy.get('[data-test="standalone_vin"]').type($vin)
    cy.get('ng-select[data-test="standalone_lossCause"]').find('input[type="text"]').type('Unfall',{force: true})
    cy.get('#firstRegistrationDate__input').type('10.05.2013')
    cy.get('#licensePlate').type(licenseplate)
    cy.get('#zipCode').type('2222')
    cy.get('[class="btn btn-primary btn-submit"]').click()
    cy.wait(500)

    cy.wait('@postStart').then(xhr => {
      //console.log(xhr)
      expect(xhr.response.statusCode).to.equal(200)
      const questionnaireId = xhr.response.body.questionnaireId;
      console.log(`questionnaireId:${questionnaireId}`)
      Cypress.env(`questionnaireId`, questionnaireId)
    })

    //pageId: "page-01"
    cy.get('#accident-date-input').type('01.11.2023')
    cy.get('div#loss-circumstances-details').find('label[for="loss-circumstances-details_1"]').click()
    cy.get('div#loss-circumstances-details').find('label[for="loss-circumstances-details_0"]').click()
    cy.get('#vehicle-mileage-input').clear().type('123456')

    cy.get('button[type="submit"]').contains('Weiter').click()

    //pageId:"page-02"
    cy.get('div#vehicle-safe-to-drive').find('label[for="vehicle-safe-to-drive_1"]').click()
    cy.get('div#vehicle-ready-to-drive').find('label[for="vehicle-ready-to-drive_1"]').click()
    cy.get('div#unrepaired-pre-damages').find('label[for="unrepaired-pre-damages_0"]').click()
    cy.get('div#vehicle-damage-repaired').find('label[for="vehicle-damage-repaired_1"]').click()
    cy.get('div#cash-on-hand-settlement-preferred').find('label[for="cash-on-hand-settlement-preferred_1"]').click()
    cy.get('div#repair-network-preferred').find('label[for="repair-network-preferred_1"]').click()

    cy.get('button[type="submit"]').contains('Weiter').click()
    // check is error masagge appears

    //hood
    cy.get('svg').find('#hood').click()
    cy.get('div#hood-damage-type').find('label[for="hood-damage-type_1"]').click({ force: true })
    cy.get('div#hood-damage-size').find('label[for="hood-damage-size_2"]').click({ force: true })

    cy.get('button[type="submit"]').contains('Weiter').click()

    //pageId:"page-03"
    /* test localStorage
    console.log(`questionnaireId 2:${localStorage.getItem('questionnaireId')}`)
    console.log(`questionnaireId 2 env:${Cypress.env(`questionnaireId`)}`)
    cy.getAllLocalStorage().then((result) => {
      Object.keys(result).forEach((key) => {
        let values = result[key];
        cy.log(key + ": " + values);
        Object.keys(values).forEach((key2) => {
          cy.log(key2 + ": " + values[key2]);
        });
      });
      console.log(`getAllLocalStorage:${result}`)
    })
    */

    cy.getCookie('access_token')
    .should('exist')
    .then((c) => {
      // save cookie until we need it
      //console.log(c)
      const fileToUpload = "registration-part-1.jpg";
      const URL1 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/attachment/answer/vehicle-registration-part-1-photo-upload/index-1?locale=de`
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
            },
            {
                "questionId": "vehicle-right-front-photo-upload",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "vehicle-left-rear-photo-upload",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "vehicle-interior-front-photo-upload",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "vehicle-dashboard-odometer-photo-upload",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-overview-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-detail-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-other",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            }
        ]
      }

      const URL2 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/page/page-04?locale=de`
      saveQuestions(b2bBody2,URL2,c.value)
    })

    cy.getCookie('access_token')
    .should('exist')
    .then((c) => {
      // save cookie until we need it
      //console.log(c)
      const fileToUpload = "airbag.jpg";
      const URL1 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/attachment/answer/vehicle-right-front-photo-upload/index-1?locale=de`
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
            },
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
            },
            {
                "questionId": "vehicle-interior-front-photo-upload",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "vehicle-dashboard-odometer-photo-upload",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-overview-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-detail-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-other",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            }
        ]
    }

      const URL2 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/page/page-04?locale=de`
      saveQuestions(b2bBody2,URL2,c.value)
    })

    cy.getCookie('access_token')
    .should('exist')
    .then((c) => {
      // save cookie until we need it
      //console.log(c)
      const fileToUpload = "airbag.jpg";
      const URL1 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/attachment/answer/vehicle-left-rear-photo-upload/index-1?locale=de`
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
            },
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
            },
            {
                "questionId": "vehicle-interior-front-photo-upload",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "vehicle-dashboard-odometer-photo-upload",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-overview-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-detail-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-other",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            }
        ]
    }

      const URL2 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/page/page-04?locale=de`
      saveQuestions(b2bBody2,URL2,c.value)
    })

    cy.getCookie('access_token')
    .should('exist')
    .then((c) => {
      // save cookie until we need it
      //console.log(c)
      const fileToUpload = "airbag.jpg";
      const URL1 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/attachment/answer/vehicle-interior-front-photo-upload/index-1?locale=de`
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
            },
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
            },
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
            },
            {
                "questionId": "damage-photo-upload-overview-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-detail-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-other",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            }
        ]
      }

      const URL2 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/page/page-04?locale=de`
      saveQuestions(b2bBody2,URL2,c.value)
    })

    cy.getCookie('access_token')
    .should('exist')
    .then((c) => {
      // save cookie until we need it
      //console.log(c)
      const fileToUpload = "airbag.jpg";
      const URL1 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/attachment/answer/vehicle-dashboard-odometer-photo-upload/index-1?locale=de`
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
            },
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
            },
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
            },
            {
                "questionId": "damage-photo-upload-overview-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-detail-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-other",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            }
        ]
      }

      const URL2 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/page/page-04?locale=de`
      saveQuestions(b2bBody2,URL2,c.value)
    })

    cy.getCookie('access_token')
    .should('exist')
    .then((c) => {
      // save cookie until we need it
      //console.log(c)
      const fileToUpload = "airbag.jpg";
      const URL1 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/attachment/answer/damage-photo-upload-overview-hood/index-1?locale=de`
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
            },
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
            },
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
            },
            {
                "questionId": "damage-photo-upload-overview-hood",
                "answer": {
                    "value": {
                        "index-1": "damage-photo-upload-overview-hood-index-1"
                    },
                    "fileUploaded": true
                }
            },
            {
                "questionId": "damage-photo-upload-detail-hood",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            },
            {
                "questionId": "damage-photo-upload-other",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            }
        ]
      }

      const URL2 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/page/page-04?locale=de`
      saveQuestions(b2bBody2,URL2,c.value)
    })

    cy.getCookie('access_token')
    .should('exist')
    .then((c) => {
      // save cookie until we need it
      //console.log(c)
      const fileToUpload = "airbag.jpg";
      const URL1 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/attachment/answer/damage-photo-upload-detail-hood/index-1?locale=de`
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
            },
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
            },
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
            },
            {
                "questionId": "damage-photo-upload-overview-hood",
                "answer": {
                    "value": {
                        "index-1": "damage-photo-upload-overview-hood-index-1"
                    },
                    "fileUploaded": true
                }
            },
            {
                "questionId": "damage-photo-upload-detail-hood",
                "answer": {
                    "value": {
                        "index-1": "damage-photo-upload-detail-hood-index-1"
                    },
                    "fileUploaded": true
                }
            },
            {
                "questionId": "damage-photo-upload-other",
                "answer": {
                    "value": {},
                    "fileUploaded": false
                }
            }
        ]
      }

      const URL2 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/page/page-04?locale=de`
      saveQuestions(b2bBody2,URL2,c.value)
    })

    cy.getCookie('access_token')
    .should('exist')
    .then((c) => {
      // save cookie until we need it
      //console.log(c)
      const fileToUpload = "airbag.jpg";
      const URL1 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/attachment/answer/damage-photo-upload-other/index-1?locale=de`
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
            },
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
            },
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
            },
            {
                "questionId": "damage-photo-upload-overview-hood",
                "answer": {
                    "value": {
                        "index-1": "damage-photo-upload-overview-hood-index-1"
                    },
                    "fileUploaded": true
                }
            },
            {
                "questionId": "damage-photo-upload-detail-hood",
                "answer": {
                    "value": {
                        "index-1": "damage-photo-upload-detail-hood-index-1"
                    },
                    "fileUploaded": true
                }
            },
            {
                "questionId": "damage-photo-upload-other",
                "answer": {
                    "value": {
                        "index-1": "damage-photo-upload-other-index-1"
                    },
                    "fileUploaded": true
                }
            }
        ]
      }

      const URL2 = `${baseUrl_lp}questionnaire/${Cypress.env(`questionnaireId`)}/page/page-04?locale=de`
      saveQuestions(b2bBody2,URL2,c.value)
    })

    cy.get('button[type="submit"]').contains('Weiter').click()

    //page-04
    cy.get('button[type="submit"]').contains('Weiter').click()

    //"summary-page"
    cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()


  })
})

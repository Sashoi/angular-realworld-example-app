
/// <reference types="cypress" />

import file from '../fixtures/vinsArray.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/hukVehicleZone.log'
const pdfPath = 'cypress/fixtures/Pdf/'

describe('Huk-comprehensive-self-service-Vehicle_Zone', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Login to the app', () =>{
    //cy.loginToApplication()
    console.clear()
    cy.intercept('GET', `/questionnaire/*/picture/vehicleZones?colour=007d40&areas=&locale=de`).as('vehicleZones')
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    //cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPage')
    cy.intercept('GET',  `/questionnaire/*/currentPage?offset=*&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*//picture/clickableCar*`).as('clickableCar')
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
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const $requestTimeout = 60000;
  const executePost = true
  const generatePdfCondition = true

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

  function getBodyType($car) {
    cy.get('@authorization').then(function (token) {
      cy.get('@questionnaireId').then(function (questionnaireId) {
        const options = {
          method: 'GET',
          url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
          headers:  {
            'Accept': '*/*',
            'Accept-Encoding':'gzip, deflate, br',
            'Content-Type': 'application/json',
            token,
            'timeout' : 50000
          }
        };
        cy.request(options).then(
          (response) => {
          expect(response.status).to.eq(200) // true
          const bodyType = response.body.supportInformation.bodyType
          console.log(`supportInformation.bodyType: ${bodyType}.`)
          cy.then(function () {
            questionnaire.bodyType = bodyType
          })
          cy.readFile(logFilename).then((text) => {
            const addRow = `vin: ${$car[0]} expected: ${$car[1].padStart(18, ' ')} real: ${bodyType.padStart(18, ' ')} desc: ${$car[3]} \n`
            text += addRow
            cy.writeFile(logFilename, text)
          })
        }) //request(options)
      }) //get('@questionnaireId'
    }) //get('@authorization'
  }

  const file1 = [
    ["WF03XXTTG3MG53806", "Minibus", "01.01.2017", "Ford Tourneo 08/2021"],
    ["WF0KXXTTRKMC81361", "VanMidPanel", "01.01.2020", "Ford Transit 06/2021"]
  ]
  file.forEach($car => {
    it(`Huk-comprehensive-self-service-Vehicle_Zone vin : ${$car[0]}`, () =>{

      const $vin = $car[0]

      const userCredentials =  {
        "password": Cypress.env("passwordHukS"),
        "remoteUser": "",
        "sessionLanguage": "en",
        "userName": Cypress.env("usernameHukS")
      }

      let ran1 =  getRandomInt(10,99)
      let ran2 =  getRandomInt(100,999)
      let ran3 =  getRandomInt(100000,999999)


      console.log(`vin: ${$vin}`);
      const licenseplate = `SOF ${getRandomInt(1000,9999)}`
      console.log(`licenseplate: ${licenseplate}`);

      const $equipment_2_loading_doors = true

    cy.request('POST',`${baseUrl_lp}member/authenticate`,userCredentials)
    .its('body').then(body => {

      const token = body.accessToken
        cy.then(function () {
          questionnaire.authorization = `Bearer ${token}`
        })
        const claimNumber = ran1 + "-13-"+ ran2 + "/" + ran3 + "-Z";
        console.log(`claimNumber: ${claimNumber}`);

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
          //console.log(questionnaireId);
          const options1 = {
            method: 'GET',
            url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
            headers: headers_1
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
                        headers: headers_1
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

              cy.visit(requestUrl);
              cy.get('.loader').should('not.exist');
              currentPage()

              const nextButtonLabel ='Speichern und Weiter'
              const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
              cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

              cy.selectMultipleList('terms-of-service-acknowledgement-huk-coburg',0)
              nextBtn()

              //"page-02"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-02'){
                  nextBtn()
                }
              })

              //"page-03"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-03'){
                  cy.get('div[title="VAN"]').find('svg').find('g#selection-mask').click({ force: true})
                  cy.then(function () {
                    questionnaire.bodyType = 'Van'
                  })
                  nextBtn()
                }
              })

              getBodyType($car)

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

              //"page-05"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-05'){
                  cy.wait('@vehicleZones',{requestTimeout : $requestTimeout}).then(xhr => {
                    expect(xhr.response.statusCode).to.equal(200)
                    cy.selectSVG_VZ('roof')
                    cy.selectSVG_VZ('windshield')
                    nextBtn()
                  })
                }
              })


              //"page-06"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-06'){
                  cy.selectSingleList('airbag-deployed',0)
                  cy.selectSingleList('underbody-damage-type2',0)
                  nextBtn()
                }
              })


              //"page-07"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-07'){
                  cy.get('div.svg-selection-container[title="Dach"]').click('center');
                  cy.wait(1000);
                  nextBtn()
                }
              })

              const PathTo ='D://Projects/Cypress/bondar-artem/angular-realworld-example-app/cypress/fixtures/'
              //"page-08"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-08'){
                  uploadImage('vehicle-registration-part-1-photo-upload',PathTo,`registration-part-1.jpg`)
                  nextBtn()
                }
              })



              //"page-09" - new
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-09'){
                  cy.selectSingleList('unrepaired-pre-damages',0)
                  cy.wait('@vehicleZones',{requestTimeout : $requestTimeout}).then(xhr => {
                    expect(xhr.response.statusCode).to.equal(200)
                    //cy.get('svg').find('g#front-left').children('path').eq(1).click({force: true });
                    cy.selectSVG_VZ('front-left')
                    cy.selectSVG_VZ('front-center')
                    cy.selectSVG_VZ('front-right')
                    nextBtn()
                  })
                }
              })


              //"page-10"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-10'){
                  uploadImage('vehicle-interior-front-photo-upload',PathTo,`interior-front.jpg`)
                  uploadImage('vehicle-dashboard-odometer-photo-upload',PathTo,`image dashboard-odometer.jpg`)
                  cy.get('input[data-test="vehicle-mileage-question-type-vehicle-mileage"]').type('123456')
                  nextBtn()
                }
              })

              //"page-11"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-11'){
                  uploadImage('vehicle-right-front-photo-upload',PathTo,`vehicle-right-front-photo.jpg`)
                  uploadImage('vehicle-left-rear-photo-upload',PathTo,`vehicle-left-rear-photo1.jpg`)
                  nextBtn()
                }
              })

              //"page-12"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-12'){
                  uploadImage('damage-photo-upload-overview-vehicle-front-left-top-side',PathTo,`airbag1.jpg`)
                  uploadImage('damage-photo-upload-overview-vehicle-front-right-top-side',PathTo,`airbag2.jpg`)
                  uploadImage('damage-photo-upload-overview-roof-front-left-top-side',PathTo,`airbag3.jpg`)
                  uploadImage('damage-photo-upload-overview-roof-front-right-top-side',PathTo,`airbag4.jpg`)
                  uploadImage('damage-photo-upload-overview-roof-rear-right-top-side',PathTo,`airbag5.jpg`)
                  uploadImage('damage-photo-upload-overview-roof-rear-left-top-side',PathTo,`airbag6.jpg`)
                  nextBtn()
                }
              })

              //"page-13"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-13'){
                  uploadImage('damage-photo-upload-overview-roof',PathTo,`roof.jpg`)
                  if(false){
                    cy.get('form#damage-photo-upload-overview-roof').find('button').contains(' Beschädigung markieren ').click({ force: true });
                    cy.get('q-image-analytics-popup').find('div.popup-damage-types').find('input[type="checkbox"]').contains('Kratzer ').click({ force: true });
                  }
                  uploadImage('damage-photo-upload-detail-roof',PathTo,`roof-d.jpg`)
                  nextBtn()
                }
              })


              //"page-14" "pageShowCriteria" 'loss-cause': 'glass'
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-14'){
                  nextBtn()
                }
              })

              //"page-15"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-15'){
                  uploadImage('unrepaired-pre-damages-photo-upload',PathTo,`hood-npu1.jpg`)
                  uploadImage('unrepaired-pre-damages-photo-upload',PathTo,`hood-npu2.jpg`)
                  uploadImage('unrepaired-pre-damages-photo-upload',PathTo,`hood-npu3.jpg`)
                  nextBtn()
                }
              })

              //"page-16"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-16'){
                  uploadImage('police-ranger-report-photo-upload',PathTo,`police-ranger-report-photo-upload.png`)
                  uploadImage('incident-location-photo-upload',PathTo,`incident-location-photo-upload-1.jpg`)
                  uploadImage('incident-location-photo-upload',PathTo,`incident-location-photo-upload-2.jpg`)
                  uploadImage('incident-location-photo-upload',PathTo,`incident-location-photo-upload-3.jpg`)
                  nextBtn()
                }
              })

              //"page-17"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'page-17'){
                  cy.selectSingleList('vehicle-location-equals-home-address',0)
                  nextBtn()
                }
              })

              //"summary-page"
              cy.get('@goingPageId').then(function (aliasValue) {
                if (aliasValue == 'summary-page'){
                  if(executePost){
                    //cy.postQuestionnaire() does not work
                    cy.get('button[type="submit"][data-test="questionnaire-complete-button"]').click({ force: true, timeout: 5000 });

                    cy.wait('@postPage',{requestTimeout : $requestTimeout, responseTimeout: $requestTimeout}).then(xhr => {
                      cy.postPost(xhr,false)
                      if (generatePdfCondition){
                        console.log(`Cypress.env('notificationId') = ${Cypress.env('notificationId')}`)
                        // let pdf_template = 'dekra_schadenbilder'
                        // cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
                        // pdf_template = 'dekra_abschlussbericht'
                        // cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
                      } //if
                    }) //cy
                  }
                }
              })
            })
          })
        })
      })
    }) // it Huk

    it(`Generate PDFs for ${$car[0]}`, function () {

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

  })  //forEach
})  //describe

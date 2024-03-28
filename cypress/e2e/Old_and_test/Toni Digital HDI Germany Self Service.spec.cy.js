/// <reference types="cypress" />

//const cypress = require("cypress");

describe('Execute b2b/integration/toni-digital/hdiLiabilitySelfService', () =>{
  beforeEach('Login to the app', () =>{
    //cy.loginToApplication()
  })

  const $dev = Cypress.env("dev");
  const fileToUpload_1 = "registration-part-1.jpg";
  const fileToUpload_2 = "airbag.jpg";

  const timeoutFileUpload = 10000;
  const timeoutClick = 4000;

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
  it('Execute b2b/integration/toni-digital/hdiLiabilitySelfService', () =>{

    const userCredentials =  {
      "password": Cypress.env("passwordHukS"),
      "remoteUser": "",
      "sessionLanguage": "en",
      "userName": Cypress.env("usernameHukS")
    }

    const claim1 = makeid(7)
    const claim2 = getRandomInt(10000,99999)


    const licensePlate = `AA ${getRandomInt(100,999)}`

    const claimNumber = claim1 + claim2  // "21PFQ017602MR" works for reopen
    const vin =  "W0L0XCR975E026845"//; "WVWZZZ6RZGY304402" w, "VF3VEAHXKLZ080921" w, "WDB1704351F077666" w, "WBAUB310X0VN69014" w, "WAUZZZ4B73N015435" w, "W0L0XCR975E026845" w;

    cy.request('POST',`https://${$dev}.spearhead-ag.ch/member/authenticate`,userCredentials)
        .its('body').then(body => {

          const token = body.accessToken
          cy.wrap(token).as('token')

          const b2bBody = {
            "qas": [
                {
                    "questionId": "questionnaire-locale",
                    "answer": [
                        "en"
                    ]
                },
                {
                    "questionId": "insurance-type",
                    "answer": [
                        "motorcycle"
                    ]
                },
                {
                    "questionId": "workflow-type",
                    "answer": [
                        "call-center"
                    ]
                },
                {
                    "questionId": "coverage-type",
                    "answer": [
                        "liability"
                    ]
                },
                {
                    "questionId": "coverage-type-info",
                    "answer": [
                        "collision"
                    ]
                },
                {
                    "questionId": "eMail-insurance-client",
                    "answer": [
                        "sivanchevski@soft2run.com"
                    ]
                },
                {
                    "questionId": "firstName-insurance-client",
                    "answer": [
                        "Moritz"
                    ]
                },
                {
                    "questionId": "lastName-insurance-client",
                    "answer": [
                        "Chapuisat"
                    ]
                },
                {
                    "questionId": "mobilePhoneNumber-insurance-client",
                    "answer": [
                        "0791234567"
                    ]
                },
                {
                    "questionId": "zipCode-insurance-client",
                    "answer": [
                        "1202"
                    ]
                },
                {
                    "questionId": "loss-cause",
                    "answer": "collision"
                },
                {
                    "questionId": "number-of-vehicles",
                    "answer": "two"
                },
                {
                    "questionId": "incident-reporter-country",
                    "answer": "DE"
                },
                {
                    "questionId": "vehicle-first-registration-date",
                    "answer": "2024-02-01"
                },
                {
                    "questionId": "vehicle-mileage",
                    "answer": {
                        "unit": "km",
                        "value": 23525,
                        "fileUploaded": "false"
                    }
                },
                {
                    "questionId": "incident-reporter-type",
                    "answer": "private-person"
                },
                {
                    "questionId": "collision-type-others-description",
                    "answer": "3534"
                },
                {
                    "questionId": "loss-circumstances-details-claimant",
                    "answer": "collision-parking-leaving"
                },
                {
                    "questionId": "loss-circumstances-details-counterparty",
                    "answer": "collision-private-incoming"
                },
                {
                    "questionId": "client-vehicle-license-plate",
                    "answer": licensePlate
                },
                {
                    "questionId": "incident-reporter-first-name",
                    "answer": "Jhon"
                },
                {
                    "questionId": "incident-reporter-last-name",
                    "answer": "Smith"
                },
                {
                    "questionId": "incident-reporter-phone-number",
                    "answer": "555555"
                },
                {
                    "questionId": "incident-reporter-street-name",
                    "answer": "Street name"
                },
                {
                    "questionId": "incident-reporter-street-number",
                    "answer": "333"
                },
                {
                    "questionId": "incident-reporter-zip-code",
                    "answer": "10115"
                },
                {
                    "questionId": "incident-reporter-place",
                    "answer": "55555555"
                },
                {
                    "questionId": "incident-reporter-email",
                    "answer": "sivanchevski@soft2run.com"
                }
            ],
            "supportInformation": {
                "vin": vin,
                "claimNumber": claimNumber,
                "workflowType": "hdiLiabilitySelfService"
            }
        }

        const authorization = `Bearer ${ token }`;
        const options = {
          method: 'POST',
          url: `https://${$dev}.spearhead-ag.ch:443/b2b/integration/toni-digital/hdiLiabilitySelfService`,
          body: b2bBody,
          headers: {
            'Accept': '*/*',
            'Accept-Encoding':'gzip, deflate, br',
            'Content-Type': 'application/json',
            authorization,
        }};
        cy.request(options).then(
          (response) => {
            // response.body is automatically serialized into JSON
            expect(response.status).to.eq(200) // true

            const questionnaireId = response.body.questionnaireId;
            console.log(`questionnaireId:${questionnaireId}`);
            const uiUrl = response.body.uiUrl;
            console.log(`uiUrl:${uiUrl}`);

            cy.visit(uiUrl)
            cy.get('.loader')
            .should('not.exist')
            cy.wait(1000)
          })
        cy.wait(1000)

        cy.get('button[type="submit"]')
        .contains('Weiter').click()


        //pageId: "page-02"
        if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666"){
          cy.get('input#incident-place-street-name-input').type('Street name')
          cy.get('input#incident-place-street-number-input').type('123')
          cy.get('input#incident-place-zip-code-input').type('10115')
          cy.get('input#incident-place-city-input').type('Berlin')
          cy.get('div#damaged-objects').find('label[for="damaged-objects_0"]').click({ force: true })
          cy.get('div#accident-responsible').find('label[for="accident-responsible_0"]').click({ force: true })
          cy.get('div#vehicle-driver').find('label[for="vehicle-driver_0"]').click({ force: true })
          cy.get('div#alcohol-drugs-overfatigue-while-driving').find('label[for="alcohol-drugs-overfatigue-while-driving_1"]').click({ force: true })
          cy.get('div#excessive-speed-while-driving').find('label[for="excessive-speed-while-driving_1"]').click({ force: true })
          cy.get('div#police-informed').find('label[for="police-informed_1"]').click({ force: true })
          cy.get('div#accident-protocol').find('label[for="accident-protocol_0"]').click({ force: true })
        }

        if (vin == "VF3VEAHXKLZ080921"){
          cy.get('div#equipment-slide-door').find('label[for="equipment-slide-door_1"]').click({ force: true })
          cy.get('div#equipment-2-loading-doors').find('label[for="equipment-2-loading-doors_0"]').click({ force: true })
          cy.get('div#equipment-length').find('label[for="equipment-length_0"]').click({ force: true })
          cy.get('div#equipment-height').find('label[for="equipment-height_0"]').click({ force: true })
          cy.get('div#equipment-vehicle-rear-glassed').find('label[for="equipment-vehicle-rear-glassed_0"]').click({ force: true })
          cy.get('div#vehicle-customized-interior').find('label[for="vehicle-customized-interior_0"]').click({ force: true })
        }


        cy.get('button[type="submit"]')
        .contains('Weiter').click()
        cy.wait(1000)

        if (vin == "VF3VEAHXKLZ080921" || vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845"){
          cy.get('input#incident-place-street-name-input').type('Street name')
          cy.get('input#incident-place-street-number-input').type('123')
          cy.get('input#incident-place-zip-code-input').type('10115')
          cy.get('input#incident-place-city-input').type('Berlin')
          cy.get('div#damaged-objects').find('label[for="damaged-objects_0"]').click({ force: true })
          cy.get('div#accident-responsible').find('label[for="accident-responsible_0"]').click({ force: true })
          cy.get('div#vehicle-driver').find('label[for="vehicle-driver_0"]').click({ force: true })
          cy.get('div#alcohol-drugs-overfatigue-while-driving').find('label[for="alcohol-drugs-overfatigue-while-driving_1"]').click({ force: true })
          cy.get('div#excessive-speed-while-driving').find('label[for="excessive-speed-while-driving_1"]').click({ force: true })
          cy.get('div#police-informed').find('label[for="police-informed_1"]').click({ force: true })
          cy.get('div#accident-protocol').find('label[for="accident-protocol_0"]').click({ force: true })
          cy.get('button[type="submit"]')
          .contains('Weiter').click()
          cy.wait(1000)
        }

        //pageId: "page-03"


        //hood
        cy.get('svg').find('#hood').click()


        //grill
        cy.get('svg').find('#grill').click()


        //form_def or front_bumper_gray or front-bumper
        if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666"){
          cy.get('svg').find('#form_def').click()
        }
        if (vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845"){
          cy.get('svg').find('#front-bumper').click()
        }
        if (vin == "VF3VEAHXKLZ080921"){
          cy.get('svg').find('#front_bumper_gray').click()
        }

        cy.get('svg').find('#exhaust').click()
        cy.get('svg').find('#towing-hook').click()
        cy.get('svg').find('#airbag').click()

        cy.get('button[type="submit"]')
        .contains('Weiter').click()

        //pageId: "page-04"
        cy.get('div#vehicle-damage-repaired').find('label[for="vehicle-damage-repaired_0"]').click({ force: true })
        cy.get('input#repair-location-zip-code-input').type('10115')

        cy.get('button[type="submit"]')
        .contains('Weiter').click()

        //pageId: "page-05"
        // skip photo-upload
        //cy.get('div#vehicle-registration-part-1-photo-upload').find('label[for="multiple-upload-skip__vehicle-registration-part-1-photo-upload"]').click({ force: true })

        // do not skip photo-upload
        cy.toniHdiPhotosUpload($dev,'05',fileToUpload_1,timeoutFileUpload);

        cy.get('button[type="submit"]')
        .contains('Weiter').click()

        //pageId: "page-06"
        // skip photo-upload
        // cy.get('div#vehicle-right-front-photo-upload').find('label[for="multiple-upload-skip__vehicle-right-front-photo-upload"]').click({ force: true })
        // cy.get('div#vehicle-left-rear-photo-upload').find('label[for="multiple-upload-skip__vehicle-left-rear-photo-upload"]').click({ force: true })

        // do not skip photo-upload
        cy.toniHdiPhotosUpload2($dev,'06',fileToUpload_2,timeoutFileUpload,2);
        //cy.toniHdiPhotosUpload2($dev,'06',fileToUpload_2,timeoutFileUpload);


        cy.get('button[type="submit"]')
        .contains('Weiter').click()

        //pageId: "page-07"
        cy.get('div#damage-photo-upload-overview-hood').find('label[for="multiple-upload-skip__damage-photo-upload-overview-hood"]').click({ force: true })
        cy.get('div#damage-photo-upload-detail-hood').find('label[for="multiple-upload-skip__damage-photo-upload-detail-hood"]').click({ force: true })

        cy.get('div#damage-photo-upload-overview-front-bumper').find('label[for="multiple-upload-skip__damage-photo-upload-overview-front-bumper"]').click({ force: true })
        cy.get('div#damage-photo-upload-detail-front-bumper').find('label[for="multiple-upload-skip__damage-photo-upload-detail-front-bumper"]').click({ force: true })

        cy.get('div#damage-photo-upload-overview-grill').find('label[for="multiple-upload-skip__damage-photo-upload-overview-grill"]').click({ force: true })
        cy.get('div#damage-photo-upload-detail-grill').find('label[for="multiple-upload-skip__damage-photo-upload-detail-grill"]').click({ force: true })

        cy.get('div#damage-photo-upload-overview-towing-hook').find('label[for="multiple-upload-skip__damage-photo-upload-overview-towing-hook"]').click({ force: true })
        cy.get('div#damage-photo-upload-detail-towing-hook').find('label[for="multiple-upload-skip__damage-photo-upload-detail-towing-hook"]').click({ force: true })

        cy.get('div#damage-photo-upload-overview-exhaust').find('label[for="multiple-upload-skip__damage-photo-upload-overview-exhaust"]').click({ force: true })
        cy.get('div#damage-photo-upload-detail-exhaust').find('label[for="multiple-upload-skip__damage-photo-upload-detail-exhaust"]').click({ force: true })

        cy.get('div#damage-photo-upload-overview-airbag').find('label[for="multiple-upload-skip__damage-photo-upload-overview-airbag"]').click({ force: true })
        cy.get('div#damage-photo-upload-detail-airbag').find('label[for="multiple-upload-skip__damage-photo-upload-detail-airbag"]').click({ force: true })
        //



        cy.get('button[type="submit"]')
        .contains('Weiter').click()
        cy.wait(3000)

        //pageId:"summary-page"
        cy.get('textarea#summary-message-from-client-textarea').type('Hier können Sie eine persönliche Mitteilung für das Schadenteam eintragen.')
        cy.get('div#receive-confirmation-by').find('label[for="receive-confirmation-by_0"]').click({ force: true })
        cy.get('div#summary-confirmation-acknowledgement').find('label[for="summary-confirmation-acknowledgement_0"]').click({ force: true })


        if (false) {
          cy.intercept('POST', `https://${$dev}.spearhead-ag.ch/questionnaire/*/post?locale=de`).as('postPost')

          //pageId: "summary-page"

          cy.get('button[type="submit"]')
          .contains('Senden').click()

          cy.wait('@postPost').then(xhr => {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(200)
            const notificationId = xhr.response.body.notification.id;
            console.log(`notificationId:${notificationId}`);
            const requestedInformation = xhr.response.body.notification.body.requestedInformation;
            console.log(`requestedInformation:${requestedInformation}`);
            if (requestedInformation != null && requestedInformation.length > 0){
              requestedInformation.forEach((element, index) => {
                console.log(`requestedInformation[${index}]:`);
                console.log(`questionnaireId:${element.questionnaireId}`);
                console.log(`workflowType:${element.workflowType}`);
                console.log(`templateId:${element.templateId}`);
                console.log(`requestUrl:${element.requestUrl}`);
              });
              if (false) {
                cy.visit(requestedInformation[0].requestUrl)
                cy.get('.loader')
                .should('not.exist')
                cy.wait(1000)
              }
            }
          })
      }

    })
  })
})

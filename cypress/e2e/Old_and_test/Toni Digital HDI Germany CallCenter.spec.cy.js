/// <reference types="cypress" />

describe('Execute b2b/integration/toni-digital/hdiLiabilityCallCenter', () =>{

  beforeEach('Login to the app', () =>{
    //cy.loginToApplication()
    console.clear()
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
    cy.intercept('GET',  `/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
    cy.intercept('POST', '/questionnaire/*/page/page-*?navigateTo=next&offset=120&locale=de').as('nextPage')
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
  it('Execute b2b/integration/toni-digital/hdiLiabilityCallCenter', () =>{
    const $requestTimeout = 30000;
    const $dev = Cypress.env("dev");
    const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
    const userCredentials =  {
      "password": Cypress.env("passwordHukS"),
      "remoteUser": "",
      "sessionLanguage": "en",
      "userName": Cypress.env("usernameHukS")
    }

    let claim1 = makeid(7)
    let claim2 = getRandomInt(10000,99999)

    let claimNumber = claim1 + claim2  // "21PFQ017602MR" works for reopen
    let licenseplate = `NRW ${getRandomInt(1,9)}-${getRandomInt(100,999)}`
    const vins = ["WF0KXXTTRKMC81361","6FPPXXMJ2PCD55635","WVWZZZ6RZGY304402" , "VF3VEAHXKLZ080921" , "WDB1704351F077666" , "WBAUB310X0VN69014" , "WAUZZZ4B73N015435" , "W0L0XCR975E026845"]
    let vin =  vins[getRandomInt(0,vins.length)]//;
    vin = '6FPPXXMJ2PCD55635';
    const photos_available = false;
    const selectAllParts = true;
    const $equipment_2_loading_doors = true
    const executePost = false
    console.log(`vin:${vin}`);

    cy.request('POST',`${baseUrl_lp}/member/authenticate`,userCredentials)
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
                    "answer": licenseplate
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
                    "answer": "Sofia"
                },
                {
                    "questionId": "incident-reporter-email",
                    "answer": "sivanchevski@soft2run.com"
                }
            ],
            "supportInformation": {
                "vin": vin,
                "claimNumber": claimNumber,
                "workflowType": "hdiLiabilityCallCenter"
            }
        }

        const authorization = `Bearer ${ token }`;
        const options = {
          method: 'POST',
          url: `${baseUrl_lp}b2b/integration/toni-digital/hdiLiabilityCallCenter`,
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
            cy.get('.loader').should('not.exist')
            cy.wait('@currentPage',{requestTimeout : $requestTimeout}).then(xhr => {
              expect(xhr.response.statusCode).to.equal(200)
              console.log(`Comming page ${xhr.response.body.pageId} - ${xhr.response.body.uiBlocks[0].label.content}.`)
              //printUiBlocks(xhr.response.body.uiBlocks)
            })

            const nextButtonLabel ='Weiter'
            const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
            cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')


            if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361"){
              cy.wait(2000)
              cy.get('div#equipment-slide-door').find('label[for="equipment-slide-door_1"]').click({ force: true})
              if ($equipment_2_loading_doors){
                cy.get('div#equipment-2-loading-doors').find('label[for="equipment-2-loading-doors_1"]').click({ force: true })

              }
              else {
                cy.get('div#equipment-2-loading-doors').find('label[for="equipment-2-loading-doors_0"]').click({ force: true })

              }
              cy.get('div#equipment-length').find('label[for="equipment-length_0"]').click({ force: true })
              cy.get('div#equipment-height').find('label[for="equipment-height_0"]').click({ force: true })
              cy.get('div#equipment-vehicle-rear-glassed').find('label[for="equipment-vehicle-rear-glassed_0"]').click({ force: true })
              cy.get('div#vehicle-customized-interior').find('label[for="vehicle-customized-interior_0"]').click({ force: true })
            }

            if (vin =='6FPPXXMJ2PCD55635'){
              cy.get('div#equipment-loading-area-cover-type').find('label[for="equipment-loading-area-cover-type_1"]').click({ force: true })
            }
            cy.wait(2000)
            cy.get('@nextBtn').click({ force: true })
            cy.wait('@nextPage',{requestTimeout : $requestTimeout}).then(xhr => {
              expect(xhr.response.statusCode).to.equal(200)
              console.log(`Comming page ${xhr.response.body.pageId} - ${xhr.response.body.uiBlocks[0].label.content}.`)
            })


            //pageId: "page-02"
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

            cy.get('@nextBtn').click({ force: true })
            cy.wait('@nextPage',{requestTimeout : $requestTimeout}).then(xhr => {
              expect(xhr.response.statusCode).to.equal(200)
              console.log(`Comming page ${xhr.response.body.pageId} - ${xhr.response.body.uiBlocks[0].label.content}.`)
            })

            //pageId: "page-03"
            cy.get('div#vehicle-damage-repaired').find('label[for="vehicle-damage-repaired_0"]').click({ force: true })
            cy.get('input#repair-location-zip-code-input').type('10115')

            //exhaust
            cy.get('svg').find(`g#exhaust`).click({ force: true })

            //towing-hook if check does not calc iBox
            if (false){
              cy.get('svg').find(`g#towing-hook`).click({ force: true })
              cy.get('div#towing-hook-equipment-towhook-type').find('label[for="towing-hook-equipment-towhook-type_0"]').click({ force: true })
              cy.get('div#towing-hook-damage-type').find('label[for="towing-hook-damage-type_0"]').click({ force: true })
            }

            //underbody  if check does not calc iBox
            //cy.get('svg').find(`g#underbody`).click({ force: true })

            //airbag
            cy.get('svg').find(`g#airbag`).click({ force: true })


            //right-taillight
            cy.get('svg').find(`g#right-taillight`).click({ force: true })
            cy.get('div#right-taillight-equipment-led-rear-lights').find('label[for="right-taillight-equipment-led-rear-lights_0"]').click({ force: true })

            //left-taillight
            cy.get('svg').find(`g#left-taillight`).click({ force: true })
            cy.get('div#left-taillight-equipment-led-rear-lights').find('label[for="left-taillight-equipment-led-rear-lights_0"]').click({ force: true })

            if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361") {
              cy.get('div#loading-floor-area-bend').find('label[for="loading-floor-area-bend_0"]').click({ force: true })
            }

            //load-doors and rear-windows
            if ((vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361") && $equipment_2_loading_doors){
              cy.get('svg').find('g#right-load-door').click({ force: true })
              cy.get('div#right-load-door-damage-type').find('label[for="right-load-door-damage-type_1"]').click({ force: true })
              cy.get('div#right-load-door-damage-size').find('label[for="right-load-door-damage-size_2"]').click({ force: true })
              cy.get('svg').find('g#left-load-door').click({ force: true })
              cy.get('div#left-load-door-damage-type').find('label[for="left-load-door-damage-type_1"]').click({ force: true })
              cy.get('div#left-load-door-damage-size').find('label[for="left-load-door-damage-size_2"]').click({ force: true })
              cy.get('svg').find('g#LCV_both_sliding').find('g#left-rear-door-window').click({ force: true })
              cy.get('svg').find('g#LCV_both_sliding').find('g#right-rear-door-window').click({ force: true })
            }
            //load-doors and rear-windows
            if ((vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361") && !$equipment_2_loading_doors){
              cy.get('svg').find('g#tailgate').click({ force: true })
              cy.get('div#tailgate-still-open-close-easily').find('label[for="tailgate-still-open-close-easily_1"]').click({ force: true })
              cy.get('div#tailgate-damage-type').find('label[for="tailgate-damage-type_1"]').click({ force: true })
              cy.get('div#tailgate-damage-size').find('label[for="tailgate-damage-size_2"]').click({ force: true })
              cy.get('svg').find('g#LCV_sliding_driver_tailgate').find('g#rear-window').click({ force: true })
            }

            if (selectAllParts){

              //right-mirror
              cy.get('svg').find(`g#right-mirror`).click({ force: true })
              if (vin == "WAUZZZ4B73N015435" || vin == "WDB1704351F077666" || vin == "6FPPXXMJ2PCD55635"){
                cy.get('div#right-mirror-equipment-intelligent-mirrors').find('label[for="right-mirror-equipment-intelligent-mirrors_0"]').click({ force: true })
              }
              cy.get('div#right-mirror-still-working').find('label[for="right-mirror-still-working_0"]').click({ force: true })
              cy.get('div#right-mirror-damage-type').find('label[for="right-mirror-damage-type_0"]').click({ force: true })
              cy.get('div#right-mirror-damage-type').find('label[for="right-mirror-damage-type_1"]').click({ force: true })
              cy.get('div#right-mirror-damage-type').find('label[for="right-mirror-damage-type_2"]').click({ force: true })
              cy.get('div#right-mirror-damage-type').find('label[for="right-mirror-damage-type_3"]').click({ force: true })


              //left-mirror
              cy.get('svg').find(`g#left-mirror`).click({ force: true })
              if (vin == "WAUZZZ4B73N015435" || vin == "WDB1704351F077666" || vin == "6FPPXXMJ2PCD55635"){
                cy.get('div#left-mirror-equipment-intelligent-mirrors').find('label[for="left-mirror-equipment-intelligent-mirrors_0"]').click({ force: true })
              }
              cy.get('div#left-mirror-still-working').find('label[for="left-mirror-still-working_0"]').click({ force: true })
              cy.get('div#left-mirror-damage-type').find('label[for="left-mirror-damage-type_0"]').click({ force: true })
              cy.get('div#left-mirror-damage-type').find('label[for="left-mirror-damage-type_1"]').click({ force: true })
              cy.get('div#left-mirror-damage-type').find('label[for="left-mirror-damage-type_2"]').click({ force: true })
              cy.get('div#left-mirror-damage-type').find('label[for="left-mirror-damage-type_3"]').click({ force: true })


              //right-front-wheel
              cy.get('svg').find(`g#right-front-wheel`).click({ force: true })
              cy.get('div#right-front-wheel-equipment-rims-type').find('label[for="right-front-wheel-equipment-rims-type_0"]').click({ force: true })
              cy.get('div#right-front-wheel-damage-type').find('label[for="right-front-wheel-damage-type_1"]').click({ force: true })

              //right-rear-wheel
              cy.get('svg').find(`g#right-rear-wheel`).click({ force: true })
              cy.get('div#right-rear-wheel-equipment-rims-type').find('label[for="right-rear-wheel-equipment-rims-type_0"]').click({ force: true })
              cy.get('div#right-rear-wheel-damage-type').find('label[for="right-rear-wheel-damage-type_1"]').click({ force: true })

              //right-front-wheel-tire
              cy.get('svg').find(`g#right-front-wheel-tire`).click({ force: true })

              //right-rear-wheel-tire
              cy.get('svg').find(`g#right-rear-wheel-tire`).click({ force: true })

              //left-front-wheel
              cy.get('svg').find(`g#left-front-wheel`).click({ force: true })
              cy.get('div#left-front-wheel-equipment-rims-type').find('label[for="left-front-wheel-equipment-rims-type_0"]').click({ force: true })
              cy.get('div#left-front-wheel-damage-type').find('label[for="left-front-wheel-damage-type_1"]').click({ force: true })

              //left-front-wheel-tire
              cy.get('svg').find(`g#left-front-wheel-tire`).click({ force: true })

              //left-rear-wheel
              cy.get('svg').find(`g#left-rear-wheel`).click({ force: true })
              cy.get('div#left-rear-wheel-equipment-rims-type').find('label[for="left-rear-wheel-equipment-rims-type_0"]').click({ force: true })
              cy.get('div#left-rear-wheel-damage-type').find('label[for="left-rear-wheel-damage-type_1"]').click({ force: true })

              //left-rear-wheel-tire
              cy.get('svg').find(`g#left-rear-wheel-tire`).click({ force: true })

              //right-headlight
              if (true && vin != "WAUZZZ4B73N015435") { //for this vin questions are pre-answered
                cy.get('svg').find(`g#right-headlight`).click({ force: true })
                cy.get('div#right-headlight-equipment-enhanced-headlight-system').find('label[for="right-headlight-equipment-enhanced-headlight-system_0"]').click({ force: true })
                cy.get('div#right-headlight-loose-shifted-by-hand').find('label[for="right-headlight-loose-shifted-by-hand_0"]').click({ force: true })
                //checked by default
                //cy.get('div#right-headlight-damage-type').find('label[for="right-headlight-damage-type_2"]').click({ force: true })
              }
              if (true && vin == "WAUZZZ4B73N015435") {
                cy.get('svg').find(`g#right-headlight`).click({ force: true })
              }

              //left-headlight
              if (true && vin != "WAUZZZ4B73N015435") {  ////for this vin questions are pre-answered
                cy.get('svg').find(`g#left-headlight`).click({ force: true })
                cy.get('div#left-headlight-equipment-enhanced-headlight-system').find('label[for="left-headlight-equipment-enhanced-headlight-system_0"]').click({ force: true })
                cy.get('div#left-headlight-loose-shifted-by-hand').find('label[for="left-headlight-loose-shifted-by-hand_0"]').click({ force: true })
                //checked by default
                //cy.get('div#left-headlight-damage-type').find('label[for="left-headlight-damage-type_2"]').click({ force: true })
              }
              if (true && vin == "WAUZZZ4B73N015435") {  ////for this vin questions are pre-answered
                cy.get('svg').find(`g#left-headlight`).click({ force: true })
              }

              //hood
              cy.get('svg').find('#hood').click()
              cy.get('div#hood-damage-type').find('label[for="hood-damage-type_1"]').click({ force: true })
              cy.get('div#hood-damage-size').find('label[for="hood-damage-size_2"]').click({ force: true })

              //grill
              cy.get('svg').find('#grill').click()
              cy.get('div#grill-damage-type').find('label[for="grill-damage-type_1"]').click({ force: true })

              //right-front-additional-light
              cy.get('svg').find(`g#right-front-additional-light`).click({ force: true })

              //left-front-additional-light
              cy.get('svg').find(`g#left-front-additional-light`).click({ force: true })


              //left-front-fender
              cy.get('svg').find(`g#left-front-fender`).click({ force: true })
              cy.get('div#left-front-fender-damage-type').find('label[for="left-front-fender-damage-type_2"]').click({ force: true })
              cy.get('div#left-front-fender-damage-size').find('label[for="left-front-fender-damage-size_2"]').click({ force: true })

              //right-front-fender
              cy.get('svg').find('g#right-front-fender').click({ force: true })
              cy.get('div#right-front-fender-damage-type').find('label[for="right-front-fender-damage-type_2"]').click({ force: true })
              cy.get('div#right-front-fender-damage-size').find('label[for="right-front-fender-damage-size_2"]').click({ force: true })

              //form_def or front_bumper_gray or front-bumper
              if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666"){
                cy.get('svg').find('g#form_def').click({ force: true })
                if (vin == "WDB1704351F077666"){
                  cy.get('div#front-bumper-equipment-parking-aid-front').find('label[for="front-bumper-equipment-parking-aid-front_0"]').click({ force: true })
                }
              }
              if (vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845" || vin == "WF0KXXTTRKMC81361"){
                cy.get('svg').find('#front-bumper').click({ force: true })
                cy.get('div#front-bumper-equipment-parking-aid-front').find('label[for="front-bumper-equipment-parking-aid-front_0"]').click({ force: true })
              }
              if (vin == "VF3VEAHXKLZ080921" || vin == "6FPPXXMJ2PCD55635"){
                cy.get('svg').find('#front_bumper_gray').click({ force: true })
                cy.get('div#front-bumper-equipment-parking-aid-front').find('label[for="front-bumper-equipment-parking-aid-front_0"]').click({ force: true })
                if (vin == "VF3VEAHXKLZ080921") {
                  cy.get('div#loading-floor-area-bend').find('label[for="loading-floor-area-bend_0"]').click({ force: true })
                }
              }



              if (vin != "WBAUB310X0VN69014" && vin != "W0L0XCR975E026845" && vin != "WF0KXXTTRKMC81361"){
                cy.get('div#front-bumper-equipment-fog-lights').find('label[for="front-bumper-equipment-fog-lights_0"]').click({ force: true })
              }
              cy.get('div#front-bumper-damage-type').find('label[for="front-bumper-damage-type_2"]').click({ force: true })
              cy.get('div#front-bumper-damage-size').find('label[for="front-bumper-damage-size_2"]').click({ force: true })

              //windshield
              cy.get('svg').find('#windshield').click({ force: true })

              if (vin != "WF0KXXTTRKMC81361"){
                cy.get('div#windshield-equipment-windshield-electric').find('label[for="windshield-equipment-windshield-electric_0"]').click({ force: true })
              }
              cy.get('div#windshield-damage-type').find('label[for="windshield-damage-type_2"]').click({ force: true })
              cy.get('div#windshield-damage-size-crack-bigger-2cm').find('label[for="windshield-damage-size-crack-bigger-2cm_0"]').click({ force: true })
              if (vin != "6FPPXXMJ2PCD55635"){
                  cy.get('g#zone-d[data-name="2d_hb_windshield_d"]').click({ force: true }) // .first() if multiple appear
              }
              if (vin == "6FPPXXMJ2PCD55635"){
                cy.get('g#zone-d[data-name="4d_pickup_windshield_d"]').click({ force: true })
              }


              //roof
              cy.get('svg').find('g#roof').click({ force: true })
              cy.get('div#roof-damage-type').find('label[for="roof-damage-type_0"]').click({ force: true })

              //left-front-door
              cy.get('svg').find('g#left-front-door').click({ force: true })
              cy.get('div#left-front-door-still-open-close-easily').find('label[for="left-front-door-still-open-close-easily_1"]').click({ force: true })
              cy.get('div#left-front-door-still-working').find('label[for="left-front-door-still-working_1"]').click({ force: true })
              cy.get('div#left-front-door-damage-type').find('label[for="left-front-door-damage-type_1"]').click({ force: true })
              cy.get('div#left-front-door-damage-size').find('label[for="left-front-door-damage-size_2"]').click({ force: true })

              //left-front-door_window_and_handle
              cy.get('svg').find('g#left-front-door-window').click({ force: true })

              //right-front-door
              cy.get('svg').find('g#right-front-door').click({ force: true })
              cy.get('div#right-front-door-still-open-close-easily').find('label[for="right-front-door-still-open-close-easily_1"]').click({ force: true })
              cy.get('div#right-front-door-still-working').find('label[for="right-front-door-still-working_1"]').click({ force: true })
              cy.get('div#right-front-door-damage-type').find('label[for="right-front-door-damage-type_1"]').click({ force: true })
              cy.get('div#right-front-door-damage-size').find('label[for="right-front-door-damage-size_2"]').click({ force: true })

              //right-front-door_window_and_handle
              cy.get('svg').find('g#right-front-door-window').click({ force: true })

              //left-rear-door
              if (vin == "WVWZZZ6RZGY304402" || vin == "WAUZZZ4B73N015435" || vin == "WF0KXXTTRKMC81361"){
                cy.get('svg').find('g#left-rear-door').click({ force: true })
                cy.get('div#left-rear-door-still-working').find('label[for="left-rear-door-still-working_1"]').click({ force: true })
                cy.get('div#left-rear-door-damage-type').find('label[for="left-rear-door-damage-type_1"]').click({ force: true })
                cy.get('div#left-rear-door-damage-size').find('label[for="left-rear-door-damage-size_2"]').click({ force: true })
              }

              //left-rear-door-window
              if (vin != "VF3VEAHXKLZ080921" && vin != "WF0KXXTTRKMC81361"){
                cy.get('svg').find('g#left-rear-door-window').click({ force: true })
              }

              //right-rear-door
              if (vin == "WVWZZZ6RZGY304402" || vin == "WAUZZZ4B73N015435"){
                cy.get('svg').find('g#right-rear-door').click({ force: true })
                cy.get('div#right-rear-door-still-working').find('label[for="right-rear-door-still-working_1"]').click({ force: true })
                cy.get('div#right-rear-door-damage-type').find('label[for="right-rear-door-damage-type_1"]').click({ force: true })
                cy.get('div#right-rear-door-damage-size').find('label[for="right-rear-door-damage-size_2"]').click({ force: true })
              }

              //right-rear-door
              if (vin == "6FPPXXMJ2PCD55635"){
                cy.get('svg').find('g#right-rear-door').click({ force: true })
                cy.get('div#right-rear-door-still-open-close-easily').find('label[for="right-rear-door-still-open-close-easily_1"]').click({ force: true })
                cy.get('div#right-rear-door-still-working').find('label[for="right-rear-door-still-working_1"]').click({ force: true })
                cy.get('div#right-rear-door-damage-type').find('label[for="right-rear-door-damage-type_1"]').click({ force: true })
                cy.get('div#right-rear-door-damage-size').find('label[for="right-rear-door-damage-size_2"]').click({ force: true })

              }

              //right-rear-door-window
              if (vin != "VF3VEAHXKLZ080921" && vin != "WF0KXXTTRKMC81361"){
                cy.get('svg').find('g#right-rear-door-window').click({ force: true })
              }

              //left-sill
              cy.get('svg').find('g#left-sill').click({ force: true })
              cy.get('div#left-sill-damage-type').find('label[for="left-sill-damage-type_1"]').click({ force: true })
              cy.get('div#left-sill-damage-size').find('label[for="left-sill-damage-size_3"]').click({ force: true })

              //right-sill
              cy.get('svg').find('g#right-sill').click({ force: true })
              cy.get('div#right-sill-damage-type').find('label[for="right-sill-damage-type_1"]').click({ force: true })
              cy.get('div#right-sill-damage-size').find('label[for="right-sill-damage-size_3"]').click({ force: true })

              //tailgate and rear-window
              if (vin == "WVWZZZ6RZGY304402" || vin == "WDB1704351F077666" || vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845" || vin == "6FPPXXMJ2PCD55635"){
                cy.get('svg').find('g#rear-window').click({ force: true })
                cy.get('svg').find('g#tailgate').click({ force: true })
                cy.get('div#tailgate-still-open-close-easily').find('label[for="tailgate-still-open-close-easily_1"]').click({ force: true })
                cy.get('div#tailgate-damage-type').find('label[for="tailgate-damage-type_1"]').click({ force: true })
                cy.get('div#tailgate-damage-size').find('label[for="tailgate-damage-size_2"]').click({ force: true })
              }


              //rear-bumper
              cy.get('svg').find('g#rear-bumper').click({ force: true })
              if (vin == "VF3VEAHXKLZ080921" || vin == "WDB1704351F077666" || vin == "WBAUB310X0VN69014" || vin == "WAUZZZ4B73N015435" || vin == "W0L0XCR975E026845" || vin == "6FPPXXMJ2PCD55635"){
                cy.get('div#rear-bumper-equipment-parking-aid-rear').find('label[for="rear-bumper-equipment-parking-aid-rear_1"]').click({ force: true })
              }
              if (vin == "WVWZZZ6RZGY304402") {
                // already selected
                //cy.get('div#rear-bumper-equipment-parking-aid-rear').find('label[for="rear-bumper-equipment-parking-aid-rear_1"]').click({ force: true })
              }
              cy.get('div#rear-bumper-damage-type').find('label[for="rear-bumper-damage-type_1"]').click({ force: true })
              cy.get('div#rear-bumper-damage-size').find('label[for="rear-bumper-damage-size_2"]').click({ force: true })

              //left-rear-side-panel
              cy.get('svg').find('g#left-rear-side-panel').click({ force: true })
              cy.get('div#left-rear-side-panel-damage-type').find('label[for="left-rear-side-panel-damage-type_1"]').click({ force: true })
              cy.get('div#left-rear-side-panel-damage-size').find('label[for="left-rear-side-panel-damage-size_3"]').click({ force: true })


              //right-rear-side-panel
              cy.get('svg').find('g#right-rear-side-panel').click({ force: true })
              cy.get('div#right-rear-side-panel-damage-type').find('label[for="right-rear-side-panel-damage-type_1"]').click({ force: true })
              cy.get('div#right-rear-side-panel-damage-size').find('label[for="right-rear-side-panel-damage-size_3"]').click({ force: true })

              //left-rear-door
              if (vin == "VF3VEAHXKLZ080921" || vin == "6FPPXXMJ2PCD55635"){
                cy.get('svg').find('g#left-rear-door').click({ force: true })
                cy.get('div#left-rear-door-still-open-close-easily').find('label[for="left-rear-door-still-open-close-easily_1"]').click({ force: true })
                cy.get('div#left-rear-door-still-working').find('label[for="left-rear-door-still-working_1"]').click({ force: true })
                cy.get('div#left-rear-door-damage-type').find('label[for="left-rear-door-damage-type_1"]').click({ force: true })
                cy.get('div#left-rear-door-damage-size').find('label[for="left-rear-door-damage-size_2"]').click({ force: true })
              }

              //right-middle-side-panel
              if (vin == "VF3VEAHXKLZ080921" || vin == "WF0KXXTTRKMC81361"){
                cy.get('svg').find('g#right-middle-side-panel').click({ force: true })
                cy.get('div#right-middle-side-panel-damage-type').find('label[for="right-middle-side-panel-damage-type_1"]').click({ force: true })
                cy.get('div#right-middle-side-panel-damage-size').find('label[for="right-middle-side-panel-damage-size_3"]').click({ force: true })
              }
            }

            cy.get('@nextBtn').click({ force: true })
            cy.wait('@nextPage',{requestTimeout : $requestTimeout}).then(xhr => {
              expect(xhr.response.statusCode).to.equal(200)
              console.log(`Comming page ${xhr.response.body.pageId} - ${xhr.response.body.uiBlocks[0].label.content}.`)
            })

            //pageId: "page-04"
            //const triageRecomm = getRandomInt(0, 4)
            //cy.wait(6000)
            cy.get('div#triage-recommendation').find('label[for="triage-recommendation_3"]').should('be.visible');
            cy.get('div#triage-recommendation').find('label[for="triage-recommendation_3"]').click({ force: true , timeout : 20000})

            cy.get('@nextBtn').click({ force: true })
            cy.wait('@nextPage',{requestTimeout : $requestTimeout}).then(xhr => {
              expect(xhr.response.statusCode).to.equal(200)
              console.log(`Comming page ${xhr.response.body.pageId} - ${xhr.response.body.uiBlocks[0].label.content}.`)
            })

            //pageId: "page-05"
            if (photos_available){
              cy.get('div#photos-available').find('label[for="photos-available_0"]').click({ force: true })
              cy.get('div#receive-upload-link-by').find('label[for="receive-upload-link-by_0"]').click({ force: true })
              cy.get('input#claimant-email-for-upload-link-input').type('sivanchevski@soft2run.com')
          } else {
              cy.get('div#photos-available').find('label[for="photos-available_1"]').click({ force: true })
              const reason = getRandomInt(0,4)
              cy.get('div#photos-not-available-because').find(`label[for="photos-not-available-because_${reason}"]`).click({ force: true })
          }

          cy.get('@nextBtn').click({ force: true })
          cy.wait('@nextPage',{requestTimeout : $requestTimeout}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming page ${xhr.response.body.pageId} - ${xhr.response.body.uiBlocks[0].label.content}.`)
          })

          if(executePost){
            //pageId: "summary-page"
            cy.get('button[type="submit"]').contains('Senden').click()

            cy.wait('@postPost',{requestTimeout : 10000}).then(xhr => {
              console.log(xhr)
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
      })
    })
  })
})

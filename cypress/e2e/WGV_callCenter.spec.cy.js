/// <reference types="cypress" />

describe('Execute b2b/integration/wgv/callCenter', () =>{
  beforeEach('Login to the app', () =>{
    //cy.loginToApplication()
    console.clear()
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

  it('Execute b2b/integration/wgv/callCenter', () =>{

    const $dev = Cypress.env("dev");
      const userCredentials =  {
        "password": Cypress.env("passwordHukS"),
        "remoteUser": "",
        "sessionLanguage": "en",
        "userName": Cypress.env("usernameHukS")
      }

      let claim1 = makeid(5)
      let claim2 = getRandomInt(10000,99999)


      cy.request('POST',`https://${$dev}.spearhead-ag.ch/member/authenticate`,userCredentials)
        .its('body').then(body => {
          const token = body.accessToken
          cy.wrap(token).as('token')

          let claimNumber = claim1 + claim2
          //claimNumber = 'tP44l36300' // reopen

          const $vins_old = ['WDB1704351F077666','WBAUB310X0VN69014','WVWZZZ6RZGY304402','VF7SA5FS0BW550414','WAUZZZ4B73N015435 ','WDB2083441T069719',
                         'W0L0XCR975E026845','VF3VEAHXKLZ080921'];
          const $vins = ['WDB1704351F077666','WBAUB310X0VN69014','WVWZZZ6RZGY304402','WAUZZZ4B73N015435','VF3VEAHXKLZ080921', 'W0L0XCR975E026845'];

          const vin_random = getRandomInt(0,$vins.length);
          //const vin_random = 5;
          // 'WVWZZZ6RZGY304402' works
          // 'WDB1704351F077666' works
          // 'VF3VEAHXKLZ080921' works
          // 'WBAUB310X0VN69014' works
          // 'WAUZZZ4B73N015435' works
          // 'W0L0XCR975E026845' works
          const $vin = $vins[vin_random];
          console.log($vin)

          //"claimType": "01", - "liability"          templateId: "wgv_liability_call_center"
          //"claimType": "02", - "fullCoverage"       templateId: "wgv_comprehensive_call_center"
          //"claimType": "03", - "partialCoverage"    templateId: "wgv_comprehensive_call_center"

          const b2bBody =  {
            "claimNumber": `${ claimNumber }`,
            "claimType": "53IV",  //01, 02, 03, 53IV
            "damageCause": "glass", // see "fixtures/damage_cause_mapping.json"
            "countryVehicleIdentification": "HSN/TSN",
             "vin": `${ $vin }`,
            "firstRegistrationDate": "2012-04-20",
            "licensePlate": `EH${ claim2 }BT`, //"EH1234BT"
            "notificationDetails1": {
              "equipmentList": [
                {}
              ],
              "gearType": "manual",
              "pointOfImpact": "1",
              "priorDamage": "no",
              "repairShopContract": false,
              "vehicleCondition": "bad",
              "vehicleManufacturer": "BMW",
              "vehicleModel": "3 Kombi"
            },
            "repairLocationZipCode": "1234",
            "responsibleClerk": {
              "firstName": "John",
              "lastName": "Wick",
              "phoneNumber": "0879123456",
              "salutation": "Mr",
              "type": "individual",
              "email": "sivanchevski@soft2run.com"
            }
          }

          const authorization = `Bearer ${ token }`;
          const contentType = `application/json`;
          //const accept =`*/*`;
          const options = {
            method: 'POST',
            url: `https://${$dev}.spearhead-ag.ch:443/b2b/integration/wgv/callCenter`,
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

              cy.visit(response.body.callCenterQuestionnaireUrl)
              cy.get('.loader')
              .should('not.exist')
              cy.wait(1000)

              const selector = 'div[title="Kollision mit einem Motorrad, Fahrrad oder Fussgänger"]'
              cy.get("body").then($body => {
                if ($body.find(selector).length > 0){

                  //pageId:"page-02"

                  console.log('find(selector)')
                  cy.get(selector).then($radio =>{
                    if(!$radio.hasClass('radio--checked')){
                      cy.wrap($radio).click()
                    }
                    cy.get('button[type="submit"]').click()
                  })
                }
              })
            })
            cy.wait(1000)

            //pageId:"page-02"

            cy.get('input#accident-date-input').type('20.04.2022')

            cy.get('div#accident-location')
            .find('div.radio[title="Innerorts"]').click()

            cy.get('div#loss-circumstances-details')
            .find('div.radio[title="Bei normaler Fahrt"]').click()

            const mileage = '1' + claim2;
            cy.get('div#vehicle-mileage')
            .find('input#vehicle-mileage-input').type(mileage)

            if($vin == 'VF3VEAHXKLZ080921'){
              cy.get('div#equipment-slide-door').find('label[for="equipment-slide-door_1"]').click({ force: true })
              cy.get('div#equipment-2-loading-doors').find('label[for="equipment-2-loading-doors_0"]').click({ force: true })
              cy.get('div#equipment-length').find('label[for="equipment-length_0"]').click({ force: true })
              cy.get('div#equipment-height').find('label[for="equipment-height_0"]').click({ force: true })
              cy.get('div#equipment-vehicle-rear-glassed').find('label[for="equipment-vehicle-rear-glassed_0"]').click({ force: true })
              cy.get('div#vehicle-customized-interior').find('label[for="vehicle-customized-interior_0"]').click({ force: true })
            }

            cy.get('button[type="submit"]')
            .contains('Weiter').click()

            //pageId:"page-03"

            //hood
            cy.get('svg').find('#hood').click()
            cy.get('div#hood-damage-type').find('label[for="hood-damage-type_0"]').click({ force: true })

            //roof
            cy.get('svg').find('#roof').click()
            cy.get('div#roof-damage-type').find('label[for="roof-damage-type_0"]').click({ force: true })
            if($vin == 'WDB1704351F077666' || $vin == 'W0L0XCR975E026845'){
              cy.get('div#roof-equipment-convertible-roof-material').find('label[for="roof-equipment-convertible-roof-material_0"]').click({ force: true })
            }
            if($vin == 'WBAUB310X0VN69014'){
              cy.get('div#roof-equipment-panorama-roof').find('label[for="roof-equipment-panorama-roof_0"]').click({ force: true })
            }

            //windshield
            cy.get('svg').find('#windshield').click({ force: true })
            cy.wait(500)

            if($vin == 'VF3VEAHXKLZ080921'){
              cy.get('div#loading-floor-area-bend').find('label[for="loading-floor-area-bend_0"]').click({ force: true })
            }

            cy.get('section#collapseExamplesection-windshield')
            .find('div#windshield-equipment-windshield-electric')
            .find('label[for="windshield-equipment-windshield-electric_0"]')
            .click()
            cy.get('section#collapseExamplesection-windshield')
            .find('div#windshield-damage-type')
            .find('label[for="windshield-damage-type_0"]')
            .click()
            cy.get('section#collapseExamplesection-windshield')
            .find('div#windshield-damage-type')
            .find('label[for="windshield-damage-type_2"]')
            .click()
            cy.get('g#windshield[data-name="2d_hb_windshield"]')
            .find('g#zone-b[data-name="2d_hb_windshield_b"]')
            .find('path#zone-b-overlay')
            .click({ force: true })
            cy.get('g#windshield[data-name="2d_hb_windshield"]')
            .find('g#zone-d[data-name="2d_hb_windshield_d"]')
            .click({ force: true })
            cy.get('section#collapseExamplesection-windshield')
            .find('div#windshield-damage-quantity')
            .find('label[for="windshield-damage-quantity_3"]')
            .click()
            cy.get('section#collapseExamplesection-windshield')
            .find('div#windshield-damage-size-scratch-bigger-5cm')
            .find('label[for="windshield-damage-size-scratch-bigger-5cm_0"]')
            .click()
            cy.get('section#collapseExamplesection-windshield')
            .find('div#windshield-damage-size-crack-bigger-2cm')
            .find('label[for="windshield-damage-size-crack-bigger-2cm_0"]')
            .click()

            cy.wait(500)
            cy.get('button[type="submit"]')
            cy.wait(500)
            .contains('Weiter').click({ force: true })
            cy.wait(500)

            //pageId:"page-04"

            cy.get('button[type="submit"]')
            .contains('Weiter').click()

            cy.intercept('POST', `https://${$dev}.spearhead-ag.ch/questionnaire/*/post?locale=de`).as('postPost')

            //pageId:"summary-page"
            cy.get('button[type="submit"]')
            .contains('Senden').click()

            cy.wait('@postPost').then(xhr => {
              //console.log(xhr)
              expect(xhr.response.statusCode).to.equal(200)
              const notificationId = xhr.response.body.notification.id;
              console.log(`notificationId:${notificationId}`);


              const b3bBody =  {
                "receiver": "sivanchevski@soft2run.com",
                "contact": {
                  "firstName": "Ssss",
                  "lastName": "Iiiii",
                  "email": "sivanchevski@soft2run.com",
                  "mobileNumber": "",
                  "type": "PERSON"
                },
                "emailTemplate": "wgv_request_email"
              }

              let _headers = {
                'Accept': '*/*',
                'Accept-Encoding':'gzip, deflate, br',
                'Content-Type': 'application/json',
                authorization,
              }


              const options2 = {
                method: 'POST',
                url: `https://${$dev}.spearhead-ag.ch:443//damage/notification/${notificationId}/requestInformation/wgv_comprehensive_self_service_app`,
                body: b3bBody,
                headers: _headers
              };

              cy.request(options2).then(
                (response) => {
                  // response.body is automatically serialized into JSON
                  expect(response.status).to.eq(200) // true
                  console.log(`wgv_comprehensive_self_service_app:`);
                  const requestedInformation = response.body.requestedInformation;
                  if (requestedInformation != null && requestedInformation.length > 0){
                    requestedInformation.forEach((element, index) => {
                      console.log(`ri[${index}]:`);
                      console.log(`questionnaireId:${element.questionnaireId}`);
                      console.log(`workflowType:${element.workflowType}`);
                      console.log(`templateId:${element.templateId}`);
                      console.log(`requestUrl:${element.requestUrl}`);
                    });

                  }
                  const qsr = response.body.qsr;
                  //console.log(qsr)
                })

                const options3 = {
                  method: 'POST',
                  url: `https://${$dev}.spearhead-ag.ch:443//damage/notification/${notificationId}/requestInformation/wgv_liability_self_service_app`,
                  body: b3bBody,
                  headers: _headers
                };

                cy.request(options3).then(
                  (response) => {
                    // response.body is automatically serialized into JSON
                    expect(response.status).to.eq(200) // true
                    console.log(`wgv_liability_self_service_app:`);
                    const requestedInformation = response.body.requestedInformation;
                    if (requestedInformation != null && requestedInformation.length > 0){
                      requestedInformation.forEach((element, index) => {
                        console.log(`ri[${index}]:`);
                        console.log(`questionnaireId:${element.questionnaireId}`);
                        console.log(`workflowType:${element.workflowType}`);
                        console.log(`templateId:${element.templateId}`);
                        console.log(`requestUrl:${element.requestUrl}`);
                      });

                    }
                    const qsr = response.body.qsr;
                    //console.log(qsr)
                  })


            })
      })
  })
})

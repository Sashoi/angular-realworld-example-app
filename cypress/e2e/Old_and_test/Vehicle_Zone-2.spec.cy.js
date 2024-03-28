/// <reference types="cypress" />

describe('Start and complete Vehicle_Zone questionnaire'
  // {
  //   "env": {
  //     "api_token": "api_token",
  //     "questionnaireId": "id",
  //     "damageNotificationId": "id",
  //     "questionnaire_url" : "url"
  //   }
  // }
  , () =>{
    beforeEach('Login to the app', () =>{
      //cy.loginToApplication()
    })

    const $dev = '3';
    const timeoutFileUpload = 10000;
    const timeoutClick = 4000;
    const fileToUpload = "registration-part-1.jpg";

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
    }


    it('Get token', () =>{
      const userCredentials =  {
        "password": Cypress.env("passwordHukS"),
        "remoteUser": "",
        "sessionLanguage": "en",
        "userName": Cypress.env("usernameHukS")
      }

      let ran1 =  getRandomInt(10,99)
      let ran2 =  getRandomInt(100,999)
      let ran3 =  getRandomInt(100000,999999)

      cy.request('POST',`https://dev0${$dev}.spearhead-ag.ch/member/authenticate`,userCredentials).then(
        (response) => {
          expect(response.status).to.eq(200) // true
          const token = response.body.accessToken
          //cy.wrap(token).as('token')
          Cypress.env("api_token",token)
        })
    })

    it('Create self-service-init questionnaire', () =>{
      cy.wait(2000)

      let ran1 =  getRandomInt(10,99)
      let ran2 =  getRandomInt(100,999)
      let ran3 =  getRandomInt(100000,999999)

      let claimNumber = ran1 + "-13-"+ ran2 + "/" + ran3 + "-Z";

      //pm.environment.set ("vins_for_test","ZFA25000002K44267"); // MiniBusMidPanel  Fiat Ducato
      //pm.environment.set ("vins_for_test","WDB1704351F077666");
      //pm.environment.set ("vins_for_test","WVWZZZ6RZGY304402");
      //pm.environment.set ("vins_for_test","6FPGXXMJ2GEL59891"); // Ford Ranger single cabine, Pick-up
      //pm.environment.set ("vins_for_test","6FPPXXMJ2PCD55635");   // Ford Ranger double cabine, Pick-up
      //pm.environment.set ("vins_for_test","WAUZZZ4B73N015435");     // AUD A6/S6/RS6 Sedan
      let vin = 'WBAUT31020F197739';
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
                "answer": [`${ vin }`]
            },
            {
                "questionId": "vehicle-first-registration-date",
                "answer": ["2019-10-01"]
            },
            {
                "questionId": "client-vehicle-license-plate",
                "answer": ["N-XX-12"]
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
      const authorization = `Bearer ${Cypress.env("api_token")}`;
      const options = {
            method: 'POST',
            url: `https://dev0${$dev}.spearhead-ag.ch:443/b2b/integration/huk/huk-comprehensive-self-service-init`,
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
          Cypress.env("questionnaireId",response.body.questionnaireId);
        }
      )
    })

    it('Get damageNotificationId', () =>{
      cy.wait(2000)
      console.log(Cypress.env("questionnaireId"))
      const authorization = `Bearer ${Cypress.env("api_token")}`;
      const options = {
        method: 'GET',
        url: `https://dev0${$dev}.spearhead-ag.ch:443/questionnaire/${Cypress.env("questionnaireId")}`,
        headers: {
          'Accept': '*/*',
          'Accept-Encoding':'gzip, deflate, br',
          'Content-Type': 'application/json',
          authorization,
        }
      };
      cy.request(options).then(
        (response) => {
          expect(response.status).to.eq(200) // true
          const damageNotificationId = response.body.supportInformation.damageNotificationId
          //console.log(damageNotificationId)
          //console.log(response.body)
          Cypress.env("damageNotificationId",damageNotificationId);
        }
      )
    })

    it('From DN get questionnaire Vehicle_Zone url', () =>{
        cy.wait(2000)
        console.log(Cypress.env("damageNotificationId"))
        const authorization = `Bearer ${Cypress.env("api_token")}`;
        const options = {
          method: 'GET',
          url: `https://dev0${$dev}.spearhead-ag.ch:443/damage/notification/${Cypress.env("damageNotificationId")}`,
          headers: {
            'Accept': '*/*',
            'Accept-Encoding':'gzip, deflate, br',
            'Content-Type': 'application/json',
            authorization,
          }
        };
        cy.request(options).then(
          (response) => {
            expect(response.status).to.eq(200) // true
            const questionnaireUrl = response.body.body.requestedInformation[0].requestUrl;
            //const questionnaireId2 = response.body.body.requestedInformation[0].questionnaireId;
            Cypress.env("questionnaire_url",questionnaireUrl);
          }
        )
      }
    )

    it('Start questionnaire Vehicle_Zone and fulfill page-01', () =>{
      cy.intercept('GET', `https://dev0${$dev}.spearhead-ag.ch/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
      cy.wait(4000)
      const questionnaireUrl = Cypress.env("questionnaire_url")
      console.log(questionnaireUrl)
      cy.visit(questionnaireUrl)
      cy.get('.loader').should('not.exist');
      cy.wait(1000);
      cy.wait('@currentPage').then(xhr => {
        //console.log(xhr)
        expect(xhr.response.statusCode).to.equal(200)
        const pageId = xhr.response.body.pageId;
        console.log(pageId)
        expect(pageId).to.eq('page-01') // true
      })

      cy.intercept('POST', `https://dev0${$dev}.spearhead-ag.ch/questionnaire/*/page/page-01?navigateTo=next&offset=120&locale=de`).as('navigateTo')
      cy.get('div#terms-of-service-acknowledgement-huk-coburg').find('label[for="terms-of-service-acknowledgement-huk-coburg_0"]').click({ force: true })
      cy.get('button[type="submit"]').click()
      cy.wait('@navigateTo').then(xhr => {
        //console.log(xhr)
        expect(xhr.response.statusCode).to.equal(200)
        const pageId = xhr.response.body.pageId;
        console.log(pageId)
        expect(pageId).to.eq('page-02') // true
      })
    })

    it('Fulfill page-02', () =>{
      cy.wait(4000)
      cy.intercept('GET', `https://dev0${$dev}.spearhead-ag.ch/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
      //cy.wait(4000)
      const questionnaireUrl = Cypress.env("questionnaire_url")
      console.log(questionnaireUrl)
      cy.visit(questionnaireUrl)
      cy.get('.loader').should('not.exist');
      cy.wait(1000);
      cy.wait('@currentPage').then(xhr => {
        //console.log(xhr)
        expect(xhr.response.statusCode).to.equal(200)
        const pageId = xhr.response.body.pageId;
        console.log(pageId)
        expect(pageId).to.eq('page-02') // true
      })
      cy.get('button[type="submit"]').click();
    })

    it('Fulfill page-05', () =>{
      cy.wait(4000)
      cy.intercept('GET', `https://dev0${$dev}.spearhead-ag.ch/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
      cy.wait(4000)
      const questionnaireUrl = Cypress.env("questionnaire_url")
      console.log(questionnaireUrl)
      cy.visit(questionnaireUrl)
      cy.get('.loader').should('not.exist');
      cy.wait(1000);
      cy.wait('@currentPage').then(xhr => {
        //console.log(xhr)
        expect(xhr.response.statusCode).to.equal(200)
        const pageId = xhr.response.body.pageId;
        console.log(pageId)
        expect(pageId).to.eq('page-05') // true
      })
      cy.get('g#roof').children('path').eq(1).click({force: true });
      cy.get('button[type="submit"]').click();
    })

    it('Fulfill page-06', () =>{
      cy.wait(4000)
      cy.intercept('GET', `https://dev0${$dev}.spearhead-ag.ch/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
      //cy.wait(4000)
      const questionnaireUrl = Cypress.env("questionnaire_url")
      console.log(questionnaireUrl)
      cy.visit(questionnaireUrl)
      cy.get('.loader').should('not.exist');
      cy.wait(1000);
      cy.wait('@currentPage').then(xhr => {
        //console.log(xhr)
        expect(xhr.response.statusCode).to.equal(200)
        const pageId = xhr.response.body.pageId;
        console.log(pageId)
        expect(pageId).to.eq('page-06') // true
      })
      cy.get('div.radio[title="Ja"]')
      .click('center',{multiple: true });
      cy.get('button[type="submit"]').click();
    })

    it('Fulfill page-07', () =>{
      cy.wait(4000)
      cy.intercept('GET', `https://dev0${$dev}.spearhead-ag.ch/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
      //cy.wait(4000)
      const questionnaireUrl = Cypress.env("questionnaire_url")
      console.log(questionnaireUrl)
      cy.visit(questionnaireUrl)
      cy.get('.loader').should('not.exist');
      cy.wait(1000);
      cy.wait('@currentPage').then(xhr => {
        //console.log(xhr)
        expect(xhr.response.statusCode).to.equal(200)
        const pageId = xhr.response.body.pageId;
        console.log(pageId)
        expect(pageId).to.eq('page-07') // true
      })
      cy.get('div.svg-selection-container[title="Dach"]').click('center');
      cy.get('button[type="submit"]').click();
    })

    it('Fulfill page-08', () =>{
      cy.wait(4000)
      cy.intercept('GET', `https://dev0${$dev}.spearhead-ag.ch/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
      //cy.wait(4000)
      const questionnaireUrl = Cypress.env("questionnaire_url")
      console.log(questionnaireUrl)
      cy.visit(questionnaireUrl)
      cy.get('.loader').should('not.exist');
      cy.wait(1000);
      cy.wait('@currentPage').then(xhr => {
        //console.log(xhr)
        expect(xhr.response.statusCode).to.equal(200)
        const pageId = xhr.response.body.pageId;
        console.log(pageId)
        expect(pageId).to.eq('page-08') // true
      })
      cy.fixture(fileToUpload, null).as('MyfileToUpload')
      cy.get('input[type=file]').selectFile('@MyfileToUpload',{ force: true, timeout: timeoutFileUpload})
      cy.wait(10000);
      cy.get('button[data-test="questionnaire-next-button"]').click({ force: true, timeout: timeoutClick });
    })

})

/// <reference types="cypress" />

describe('Start and complete vlv standalone questionnaire drag-n-drop', () => {

  beforeEach('Login to the app', () => {
    cy.intercept('POST', `/b2b/integration/vlv/vlv-comprehensive-call-center?identifyVehicleAsync=false`).as('postStart')
    console.clear()
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 40000;
  const executePost = true
  const interceptZurichStandalone = true

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }


  it('vlv Standalone', () => {

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
    $vin = 'WDB1704351F077666';
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


    cy.get('button[type="submit"]').contains('Weiter').click()

    //const PathTo ='D://Projects/Cypress/bondar-artem/angular-realworld-example-app/cypress/fixtures/'
    const PathTo = '../fixtures/'

    cy.get('form#vehicle-registration-part-1-photo-upload').find('button').selectFile(`${PathTo}registration-part-1.jpg`, {
      action: 'drag-drop',
    })

    cy.get('form#vehicle-right-front-photo-upload').find('button').selectFile(`${PathTo}airbag.jpg`, {
      action: 'drag-drop',
    })

    cy.get('form#vehicle-left-rear-photo-upload').find('button').selectFile(`${PathTo}airbag.jpg`, {
      action: 'drag-drop',
    })

    cy.get('form#vehicle-interior-front-photo-upload').find('button').selectFile(`${PathTo}interior-front.jpg`, {
      action: 'drag-drop',
    })

    cy.get('form#vehicle-dashboard-odometer-photo-upload').find('button').selectFile(`${PathTo}image dashboard-odometer.jpg`, {
      action: 'drag-drop',
    })

    cy.get('form#damage-photo-upload-overview-hood').find('button').selectFile(`${PathTo}airbag.jpg`, {
      action: 'drag-drop',
    })

    cy.get('form#damage-photo-upload-detail-hood').find('button').selectFile(`${PathTo}airbag.jpg`, {
      action: 'drag-drop',
    })

    cy.get('form#damage-photo-upload-other').find('button').selectFile(`${PathTo}airbag.jpg`, {
      action: 'drag-drop',
    })


    //page-04
    cy.get('button[type="submit"]').contains('Weiter').click()

    //"summary-page"
    cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()


  })
})

/// <reference types="cypress" />

const { resolveProjectReferencePath } = require("typescript")
import file from '../fixtures/vinsArray.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: ''  }
const logFilename = 'cypress/fixtures/hukComprehensiveCallCenter.log'

describe('Start and complete huk standalone questionnaire - huk_comprehensive_call_center', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {
    //cy.loginToHukStandalone()
    console.clear()
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
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
    cy.intercept('POST', `/b2b/integration/huk/huk-comprehensive-call-center?identifyVehicleAsync=false`).as('hukStandaloneCC')
    cy.wrap(goingPage).its('pageId').as('goingPageId')
    cy.wrap(goingPage).its('elements').as('goingPageElements')
    cy.wrap(questionnaire).its('Id').as('questionnaireId')
    cy.wrap(questionnaire).its('authorization').as('authorization')
    cy.wrap(questionnaire).its('bodyType').as('bodyType')
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 40000;
  const executePost = true

  function printUiBlocks(uiBlocks){
    uiBlocks.forEach((uiBlock, index1) => {
      uiBlock.elements.sections.forEach((section, index2) => {
        console.log(`section [${index1}][${index2}]: ${section.label.content}.`)
      })
    })
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
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
            if (title = xhr.response.body.uiBlocks[0].elements.sections.length > 0){
              title = xhr.response.body.uiBlocks[0].elements.sections[0].label.content
            }
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
    ["WDB1704351F077666","Cabrio",              "01.01.2004","MER SLK Cabrio"],
    ["WBAUB310X0VN69014","Hatch3",              "01.01.2012","BMW 1 Series Hatch3"]
]
  file.forEach($car => {
    it(`huk standalone - huk_comprehensive_call_center vin ${$car[0]}`, () => {

      const $vin = $car[0]

      cy.visit(`https://${$dev}.spearhead-ag.ch/ui/questionnaire/zurich/#/login?theme=huk`)
      // login
      cy.get('[placeholder="Email"]').type(Cypress.env("usernameHukS"))
      cy.get('[placeholder="Passwort"]').type(Cypress.env("passwordHukS"))
      cy.get('form').submit()

      cy.wait('@token',{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const access_token = xhr.response.body.access_token
        cy.then(function () {
          questionnaire.authorization = `Bearer ${access_token}`
        })
      })
      cy.wait(500)

      const intS1 = getRandomInt(10,99).toString()
      const intS2 = getRandomInt(100,999).toString()
      const intS3 = getRandomInt(100000,999999).toString()
      const $equipment_2_loading_doors = true

      const $claimTypes = ['30','31','32','33','34','35','36','37','38','39'];
      const claimType_random = getRandomInt(0,$claimTypes.length);
      const $claimType = $claimTypes[claimType_random];
      const claimNumber = `${intS1}-${$claimType}-${intS2}/${intS3}-S`
      const first_registration_date = '01.11.2003';

      console.log(`claimNumber: ${claimNumber}`)
      console.log(`vin: ${$vin}`)
      console.log(`first registration date: ${first_registration_date}`)


      // Fulfill standalone form
      cy.get('[name="claimNumber"]').type(claimNumber);
      cy.get('[data-test="standalone_vin"]').type($vin)
      cy.get('[data-test="standalone_licensePlate"]').type(`HCC ${intS2}`)
      cy.get('[class="btn btn-primary btn-submit"]').click()

      cy.wait('@hukStandaloneCC').then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        console.log(`questionnaireId: ${xhr.response.body.questionnaireId}`)
        cy.then(function () {
          questionnaire.Id = xhr.response.body.questionnaireId
        })
        console.log(`uiUrl: ${xhr.response.body.uiUrl}`)
      })
      cy.wait(1000)

      currentPage()
      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){  //Fahrzeugbeschreibung und Schadenhergang - page-01
          cy.get('#accident-date-input').type('01.11.2023')
          cy.get('#vehicle-first-registration-date-input').type(first_registration_date)
          cy.get('#vehicle-mileage-input').clear().type('123456')
          cy.selectSingleList('odometer-reading-source-display',0)
          cy.selectDropDown('select_buildPeriod',1)
          cy.selectSingleList('loss-cause',0)
          cy.selectSingleList('loss-circumstances-details',0)
          cy.selectSingleList('switch-to-self-service-workflow',1)
          cy.selectSingleList('insurance-policy-type',0)

          getBodyType($car)

          cy.get('@bodyType').then(function (bodyType) {
            if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
              cy.selectSingleList('vehicleStatus-VS40',1)
            }
            if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
              cy.selectSingleList('vehicleStatus-VS30',3)
              cy.selectSingleList('vehicleStatus-VS31',Number($equipment_2_loading_doors)) //0- "Eine Ladeklappe"; 1 - "Zwei Ladetüren"
              cy.selectSingleList('vehicleStatus-VS35',0)
              cy.selectSingleList('vehicleStatus-VS36',0)
              cy.selectSingleList('vehicleStatus-VS32',0)
              cy.selectSingleList('vehicleStatus-VS33',0)
            }
          })
          nextBtn()
        }
      })

      // Schadenbeschreibung - page-02
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          cy.wait('@clickableCar',{requestTimeout : $requestTimeout}).then(xhr => {
            expect(xhr.response.statusCode).to.equal(200)
            console.log(`Comming SVG with clickableCar`)

            if (xhr.response.body.search('g id="right-load-door"') > 0){
              //cy.selectSVG('right-load-door')
            }
            if (xhr.response.body.search('g id="left-load-door"') > 0){
              //cy.selectSVG('left-load-door')
            }
            if (xhr.response.body.search('g id="tailgate"') > 0){
              //cy.selectSVG('tailgate')
            }
            if (xhr.response.body.search('g id="hood"') > 0){
              cy.selectSVG('hood')
              cy.selectMultipleList('hood-DT2',0)
            }

            cy.selectSingleList('vehicle-safe-to-drive',0)
            cy.selectSingleList('vehicle-ready-to-drive',0)
            cy.selectSingleList('unrepaired-pre-damages',1)
            cy.selectSingleList('vehicle-damage-repaired',0)
            cy.get('textarea#unrepaired-pre-damages-description-textarea').clear().type('Bitte beschreiben Sie die unreparierten Vorschäden')
            cy.get('#repair-location-zip-code-input').clear().type('22222')

            if (xhr.response.body.search('g id="rightFrontWheelRim"') > 0){
              cy.selectSVG('rightFrontWheelRim')
              cy.wait(2000)
              cy.selectSingleList('rightFrontWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('rightFrontWheelRim-DT2',1)
            }

            if (xhr.response.body.search('g id="rightRearWheelRim"') > 0){
              cy.selectSVG('rightRearWheelRim')
              cy.selectSingleList('rightRearWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('rightRearWheelRim-DT2',0)
              cy.selectMultipleList('rightRearWheelRim-DT2',1)
            }
            if (xhr.response.body.search('g id="rightFrontTire"') > 0){
              cy.selectSVG('rightFrontTire')
            }
            if (xhr.response.body.search('g id="rightRearTire"') > 0){
              cy.selectSVG('rightRearTire')
            }
            if (xhr.response.body.search('g id="leftFrontWheelRim"') > 0){
              cy.selectSVG('leftFrontWheelRim')
              cy.selectSingleList('leftFrontWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('leftFrontWheelRim-DT2',1)
            }
            if (xhr.response.body.search('g id="leftRearWheelRim"') > 0){
              cy.selectSVG('leftRearWheelRim')
              cy.selectSingleList('leftRearWheelRim-FRW2\\.1',0)
              cy.selectMultipleList('leftRearWheelRim-DT2',0)
              cy.selectMultipleList('leftRearWheelRim-DT2',1)
            }
            if (xhr.response.body.search('g id="leftFrontTire"') > 0){
              cy.selectSVG('leftFrontTire')
            }
            if (xhr.response.body.search('g id="leftRearTire"') > 0){
              cy.selectSVG('leftRearTire')
            }

            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                cy.selectSingleList('vehicleStatus-VS34',1)
              }
            })
            nextBtn()
          })
        }
      })

      // Schadenbilder und Dokumente - page-03
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          cy.selectSingleList('photos-available',1)
          cy.selectSingleList('photos-not-available-because',2)
          nextBtn()
        }
      })

      // Regulierungs- und Handlungsempfehlung - page-04
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          nextBtn()
        }
      })
      //cy.then(() => this.skip())    // stop here


      //Zusammenfassung, post questionnaire - summary-page
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, questionnaireId:${Id}`);
          })
          if (executePost) {
            cy.get('button[type="submit"]').contains('Schadenanlage beenden').click()
            cy.wait('@postPost').then(xhr => {
              cy.postPost(xhr)
            })
          }
        }
      })
    })
  })
})

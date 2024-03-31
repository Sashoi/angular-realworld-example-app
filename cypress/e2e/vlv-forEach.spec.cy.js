/// <reference types="cypress" />

import file from '../fixtures/vinsArray.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: ''  }
const logFilename = 'cypress/fixtures/vlvStandalone.log'

describe('Start and complete vlv standalone questionnaire', () => {

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })

  beforeEach('Setting up integrations and common variables', () => {

    console.clear()
    cy.intercept('POST', `/b2b/integration/vlv/vlv-comprehensive-call-center?identifyVehicleAsync=false`).as('postStart')
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
    cy.intercept('GET',  `/questionnaire/*/currentPage?offset=120&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*//picture/clickableCar*`).as('clickableCar')
    cy.intercept('POST', '/questionnaire/*/page/page-*', (req) => {
      if (req.url.includes('navigateTo')) {
        req.alias = "nextPage"
      } else {
        req.alias = "savePage"
      }
    })
    cy.intercept('POST', `/member/oauth/token`).as('token')
    //cy.intercept('POST', `/b2b/integration/zurich/zurichStandalone`).as('zurichStandalone')
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
  const interceptZurichStandalone = true

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
          console.log(`supportInformation.bodyType : ${bodyType}.`)
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

  const loss_causeArray = ["Unfall", "Vandalismus", "Sturm", "Glasbruch", "Tierschaden"]
  const loss_cause = loss_causeArray[4]
  const file1 = [
    ["WVWZZZ7NZDV041367","MPV",                 "01.01.2011","VW Sharan MPV"]
  ]

  file1.forEach($car => {
    it(`vlv Standalone, vin ${$car[0]}`, () => {

      const $vin = $car[0]

      cy.visit(`${baseUrl_lp}ui/questionnaire/zurich/#/login?theme=vlv`)
      // login
      cy.get('[placeholder="Email"]').type(Cypress.env("usernameHukS"))
      cy.get('[placeholder="Passwort"]').type(Cypress.env("passwordHukS"))
      cy.get('form').submit()
      cy.wait(500)
      cy.wait('@token',{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const access_token = xhr.response.body.access_token
        cy.then(function () {
          questionnaire.authorization = `Bearer ${access_token}`
        })
      })  //wait @token
      cy.wait(500)

      const intS1 = getRandomInt(1000, 9999).toString()
      const intS2 = getRandomInt(1000, 9999).toString()
      const intS3 = getRandomInt(100, 999).toString()
      const intS4 = getRandomInt(0, 9).toString()
      const $equipment_2_loading_doors = true

      const nextButtonLabel ='Weiter'
      const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
      const claimNumber = `${intS1}.${intS2}/${intS3}-${intS4}`
      console.log(`claimNumber: ${claimNumber}`)

      console.log(`vin: ${$vin}, bodyType: ${$car[1]}, description: ${$car[3]}`)
      const licenseplate = `SOF ${getRandomInt(1,9)}-${getRandomInt(100,999)}`
      console.log(`licenseplate: ${licenseplate}`);

      cy.get('[name="claimNumber"]').type(claimNumber)
      cy.get('[data-test="standalone_vin"]').type($vin)
      cy.get('ng-select[data-test="standalone_lossCause"]').find('input[type="text"]').type(loss_cause,{force: true})
      cy.get('#firstRegistrationDate__input').type('10.05.2013')
      cy.get('#licensePlate').type(licenseplate)
      cy.get('#zipCode').type('2222')
      cy.get('[class="btn btn-primary btn-submit"]').click()
      cy.wait(500)

      cy.wait('@postStart').then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const questionnaireId = xhr.response.body.questionnaireId;
        cy.then(function () {
          questionnaire.Id = questionnaireId
        })
        console.log(`questionnaireId: ${questionnaireId}`)
      })
      cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')
      currentPage()

      //pageId: "page-01"
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-01'){
          if ( $vin == 'SALYL2RV8JA741831'){
            cy.wait(5000)
          }
          getBodyType($car)
          cy.get('#accident-date-input').type('01.11.2023')
          if (loss_cause == 'Unfall'){
            cy.selectSingleList('loss-circumstances-details',1)
            cy.selectSingleList('loss-circumstances-details',0)
          }
          if (loss_cause == 'Tierschaden'){
            cy.selectSingleList('animal-species',1)
            cy.selectSingleList('animal-owner-known',0)
            cy.selectSingleList('collision-with-animal',0)
            cy.selectSingleList('accident-witness-present',0)
            cy.selectSingleList('police-ranger-informed',0)
          }
          cy.get('#vehicle-mileage-input').clear().type('123456')
          if ($vin == 'WDB2083441T069719'){
            cy.selectDropDown('select_buildPeriod',1)
            cy.wait(2000)
          }
          cy.get('@bodyType').then(function (bodyType) {
            if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
              cy.wait(2000)
              cy.selectSingleList('equipment-slide-door',1)
              cy.selectSingleList('equipment-2-loading-doors',Number($equipment_2_loading_doors))

              cy.selectSingleList('equipment-length',0)
              cy.selectSingleList('equipment-height',0)
              cy.selectSingleList('equipment-vehicle-rear-glassed',0)
              cy.selectSingleList('vehicle-customized-interior',0)
            }
            if (bodyType == 'PickUpSingleCabine' || bodyType == 'PickUpDoubleCabine'){
              cy.wait(2000)
              cy.selectSingleList('equipment-loading-area-cover-type',1)
            }
          })
          nextBtn()
        }
      })


      //pageId:"page-02"
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-02'){
          if (loss_cause == 'Glasbruch'){
            cy.selectSVG('windshield')
            cy.selectSingleList('windshield-equipment-windshield-electric',0)
            cy.selectMultipleList('windshield-damage-type',0)
            cy.selectSingleList('windshield-damage-size-scratch-bigger-5cm',0)
          } else {
            cy.selectSingleList('vehicle-safe-to-drive',1)
            cy.selectSingleList('vehicle-ready-to-drive',1)
            cy.selectSingleList('unrepaired-pre-damages',0)
            cy.selectSingleList('vehicle-damage-repaired',1)
            cy.selectSingleList('cash-on-hand-settlement-preferred',1)
            cy.selectSingleList('repair-network-preferred',1)
            //hood
            cy.selectSVG('hood')
            cy.selectMultipleList('hood-damage-type',1)
            cy.selectSingleList('hood-damage-size',2)
            cy.get('@bodyType').then(function (bodyType) {
              if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                cy.selectSingleList('loading-floor-area-bend',0)
              }
            })
          }
          cy.wait(2000)
          nextBtn()
        }
      })

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-03'){
          nextBtn()
        }
      })

      const PathTo ='D://Projects/Cypress/bondar-artem/angular-realworld-example-app/cypress/fixtures/'
      //const PathTo = '../fixtures/'

      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'page-04'){
          uploadImage('vehicle-registration-part-1-photo-upload',PathTo,'registration-part-1.jpg')
          uploadImage('vehicle-right-front-photo-upload',PathTo,'vehicle-right-front-photo.jpg')
          uploadImage('vehicle-left-rear-photo-upload',PathTo,'vehicle-left-rear-photo1.jpg')
          uploadImage('vehicle-interior-front-photo-upload',PathTo,'interior-front.jpg')
          uploadImage('vehicle-dashboard-odometer-photo-upload',PathTo,'image dashboard-odometer.jpg')
          if (loss_cause != 'Glasbruch'){
            uploadImage('damage-photo-upload-overview-hood',PathTo,'hood.jpg')
            uploadImage('damage-photo-upload-detail-hood',PathTo,'hood-d.jpg')
          }
          uploadImage('damage-photo-upload-other',PathTo,'roof.jpg')
          nextBtn()
        }
      })

      //"summary-page"
      cy.get('@goingPageId').then(function (aliasValue) {
        if (aliasValue == 'summary-page'){
          cy.get('@questionnaireId').then(function (Id) {
            console.log(`from summary-page, saved questionnaireId: ${Id}`);
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
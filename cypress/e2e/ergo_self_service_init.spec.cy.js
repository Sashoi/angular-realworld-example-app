import { getRandomInt } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
//import b2bBody from '../fixtures/templates/ergoBody.xml'
import header from '../fixtures/headerXML.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/logs/ErgoSelfServiceInit.log'
const PathToImages ='cypress/fixtures/images/'
const b2bBody = 'cypress/fixtures/templates/ergoBody.xml'

describe('Ergo Self Service ini', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })
  beforeEach('Setting up integrations and common variables', () =>{
    cy.viewport('samsung-note9')
    console.clear()
    cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
    cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPage')
    cy.intercept('POST', `/questionnaire/*/update?locale=de`).as('updatePage')
    cy.intercept('GET', `/questionnaire/*/currentPage?offset=*&locale=de`).as('currentPage')
    cy.intercept('GET', `/questionnaire/*//picture/clickableCar*`).as('clickableCar')
    cy.intercept('GET', `/questionnaire/generic_elements/attachment/*-example*`).as('generic_elements')
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
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000
  const executePost = true

  function _waitFor(waitFor) {
    // if (waitFor == '@nextPage'){
    //   cy.get('@nextBtn').click({ force: true })
    // }
    cy.wait(waitFor,{requestTimeout : $requestTimeout}).then(xhr => {
        expect(xhr.response.statusCode).to.equal(200)
        const gPage = xhr.response.body.pageId
        let title = xhr.response.body.pageTitle
        if ((title.length <= 2)){
          title = xhr.response.body.uiBlocks[0].label.content
          if ((title.length <= 2)){
            if (xhr.response.body.uiBlocks[0].elements.sections !=null && xhr.response.body.uiBlocks[0].elements.sections.length > 0){
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
        if (false && waitFor == '@currentPage'){
          const nextUrl = xhr.response.body.links.next
          //"https://dev02.spearhead-ag.ch:443/questionnaire/7uRjDM92M9eWEhZVkBrSr/page/page-01?navigateTo=next"
          const startStr = '/questionnaire/'
          const endStr = '/page/page'
          const pos = nextUrl.indexOf(startStr) + startStr.length;
          const questionnaireId =  nextUrl.substring(pos, nextUrl.indexOf(endStr, pos));
          cy.then(function () {
            questionnaire.Id = questionnaireId
          })
          console.log(`questionnaireId: ${questionnaireId}`)
        }
    })
  }

  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    _waitFor('@nextPage')
  }

  function currentPage() {
    _waitFor('@currentPage')
  }

  const file1 = [

    [
      "",
      "MiniBusMidPanel",
      "01.01.2017",
      "Peugeot Expert 09/2020"
    ]
  ]

  file1.forEach($car => {
    it.only(`Execute /questionnaire/ergo_self_service_init with vin:${$car[0]}`, () =>{
      cy.readFile(b2bBody).then(xml => {
        const xmlDocument = new DOMParser().parseFromString(xml,'text/xml')
        let vin = xmlDocument.querySelector("Fin").textContent
        console.log(`vin: ${vin}`);
        let claimNumber = xmlDocument.querySelector("SchadenNummer").textContent
        console.log(`claimNumber: ${claimNumber}`);
        xmlDocument.querySelector("Fin").textContent = $car[0]
        xmlDocument.querySelector("SchadenNummer").textContent = `KS${getRandomInt(10000000,99999999)}-${getRandomInt(1000,9999)}`
        //<Bezeichnung>sivanchevski@soft2run.com</Bezeichnung>
        xmlDocument.querySelector("Bezeichnung").textContent = `sivanchevski1@soft2run.com`
        console.log(`vin: ${xmlDocument.querySelector("Fin").textContent}`);
        console.log(`claimNumber: ${xmlDocument.querySelector("SchadenNummer").textContent}`);
        const xmlString = new XMLSerializer().serializeToString(xmlDocument);


        cy.authenticate().then(function (authorization) {
          cy.then(function () {
            questionnaire.authorization = authorization
          })

          Cypress._.merge(header, {'authorization' : authorization});

          const options = {
            method: 'POST',
            url: `${baseUrl_lp}b2b/integration/dekra/ergo-self-service-init`,
            body: xmlString,
            headers: header
          };
          cy.request(options).then(
            (response) => {
            // response.body is automatically serialized into JSON
            expect(response.status).to.eq(201) // true
            const questionnaireId = response.body.questionnaireId
            console.log(`self-service-init questionnaireId: ${questionnaireId}`)
            const options2 = {
              method: 'GET',
              url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
              headers: header
            };
            cy.wait(1000) // 5000 time to create DN and send link via e-mail
            cy.request(options2).then(
              (response2) => {
              expect(response2.status).to.eq(200) // true
              console.log('supportInformation: '+JSON.stringify(response2.body.supportInformation))
              const damageNotificationId = response2.body.supportInformation.damageNotificationId
              cy.then(function () {
                questionnaire.notificationId = damageNotificationId
              })
              Cypress.env('notificationId', damageNotificationId)
              const options3 = {
                method: 'GET',
                url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
                headers: header
              }
              cy.request(options3).then(
                (response3) => {
                expect(response3.status).to.eq(200) // true
                const questionnaireUrl = response3.body.body.requestedInformation[0].requestUrl;
                const questionnaireId2 = response3.body.body.requestedInformation[0].questionnaireId;
                console.log(`Real questionnaireId: ${questionnaireId2}`)
                cy.then(function () {
                  questionnaire.Id = questionnaireId2
                })
                console.log(`questionnaireUrl: ${questionnaireUrl}`)
                cy.visit(questionnaireUrl,{log : false})

                const nextButtonLabel ='Speichern und Weiter'
                const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
                cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

                currentPage()

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-01'){
                    cy.getBodyType2($car,logFilename).then(function (bodyType) {
                      cy.then(function () {
                        questionnaire.bodyType = bodyType
                      })
                    })
                    cy.selectMultipleList('terms-of-service-acknowledgement',0)
                    //cy.getQuestionnaireInfo()
                    cy.wait(1000)
                    nextBtn()
                  }
                })
                //pageId: "page-02" pageShowCriteria 'client-vehicle-license-plate' != null && internalInformation.spearheadVehicle == null
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-02'){
                    cy.selectSingleList('vehicle-body-type',0)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-03" pageShowCriteria 'vehicle-body-type' = 'passenger-car' ||'lcv'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-03'){
                    cy.uploadImage('vehicle-registration-part-1-photo-upload-1',PathToImages,'registration-part-1.jpg')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })
                //pageId: "page-04" pageShowCriteria internalInformation.spearheadVehicle == null
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-04'){
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-05" pageShowCriteria "internalInformation.spearheadVehicle == null"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-05'){
                    cy.selectSingleList('hail-damage-glass-parts-lights',0)
                    cy.selectMultipleList('damaged-glass-parts-lights',0)
                    cy.selectMultipleList('damaged-glass-parts-lights',1)
                    cy.selectMultipleList('damaged-glass-parts-lights',2)
                    cy.selectMultipleList('damaged-glass-parts-lights',3)
                    cy.selectMultipleList('damaged-glass-parts-lights',4)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-06"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-06'){
                    cy.selectMultipleList('headlights-damage-type',0)
                    cy.selectMultipleList('headlights-damage-type',1)
                    cy.selectSingleList('headlights-still-working',1)
                    cy.selectMultipleList('windshield-damage-type',0)
                    cy.selectMultipleList('windshield-damage-type',1)
                    cy.selectMultipleList('headlights-damage-type',0)
                    cy.selectMultipleList('headlights-damage-type',1)
                    cy.selectMultipleList('mirrors-damage-type',0)
                    cy.selectMultipleList('mirrors-damage-type',1)
                    cy.selectSingleList('mirrors-still-working',1)
                    cy.selectMultipleList('taillights-damage-type',0)
                    cy.selectMultipleList('taillights-damage-type',1)
                    cy.selectSingleList('taillights-still-working',1)
                    nextBtn()
                  }
                })

                //pageId: "page-07"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-07'){
                    cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type('123321')
                    cy.selectSingleList('hail-damage-size',2)
                    cy.selectSingleList('entire-vehicle-damaged-by-hail',1)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-08" SVG pageShowCriteria 'entire-vehicle-damaged-by-hail' = 1
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-08'){
                    cy.selectSVG('hood')
                    cy.selectSVG('roof')
                    cy.selectSVG('windshield')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-09" pageShowCriteria 'entire-vehicle-damaged-by-hail' = 1
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-09'){
                    cy.selectSingleList('hail-damage-intensity',2)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-10" pageShowCriteria 'entire-vehicle-damaged-by-hail' = 0
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-10'){
                    cy.selectSingleList('damaged-vehicle-area-left-hail-damage-intensity',0)
                    cy.selectSingleList('damaged-vehicle-area-top-hail-damage-intensity',2)
                    cy.selectSingleList('damaged-vehicle-area-right-hail-damage-intensity',0)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-13" pageShowCriteria 'glass-parts-damaged-by-hail' == 'yes') || some glass 'selected-parts' == 'yes'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-13'){
                    cy.selectMultipleList('windshield-hail-damage-type',0)
                    cy.selectMultipleList('windshield-hail-damage-type',1)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-23" pageShowCriteria = true
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-23'){
                    cy.selectSingleList('client-salutation',1)
                    cy.get('div#client-first-name').find('input#client-first-name-input').type('firstName')
                    cy.get('div#client-last-name').find('input#client-last-name-input').type('lastName')
                    cy.get('div#client-phone-number').find('input#client-phone-number-input').type('1234567890')
                    cy.get('div#client-email').find('input#client-email-input').type('test@test.bg').blur()
                    const nextButtonLabel23 ='Schadenmeldung senden'
                    cy.get(selectorNextButton).contains(nextButtonLabel23).click()
                    _waitFor('@nextPage')
                  }
                })

                //pageId: "page-24" pageShowCriteria some glass part'-damage-type' == 'glass-broken') || some glass part'-still-working' == 'no'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-24'){
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'summary-page'){
                    cy.get('@questionnaireId').then(function (Id) {
                      console.log(`from summary-page, saved questionnaireId: ${Id}`);
                    })
                    if (executePost) {
                      cy.get('button[type="submit"]').contains('Senden').click()
                      cy.wait('@updatePage').then(xhr => {
                        if (xhr.response.statusCode != 200){
                          console.log(`status: ${xhr.response.statusCode}`);
                          console.log(`internalErrorCode: ${xhr.response.internalErrorCode}`);
                          console.log(`message: ${xhr.response.message}`);
                        }
                        expect(xhr.response.statusCode).to.equal(200)
                      })
                    }
                  }
                })
              }) //response3
            }) //response2
          })  //response
        }) //authorization
      })//readFile xml
    }) //it
  }) //forEach
})

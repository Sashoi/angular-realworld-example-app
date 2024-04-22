import { getRandomInt } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
//import b2bBody from '../fixtures/templates/ergoBody.xml'
import header from '../fixtures/headerXML.json'

const goingPage = { pageId: '', elements: []}
const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}
const logFilename = 'cypress/fixtures/logs/ErgoSelfServiceInit.log'
const PathToImages ='cypress/fixtures/images/'
const b2bBody = 'cypress/fixtures/templates/ergoBody.xml'

describe('Ergo Self Service init', () =>{

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
    cy.intercept('GET', `/questionnaire/*/picture/clickableCar*`).as('clickableCar')
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
  const entire_vehicle_damaged_by_hail = true
  const glass_parts_damaged_by_hail = true
  const client_email = Cypress.env("client_email")


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
        cy.readFile(logFilename).then((text) => {
          const addRow = `${gPage.padStart(18, ' ')}\n`
          text += addRow
          cy.writeFile(logFilename, text)
        })
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
    ["WVWZZZ3CZME020680","Station","01.09.2020","Passat Variant 1.4 TSI Plug-In-Hybrid DSG GTE"]
  ]

  file.forEach($car => {
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
                let questionnaireUrl = ''
                let questionnaireId2 = ''
                const requestedInformation = response3.body.body.requestedInformation
                if (requestedInformation != undefined && requestedInformation != null && requestedInformation.length > 0)
                {
                  console.log(`requestedInformation: ${response3.body.body.requestedInformation}`)
                  questionnaireUrl = response3.body.body.requestedInformation[0].requestUrl;
                  questionnaireId2 = response3.body.body.requestedInformation[0].questionnaireId;
                  console.log(`Real questionnaireId: ${questionnaireId2}`)
                } else {
                  console.log(`requestedInformation: ${response3.body.body.requestedInformation}`)
                  console.log(`body: ${JSON.stringify(response3.body.body)}`)
                  throw new Error("test fails to read requestedInformation")
                }
                cy.then(function () {
                  questionnaire.Id = questionnaireId2
                })
                console.log(`questionnaireUrl: ${questionnaireUrl}`)
                cy.visit(questionnaireUrl,{log : false})

                const nextButtonLabel ='Speichern und Weiter'
                const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
                cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

                currentPage()
                //cy.getQuestionnaireInfo2($car[0], logFilename)

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-01'){
                    cy.getBodyType2($car,logFilename).then(function (bodyType) {
                      cy.then(function () {
                        questionnaire.bodyType = bodyType
                      })
                    })
                    cy.selectMultipleList('terms-of-service-acknowledgement',0)
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    cy.wait(1000)
                    nextBtn()
                  }
                })
                //pageId: "page-02" pageShowCriteria 'client-vehicle-license-plate' != null && internalInformation.spearheadVehicle == null
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-02'){
                    cy.selectSingleList('vehicle-body-type',0)
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                //pageId: "page-03" pageShowCriteria 'vehicle-body-type' = 'passenger-car' ||'lcv'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-03'){
                    cy.uploadImage('vehicle-registration-part-1-photo-upload-1',PathToImages,'registration-part-1.jpg')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })
                //pageId: "page-04" pageShowCriteria internalInformation.spearheadVehicle == null
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-04'){
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
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
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
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
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                //pageId: "page-07"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-07'){
                    cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type('123321')
                    cy.selectSingleList('hail-damage-size',2)
                    cy.selectSingleList('entire-vehicle-damaged-by-hail',Number(entire_vehicle_damaged_by_hail))
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                //pageId: "page-08" SVG pageShowCriteria 'entire-vehicle-damaged-by-hail' = 1
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-08'){
                    cy.selectSVG('hood')
                    cy.selectSVG('roof')
                    cy.selectSVG('windshield')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                //pageId: "page-09" pageShowCriteria 'entire-vehicle-damaged-by-hail' = 1
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-09'){
                    cy.selectSingleList('hail-damage-intensity',2)
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                //pageId: "page-10" pageShowCriteria 'entire-vehicle-damaged-by-hail' = 0
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-10'){
                    cy.selectSingleList('damaged-vehicle-area-left-hail-damage-intensity',2)
                    cy.selectSingleList('damaged-vehicle-area-top-hail-damage-intensity',2)
                    cy.selectSingleList('damaged-vehicle-area-right-hail-damage-intensity',2)
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-11'){
                    cy.selectSingleList('glass-parts-damaged-by-hail',Number(glass_parts_damaged_by_hail))
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-12'){
                    cy.selectSVG('roof')
                    cy.selectSVG('windshield')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                //pageId: "page-13" pageShowCriteria 'glass-parts-damaged-by-hail' == 'yes') || some glass 'selected-parts' == 'yes'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-13'){
                    cy.selectMultipleList('windshield-hail-damage-type',0)
                    cy.selectMultipleList('windshield-hail-damage-type',1)
                    //"visibleExpression": "answer('glass-parts-damaged-by-hail') == 'yes' && answer('selected-parts-glass-parts-only')['roof'] == 'yes'",
                    if (!glass_parts_damaged_by_hail){
                      cy.selectSingleList('roof-equipment-panorama-roof',1)
                    }
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-14'){
                    cy.selectSingleList('unrepaired-pre-damages',0)
                    cy.selectSingleList('water-entered-vehicle',0)
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-15'){
                    cy.selectSingleList('cash-on-hand-preferred',0)
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-16'){
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-17'){
                    cy.uploadImage('vehicle-registration-part-1-photo-upload-2',PathToImages,'registration-part-1.jpg')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-18'){
                    cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,'interior-front.jpg')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-19'){
                    cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-20'){
                    cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
                    cy.uploadImage('vehicle-left-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
                    cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
                    cy.uploadImage('vehicle-right-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-21'){
                    cy.uploadImage('damage-photo-upload-overview-windshield',PathToImages,'broken front window_2.jpg')
                    cy.uploadImage('damage-photo-upload-overview-roof',PathToImages,'roof.jpg')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-22'){
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu1.jpg')
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu2.jpg')
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu3.jpg')
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                //pageId: "page-23" pageShowCriteria = true
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-23'){
                    // const nextButtonLabel23 ='Schadenmeldung senden'
                    // cy.get(selectorNextButton).contains(nextButtonLabel23).click()
                    // _waitFor('@nextPage')
                    cy.getQuestionnaireInfo2($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'summary-page'){
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    cy.selectSingleList('client-salutation',1)
                    cy.get('div#client-first-name').find('input#client-first-name-input').type('firstName')
                    cy.get('div#client-last-name').find('input#client-last-name-input').type('lastName')
                    cy.get('div#client-phone-number').find('input#client-phone-number-input').type('1234567890')
                    cy.get('div#client-email').find('input#client-email-input').type(client_email).blur()
                    cy.get('@questionnaireId').then(function (Id) {
                      console.log(`from summary-page, saved questionnaireId: ${Id}`);
                    })
                    if (executePost) {
                      cy.get('button[type="submit"]').contains('Senden').click()
                      cy.wait('@postPage',{timeout : $requestTimeout}).then(xhr => {
                        cy.postPost(xhr,false)
                        console.log(`Cypress.env('notificationId') = ${Cypress.env('notificationId')}`)
                      }) //cy.wait
                      // cy.wait('@updatePage').then(xhr => {
                      //   if (xhr.response.statusCode != 200){
                      //     console.log(`status: ${xhr.response.statusCode}`);
                      //     console.log(`internalErrorCode: ${xhr.response.internalErrorCode}`);
                      //     console.log(`message: ${xhr.response.message}`);
                      //   }
                      //   expect(xhr.response.statusCode).to.equal(200)
                      // })
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

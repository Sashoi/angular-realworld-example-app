import { getRandomInt } from "../../support/utils/common.js";
import { getPageTitle } from "../../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../../support/utils/common.js";
import { questionnaire } from "../../support/utils/common.js";
import { goingPage } from "../../support/utils/common.js";
import file from '../../fixtures/vinsArray.json'
import header from '../../fixtures/headerXML.json'


const logFilename = 'cypress/fixtures/logs/ErgoSelfServiceInit.log'
const PathToImages ='cypress/fixtures/images/'
const b2bBody = 'cypress/fixtures/templates/ergoBodyNoVin.xml' // or ergoBodyL where <PLZ>04158</PLZ> Leipzig // or ergoBodyNoVinNoPhone
const b2bBodySave = 'cypress/fixtures/templates/ergoBodySave.xml'

describe('Ergo Self Service init', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
  })
  beforeEach('Setting up integrations and common variables', () =>{
    cy.viewport('samsung-note9')
    cy.intercept('POST', `/questionnaire/*/update?locale=de`).as('updatePage')
    cy.intercept('GET', `/questionnaire/generic_elements/attachment/*-example*`).as('generic_elements')
    cy.commanBeforeEach(goingPage,questionnaire)
  })

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const $requestTimeout = 60000
  const executePost = true
  const noLicensePlate = false
  const changeVin = true
  //const entire_vehicle_damaged_by_hail = true
  const glass_parts_not_damaged_by_hail = false
  const client_email = Cypress.env("client_email")
  const newEmail = `sivanchevski2@soft2run.com`
  const newPhoneNumber = `359888705020`
  const $equipment_2_loading_doors = true
  const rollenTyp = 'ZH';
  //<Name2>Ilyovski</Name2>


  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitingFor('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitingFor('@currentPage',goingPage,questionnaire)
  }

  function getInternalInformation(massage) {
    cy.getInternalInformation().then(function (internalInformation) {
      const retailValue = internalInformation?.iBoxResult?.valuationResult?.retailValue
      const systemValue = internalInformation?.iBoxResult?.iBoxResultSummary?.repairCost?.systemValue
      console.log(`${massage}`)
      console.log(`retailValue :${retailValue}.`)
      console.log(`systemValue :${systemValue}.`)
      console.log(`systemValue / retailValue >= 1 :${systemValue / retailValue}.`)
    })
 }

 const answer = (qId) => {
  return goingPage.elements.find(x => x.id === qId).answer
}


  const file1 = [
    ["WF0KXXTTRKMC81361", "VanMidPanel", "01.01.2020", "Ford Transit 06/2021"]
  ]
  file1.forEach($car => {
    it.only(`Execute /questionnaire/ergo_self_service_init with vin:${$car[0]}, Accept "terms-of-service-acknowledgement"`, () =>{

      let vin = $car[0]
      let licensePlate = `ER GO${getRandomInt(100,999)}`
      if (noLicensePlate){
        licensePlate = ``;
      }

      cy.readFile(b2bBody).then(xml => {
        const xmlDocument = new DOMParser().parseFromString(xml,'text/xml')

        let newDxNumber = `KF3C0910KR${getRandomInt(1000000000000,9999999999999)}+${getRandomInt(100000,999999)}%`
        Array.from(xmlDocument.getElementsByTagName("DxNumber")).forEach((element, index) => {
          console.log(`DxNumber ${index}: ${element.childNodes[0].nodeValue}`);
          element.childNodes[0].nodeValue = newDxNumber
        })

        let roleTypeElement;

        //let roleTypeElement = xmlDocument.getElementsByTagName("RollenTyp")[0]
        Array.from(xmlDocument.getElementsByTagName("RollenTyp")).forEach(element => {
          console.log(`element: ${element.textContent}`);
          if (element.textContent == rollenTyp){
          roleTypeElement = element
          }
        })

        if (roleTypeElement == undefined || roleTypeElement == null){
          throw new Error(`test fails : Cannot find in body RollenTyp - ${rollenTyp}`)
        }

        let parentElement = roleTypeElement.parentElement.parentElement
        let licensePlateElement = parentElement.getElementsByTagName("AmtlichesKennzeichen")[0]
        console.log(`licensePlate: ${licensePlateElement.textContent}`);
        licensePlateElement.textContent = licensePlate
        console.log(`new licensePlate: ${licensePlateElement.textContent}`);

        if (changeVin){
          let vinElement = parentElement.getElementsByTagName("Fin")[0]
          console.log(`vin: ${vinElement.textContent}`);
          vinElement.textContent = vin
          console.log(`new vin: ${vinElement.textContent}`);
        }

        //throw new Error(`test fails`)

        const xmlString = new XMLSerializer().serializeToString(xmlDocument);


        cy.authenticate().then(function (authorization) {
          cy.then(function () {
            questionnaire.authorization = authorization
            cy.writeFile(b2bBodySave, xmlString)
          })

          Cypress._.merge(header, {'authorization' : authorization});


          const options = {
            method: 'POST',
            url: `${baseUrl_lp}b2b/integration/dekra/ergo-self-service-init`,
            body: xmlString,
            failOnStatusCode : false,
            headers: header
          };
          cy.request(options).then(
            (response) => {
            // response.body is automatically serialized into JSON
            if (response.status != 201){
              console.log(`status: ${response.status}`);
              console.log(`internalErrorCode: ${response.body.internalErrorCode}`);
              console.log(`message: ${response.body.message}`);
              throw new Error(`test fails : ${response.body.message}`)
            }
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
              //console.log('supportInformation: '+JSON.stringify(response2.body.supportInformation))
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
                  //console.log(`requestedInformation: ${JSON.stringify(response3.body.body.requestedInformation)}`)
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

                const nextButtonLabel ='Weiter'  //Speichern und Weiter
                const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
                cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

                currentPage()
                //cy.getQuestionnaireInfo()

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-01'){
                    cy.getBodyType($car,logFilename).then(function (bodyType) {
                      cy.then(function () {
                        questionnaire.bodyType = bodyType
                      })
                    })
                    //cy.selectMultipleList('terms-of-service-acknowledgement',0)
                    cy.selectSingleList('terms-of-service-acknowledgement',0)
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
                    console.log(`vin: ${vin}`);
                    cy.get('input#vin[data-test="vin-input"]').clear().type(vin,{delay : 200})
                    cy.get('input#vin[data-test="vin-input"]').clear().type(vin,{delay : 200})
                    cy.get('button[data-test="identify-button"]').click({ force: true })
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
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-07"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-07'){
                    cy.get('div#vehicle-mileage').find('input#vehicle-mileage-input').type('123321')
                    cy.selectSingleList('hail-damage-size',2)
                    //cy.selectSingleList('entire-vehicle-damaged-by-hail',Number(entire_vehicle_damaged_by_hail))
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-08'){
                    cy.getBodyType($car,logFilename).then(function (bodyType) {
                      cy.then(function () {
                        questionnaire.bodyType = bodyType
                      })
                    })
                    cy.get('@bodyType').then(function (bodyType) {
                      if (bodyType == 'MiniBus' || bodyType == 'MiniBusMidPanel' || bodyType == 'Van' || bodyType == 'VanMidPanel'){
                        cy.wait(2000)
                        cy.selectSingleList('equipment-slide-door',1)
                        cy.selectSingleList('equipment-2-loading-doors',Number($equipment_2_loading_doors))

                        cy.selectSingleList('equipment-length',0)
                        cy.selectSingleList('equipment-height',0)
                        cy.selectSingleList('equipment-vehicle-rear-glassed',0)
                        cy.selectSingleList('vehicle-customized-interior',0)
                        cy.selectSingleList('loading-floor-area-bend', 0)
                      }
                    })
                    nextBtn()
                  }
                })

                //pageId: "page-09" SVG
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-09'){
                    cy.selectSVG('hood')
                    cy.selectSVG('roof')
                    cy.selectSVG('windshield')
                    cy.selectSVG('left-headlight')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-10"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-10'){
                    cy.selectSingleList('hail-damage-intensity',2)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })


                //pageId: "page-11"
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-11'){
                    cy.selectSingleList('damaged-vehicle-area-left-hail-damage-intensity',2)
                    cy.selectSingleList('damaged-vehicle-area-top-hail-damage-intensity',2)
                    cy.selectSingleList('damaged-vehicle-area-right-hail-damage-intensity',2)
                    cy.get('div#damaged-vehicle-area-left-hail-damage-intensity').find('span.info-icon').click()
                    cy.wait(3000)
                    cy.get('span.info-block-close').first().click()

                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-12'){
                    cy.selectSingleList('glass-parts-damaged-by-hail',Number(glass_parts_not_damaged_by_hail))
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {  //pageShowCriteria 'glass-parts-damaged-by-hail' = 'yes'
                  if (aliasValue == 'page-13'){
                    cy.selectSVG('roof')
                    cy.selectSVG('windshield')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-14" pageShowCriteria 'glass-parts-damaged-by-hail' == 'yes') || some glass 'selected-parts' == 'yes'
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-14'){
                    cy.get('@goingPageElements').then(function (elements) {
                      elements.forEach(element => {
                        if (element['id'] == 'roof-equipment-panorama-roof' && eval(element['visibleExpression'])){
                          console.log(`${element['id']}: ${eval(element['visibleExpression'])}`);
                          cy.selectSingleList('roof-equipment-panorama-roof',1)
                        }
                        if (element['id'] == 'roof-equipment-convertible-roof-material' && eval(element['visibleExpression'])){
                          //"visibleExpression": "answer('glass-parts-damaged-by-hail') == 'yes' && answer('selected-parts-glass-parts-only')['roof'] == 'yes' && supportInformation('bodyType') == 'Cabrio'",
                          console.log(`${element['id']}: ${eval(element['visibleExpression'])}`);
                          cy.selectSingleList('roof-equipment-convertible-roof-material',0)
                        }
                        if (element['id'] == 'left-headlight-damage-type' && eval(element['visibleExpression'])){
                          cy.selectMultipleList('left-headlight-damage-type',0)
                        }
                        if (element['id'] == 'left-headlight-still-working' && eval(element['visibleExpression'])){
                          //console.log(`${element['id']}: ${eval(element['visibleExpression'])}`);
                          cy.selectSingleList('left-headlight-still-working',0)
                        }
                      })

                    })
                    cy.selectMultipleList('windshield-hail-damage-type',0)
                    cy.selectMultipleList('windshield-hail-damage-type',1)
                    //"visibleExpression": "answer('glass-parts-damaged-by-hail') == 'yes' && answer('selected-parts-glass-parts-only')['roof'] == 'yes'",

                    cy.getQuestionnaireInfo()
                    //getInternalInformation(`On ${aliasValue}:`)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-15'){
                    cy.get('@goingPageElements').then(function (elements) {
                      elements.forEach(element => {
                        //console.log(`element: ${JSON.stringify(element)}`)
                        // for (const [key, value] of Object.entries(element)) {
                        //   if (key == 'visibleExpression'){
                        //     console.log(`${key} value: ${eval(value)}`);
                        //   }
                        //   console.log(`${key}: ${value}`);
                        // }
                        if (element['id'] == 'unrepaired-pre-damages' && eval(element['visibleExpression'])){
                          console.log(`${element['id']}: ${eval(element['visibleExpression'])}`);
                          cy.selectSingleList('unrepaired-pre-damages',0)
                        }
                        if (element['id'] == 'water-entered-vehicle' && eval(element['visibleExpression'])){
                          console.log(`${element['id']}: ${eval(element['visibleExpression'])}`);
                          cy.selectSingleList('water-entered-vehicle',0)
                        }
                      })
                    })
                    //getInternalInformation(`On ${aliasValue}:`)
                    // This works too
                    // cy.getInternalInformation().then(function (internalInformation) {
                    //   const retailValue = internalInformation?.iBoxResult?.valuationResult?.retailValue
                    //   const systemValue = internalInformation?.iBoxResult?.iBoxResultSummary?.repairCost?.systemValue
                    //   if (retailValue > 0 && systemValue > 0 && (systemValue / retailValue >= 1)){
                    //     cy.selectSingleList('unrepaired-pre-damages',0)
                    //   }
                    // })
                    //cy.selectSingleList('water-entered-vehicle',0)
                    cy.wait(4000)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-16'){
                    cy.selectSingleList('cash-on-hand-preferred',0)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-17'){
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-18'){
                    cy.uploadImage('vehicle-registration-part-1-photo-upload-2',PathToImages,'registration-part-1.jpg')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-19'){
                    cy.uploadImage('vehicle-interior-front-photo-upload',PathToImages,'interior-front.jpg')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-20'){
                    cy.uploadImage('vehicle-dashboard-odometer-photo-upload',PathToImages,'image dashboard-odometer.jpg')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-21'){
                    cy.uploadImage('vehicle-right-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
                    cy.uploadImage('vehicle-left-front-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
                    cy.uploadImage('vehicle-left-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
                    cy.uploadImage('vehicle-right-rear-photo-upload',PathToImages,'vehicle-left-rear-photo1.jpg')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-22'){
                    cy.uploadImage('hail-damage-details-photo-upload',PathToImages,'hail-damage-intensity_heavy.jpg')
                    cy.uploadImage('hail-damage-details-photo-upload',PathToImages,'hail-damage-intensity_heavy.jpg')
                    cy.uploadImage('hail-damage-details-photo-upload',PathToImages,'hail-damage-intensity_moderate.jpg')
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-23'){
                    cy.get('@goingPageElements').then(function (elements) {
                      elements.forEach(element => {
                        if (element['id'] == 'damage-photo-upload-overview-windshield' && eval(element['visibleExpression'])){
                          //console.log(`${element['id']}: ${eval(element['visibleExpression'])}`);
                          cy.uploadImage('damage-photo-upload-overview-windshield',PathToImages,'broken front window_2.jpg')
                        }
                        if (element['id'] == 'damage-photo-upload-overview-roof' && eval(element['visibleExpression'])){
                          //console.log(`${element['id']}: ${eval(element['visibleExpression'])}`);
                          cy.uploadImage('damage-photo-upload-overview-roof',PathToImages,'roof.jpg')
                        }
                        if (element['id'] == 'damage-photo-upload-overview-left-headlight' && eval(element['visibleExpression'])){
                          //console.log(`${element['id']}: ${eval(element['visibleExpression'])}`);
                          cy.uploadImage('damage-photo-upload-overview-left-headlight',PathToImages,'roof.jpg')
                        }
                      })
                    })
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) { // pageShowCriteria 'unrepaired-pre-damages' = 'yes'
                  if (aliasValue == 'page-24'){
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu1.jpg')
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu2.jpg')
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu3.jpg')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-25" pageShowCriteria = vehicle-road-safety-potentially-at-risk == true
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-25'){
                    cy.getQuestionnaireInfo($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'summary-page'){
                    //cy.getQuestionnaireInfo()
                    cy.selectSingleList('client-salutation',1)
                    cy.fulfilInputIfEmpty('div#client-first-name','input#client-first-name-input','firstName')
                    cy.fulfilInputIfEmpty('div#client-last-name','input#client-last-name-input','lastName')
                    cy.fulfilInputIfEmpty('div#client-phone-number','input#client-phone-number-input','1234567890')
                    cy.fulfilInputIfEmpty('div#client-email','input#client-email-input',client_email)
                    cy.fulfilInputIfEmpty('div#vehicle-location-street-name','input#vehicle-location-street-name-input','Street name')
                    cy.fulfilInputIfEmpty('div#vehicle-location-street-number','input#vehicle-location-street-number-input','9999A')
                    cy.fulfilInputIfEmpty('div#vehicle-location-zip-code','input#vehicle-location-zip-code-input','10115')
                    cy.fulfilInputIfEmpty('div#vehicle-location-city','input#vehicle-location-city-input','Sofia')
                    //vehicle-location-country-input second time
                    cy.selectSingleList('vehicle-location-equals-accident-location',0)


                    //cy.get('div#client-email').find('input#client-email-input').blur()
                    cy.get('@questionnaireId').then(function (Id) {
                      console.log(`from summary-page, saved questionnaireId: ${Id}`);
                    })
                    if (executePost) {
                      cy.get('button[type="submit"]').contains('Schadenmeldung senden').click() //Senden
                      cy.wait('@completePost',{timeout : $requestTimeout}).then(xhr => {
                        cy.completePost(xhr,false)
                        console.log(`Cypress.env('notificationId') = ${Cypress.env('notificationId')}`)
                        cy.wait(1000)
                        cy.url({ timeout: 3000 }).should('include', '/questionnaire/mdekra/#/final') // => true
                        //cy.get('div.content').contains('Digital Service wurde beendet').should('exist')
                        cy.get('div.content').then($labels => {
                          cy.wrap($labels).find('h1').contains('Vielen Dank für Ihre Mithilfe').should('be.visible')
                          cy.wrap($labels).find('p').contains('Vielen Dank für Ihr Vertrauen und Ihre Mithilfe.').should('be.visible')
                          cy.wrap($labels).find('p').contains('Die von Ihnen bereitgestellten Informationen zum Hagelschaden an Ihrem Fahrzeug wurden erfolgreich an uns übermittelt.').should('be.visible')
                        })
                      }) //cy.wait
                    }
                  }
                })
              }) //response3
            }) //response2
          })  //response
        }) //authorization
      })//readFile xml
    }) //it

    it(`Execute /questionnaire/ergo_self_service_init with vin:${$car[0]} Do not accept "terms-of-service-acknowledgement"`, () =>{

      let vin = $car[0]
      let licensePlate = `ER GO${getRandomInt(100,999)}`
      if (noLicensePlate){
        licensePlate = ``;
      }

      cy.readFile(b2bBody).then(xml => {
        const xmlDocument = new DOMParser().parseFromString(xml,'text/xml')

        let newDxNumber = `KF3C0910KR${getRandomInt(1000000000000,9999999999999)}+${getRandomInt(100000,999999)}%`
        Array.from(xmlDocument.getElementsByTagName("DxNumber")).forEach((element, index) => {
          console.log(`DxNumber ${index}: ${element.childNodes[0].nodeValue}`);
          element.childNodes[0].nodeValue = newDxNumber
        })

        let roleTypeElement;

        //let roleTypeElement = xmlDocument.getElementsByTagName("RollenTyp")[0]
        Array.from(xmlDocument.getElementsByTagName("RollenTyp")).forEach(element => {
          console.log(`element: ${element.textContent}`);
          if (element.textContent == rollenTyp){
          roleTypeElement = element
          }
        })

        if (roleTypeElement == undefined || roleTypeElement == null){
          throw new Error(`test fails : Cannot find in body RollenTyp - ${rollenTyp}`)
        }

        let parentElement = roleTypeElement.parentElement.parentElement
        let licensePlateElement = parentElement.getElementsByTagName("AmtlichesKennzeichen")[0]
        console.log(`licensePlate: ${licensePlateElement.textContent}`);
        licensePlateElement.textContent = licensePlate
        console.log(`new licensePlate: ${licensePlateElement.textContent}`);

        if (changeVin){
          let vinElement = parentElement.getElementsByTagName("Fin")[0]
          console.log(`vin: ${vinElement.textContent}`);
          vinElement.textContent = vin
          console.log(`new vin: ${vinElement.textContent}`);
        }

        //throw new Error(`test fails`)

        const xmlString = new XMLSerializer().serializeToString(xmlDocument);


        cy.authenticate().then(function (authorization) {
          cy.then(function () {
            questionnaire.authorization = authorization
            cy.writeFile(b2bBodySave, xmlString)
          })

          Cypress._.merge(header, {'authorization' : authorization});


          const options = {
            method: 'POST',
            url: `${baseUrl_lp}b2b/integration/dekra/ergo-self-service-init`,
            body: xmlString,
            failOnStatusCode : false,
            headers: header
          };
          cy.request(options).then(
            (response) => {
            // response.body is automatically serialized into JSON
            if (response.status != 201){
              console.log(`status: ${response.status}`);
              console.log(`internalErrorCode: ${response.body.internalErrorCode}`);
              console.log(`message: ${response.body.message}`);
              throw new Error(`test fails : ${response.body.message}`)
            }
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
              //console.log('supportInformation: '+JSON.stringify(response2.body.supportInformation))
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
                  //console.log(`requestedInformation: ${JSON.stringify(response3.body.body.requestedInformation)}`)
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

                const nextButtonLabel = 'Weiter'
                const selectorNextButton = 'button[type="submit"][data-test="questionnaire-next-button"]'
                cy.get(selectorNextButton).contains(nextButtonLabel).as('nextBtn')

                currentPage()
                //cy.getQuestionnaireInfo()

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-01'){
                    cy.getBodyType($car,logFilename).then(function (bodyType) {
                      cy.then(function () {
                        questionnaire.bodyType = bodyType
                      })
                    })
                    //cy.selectMultipleList('terms-of-service-acknowledgement',0)
                    cy.selectSingleList('terms-of-service-acknowledgement',1)
                    //cy.getQuestionnaireInfo()
                    cy.wait(1000)
                    const nextButtonLabel = 'Digital Service beenden'
                    const selectorNextButton = 'button[type="submit"][data-test="questionnaire-complete-button"]'
                    cy.get(selectorNextButton).contains(nextButtonLabel).as('toFinalBtn')
                    cy.wait(1000)
                    cy.get('@toFinalBtn').click({ force: true })
                    cy.url({ timeout: 3000 }).should('include', '/questionnaire/mdekra/#/final') // => true
                    //cy.get('div.content').contains('Digital Service wurde beendet').should('exist')
                    cy.get('div.content').then($labels => {
                      cy.wrap($labels).contains('Digital Service wurde beendet').should('be.visible')
                      cy.wrap($labels).contains('Vielen Dank für Ihr Verständnis und Ihre Geduld!').should('be.visible')
                      cy.wrap($labels).contains('Wir werden uns bei Ihnen melden, um einen Besichtigungstermin mit Ihnen abzustimmen.').should('be.visible')
                    })
                  }
                })
              }) //response3
            }) //response2
          })  //response
        }) //authorization
      })//readFile xml
    }) //it

    it.skip(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      //Cypress.env('notificationId','V5z41mYa96xDCRVRcfyXh')
      cy.wait(2000)
      cy.GeneratePDFs(['ergo_abschlussbericht','ergo_hagelbericht'])
    }) //it PDF from commands
  }) //forEach
})

import { getRandomInt } from "../../support/utils/common.js";
import { getPageTitle } from "../../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../../support/utils/common.js";
import { questionnaire } from "../../support/utils/common.js";
import { goingPage } from "../../support/utils/common.js";
import file from '../../fixtures/vinsArray.json'
import header from '../../fixtures/headerXML.json'


const logFilename = 'cypress/fixtures/logs/ErgoSelfServiceInit.log'
const PathToImages ='cypress/fixtures/images/'
const b2bBody = 'cypress/fixtures/templates/ergoBody.xml' // or ergoBodyL where <PLZ>04158</PLZ> Leipzig
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
  const executePost = false
  const noLicensePlate = false
  const entire_vehicle_damaged_by_hail = true
  const glass_parts_not_damaged_by_hail = true
  const client_email = Cypress.env("client_email")
  const vehicle_hsn_tsn_1 = '05881'   //Start with wrong TSN to reach page-04
  const vehicle_hsn_tsn_2 = 'AUC'
  const vehicle_identification_by_hsn_tsn = false
  const changeRoleType = false
  const newEmail = `sivanchevski@soft2run.com`
  const newPhoneNumber = `359888795023`
  const $equipment_2_loading_doors = true
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
    ["WF0KXXTTRKMC81361", "VanMidPanel", "01.01.2020", "Ford Transit 06/2021 "]
  ]

  file1.forEach($car => {
    it(`Execute /questionnaire/ergo_self_service_init with vin:${$car[0]}`, () =>{
      cy.readFile(b2bBody).then(xml => {
        const xmlDocument = new DOMParser().parseFromString(xml,'text/xml')

        expect(xmlDocument.getElementsByTagName("RollenTyp").length).to.gt(0)

        let roleTypeElement;

        //let roleTypeElement = xmlDocument.getElementsByTagName("RollenTyp")[0]
        Array.from(xmlDocument.getElementsByTagName("RollenTyp")).forEach(element => {
          console.log(`element: ${element.textContent}`);
          if (element.textContent == 'ZN'){
          roleTypeElement = element
          }
        })

        if ( !roleTypeElement ) {
          throw new Error(`test fails, cannot find roleType ZN`)
        }

        console.log(`roleType: ${roleTypeElement.textContent}`);

        let parentElement = roleTypeElement.parentElement
        const loop = [1,2,3,4,5,6]
        loop.forEach((v, index, arr) => {
          console.log(`parent ${v} of roleType: ${parentElement.nodeName }`);
          if (parentElement.nodeName == 'body') {
            arr.length = index + 1; // Behaves like `break`
          }
          parentElement = parentElement.parentElement
        })

        expect(parentElement.getElementsByTagName("Fin").length).to.eq(1)
        let vinElement = parentElement.getElementsByTagName("Fin")[0]
        console.log(`vin: ${vinElement.textContent}`);

        expect(parentElement.getElementsByTagName("AmtlichesKennzeichen").length).to.eq(1)
        let licensePlateElement = parentElement.getElementsByTagName("AmtlichesKennzeichen")[0]
        console.log(`licensePlate: ${licensePlateElement.textContent}`);

        expect(parentElement.getElementsByTagName("SchadenNummer").length).to.eq(1)
        let claimNumberElement = parentElement.getElementsByTagName("SchadenNummer")[0]
        console.log(`claimNumber: ${claimNumberElement.textContent}`);

        Array.from(parentElement.getElementsByTagName("Bezeichnung")).forEach((element, index) => {
          console.log(`email ${index}: ${element.childNodes[0].nodeValue}`);
          element.childNodes[0].nodeValue = newEmail
        })

        Array.from(parentElement.getElementsByTagName("Telefon1")).forEach((element, index) => {
          console.log(`Telefon1 ${index}: ${element.childNodes[0].nodeValue}`);
          element.childNodes[0].nodeValue = newPhoneNumber
        })
        Array.from(parentElement.getElementsByTagName("Telefon2")).forEach((element, index) => {
          console.log(`Telefon2 ${index}: ${element.childNodes[0].nodeValue}`);
          element.childNodes[0].nodeValue = newPhoneNumber
        })

        let newDxNumber = `KF3C0910KR${getRandomInt(1000000000000,9999999999999)}+${getRandomInt(100000,999999)}%` //<DxNumber>KF3C0910KR0735504630004+001002%</DxNumber>
        //newDxNumber = 'KF3C0910KR7990820637743+632584%' //test for preventing duplicate DxNumbers
        /* If want to check <DxNumber> exists , execute
        POST {{baseUrl}}/damage/notifications/search-by-extra-information
        {
          "dekra_number": "KF3C0910KR7990820637743+642584"
        }
        Return Status 200 if exist
        404 if not exist */

        Array.from(xmlDocument.getElementsByTagName("DxNumber")).forEach((element, index) => {
          console.log(`DxNumber ${index}: ${element.childNodes[0].nodeValue}`);
          element.childNodes[0].nodeValue = newDxNumber
        })

        expect(parentElement.getElementsByTagName("Bezeichnung").length).to.eq(2)

        let vin = $car[0]
        let licensePlate = `ER GO${getRandomInt(100,999)}`
        if (noLicensePlate){
          licensePlate = ``;
        }
        let claimNumber = `KS${getRandomInt(10000000,99999999)}-${getRandomInt(1000,9999)}`

        vinElement.textContent = vin
        licensePlateElement.textContent = licensePlate
        claimNumberElement.textContent = claimNumber

        if (vehicle_identification_by_hsn_tsn){
          vinElement.textContent = ''
          expect(parentElement.getElementsByTagName("KbaNr2Hersteller").length).to.eq(1)
          parentElement.getElementsByTagName("KbaNr2Hersteller")[0].textContent = vehicle_hsn_tsn_1
          expect(parentElement.getElementsByTagName("KbaNr3Typ").length).to.eq(1)
          parentElement.getElementsByTagName("KbaNr3Typ")[0].textContent = vehicle_hsn_tsn_2
          console.log(`vehicle identification by hsn_tsn: ${parentElement.querySelector("KbaNr2Hersteller").textContent}/${parentElement.querySelector("KbaNr3Typ").textContent}`);
        }

        console.log(`new vin: ${parentElement.querySelector("Fin").textContent}`);
        console.log(`new licensePlate: ${parentElement.querySelector("AmtlichesKennzeichen").textContent}`);
        console.log(`new claimNumber: ${parentElement.querySelector("SchadenNummer").textContent}`);
        Array.from(parentElement.getElementsByTagName("Bezeichnung")).forEach((element, index) => {
          console.log(`new email ${index}: ${element.childNodes[0].nodeValue}`);
        })
        Array.from(parentElement.getElementsByTagName("Telefon1")).forEach((element, index) => {
          console.log(`new Telefon1 ${index}: ${element.childNodes[0].nodeValue}`);
        })
        Array.from(parentElement.getElementsByTagName("Telefon2")).forEach((element, index) => {
          console.log(`new Telefon2 ${index}: ${element.childNodes[0].nodeValue}`);
        })
        Array.from(xmlDocument.getElementsByTagName("DxNumber")).forEach((element, index) => {
          console.log(`new DxNumber ${index}: ${element.childNodes[0].nodeValue}`);
        })

        if (changeRoleType){
          //expect(parentElement.getElementsByTagName("RollenTyp").length).to.eq(1)
          roleTypeElement.textContent = 'ZH'
          //console.log(`new roleType: ${parentElement.querySelector("RollenTyp").textContent}`);
          Array.from(parentElement.getElementsByTagName("RollenTyp")).forEach((element, index) => {
            console.log(`new roleType ${index}: ${element.childNodes[0].nodeValue}`);
          })
        }

        const xmlString = new XMLSerializer().serializeToString(xmlDocument);


        cy.authenticate().then(function (authorization) {
          cy.then(function () {
            questionnaire.authorization = authorization
            cy.writeFile(b2bBodySave, xmlString)
          })

          Cypress._.merge(header, {'authorization' : authorization});
          Cypress._.merge(header, {'HeaderName' : newDxNumber});


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
                    cy.selectSingleList('entire-vehicle-damaged-by-hail',Number(entire_vehicle_damaged_by_hail))
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

                //pageId: "page-09" SVG pageShowCriteria 'entire-vehicle-damaged-by-hail' = 1
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

                //pageId: "page-10" pageShowCriteria 'entire-vehicle-damaged-by-hail' = 1
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-10'){
                    cy.selectSingleList('hail-damage-intensity',2)
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })



                //pageId: "page-11" pageShowCriteria 'entire-vehicle-damaged-by-hail' = 0
                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-11'){
                    cy.selectSingleList('damaged-vehicle-area-left-hail-damage-intensity',2)
                    cy.selectSingleList('damaged-vehicle-area-top-hail-damage-intensity',2)
                    cy.selectSingleList('damaged-vehicle-area-right-hail-damage-intensity',2)
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

                cy.get('@goingPageId').then(function (aliasValue) {
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
                    // this does not work
                    // cy.getQuestionAnswer('selected-parts-glass-parts-only').then(function (answer) {
                    //   let roof = answer.map(x => x.roof)
                    //   console.log(`roof: ${JSON.stringify(roof)}`);
                    //   console.log(`roof bool: ${!roof && roof.length > 0 && roof[0] == 'yes'}`);
                    //   if (!glass_parts_damaged_by_hail && (!roof && roof.length > 0 && roof[0] == 'yes')){
                    //     cy.selectSingleList('roof-equipment-panorama-roof',1)
                    //   }
                    // })
                    //cy.getQuestionnaireInfo()
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
                    cy.uploadImage('hail-damage-details-photo-upload',PathToImages,'vehicle-right-front-photo.jpg')
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

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'page-24'){
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu1.jpg')
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu2.jpg')
                    cy.uploadImage('unrepaired-pre-damages-photo-upload',PathToImages,'hood-npu3.jpg')
                    //cy.getQuestionnaireInfo()
                    nextBtn()
                  }
                })

                //pageId: "page-24" pageShowCriteria = true
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
                    //cy.fulfilInputIfEmpty('div#client-first-name','input#client-first-name-input','firstName')
                    //cy.fulfilInputIfEmpty('div#client-last-name','input#client-last-name-input','lastName')
                    cy.fulfilInputIfEmpty('div#client-phone-number','input#client-phone-number-input','1234567890')
                    cy.fulfilInputIfEmpty('div#client-email','input#client-email-input',client_email)
                    //cy.get('div#client-email').find('input#client-email-input').blur()
                    cy.get('@questionnaireId').then(function (Id) {
                      console.log(`from summary-page, saved questionnaireId: ${Id}`);
                    })
                    if (executePost) {
                      cy.get('button[type="submit"]').contains('Schadenmeldung senden').click() //Senden
                      cy.wait('@postPost',{timeout : $requestTimeout}).then(xhr => {
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


    it.only(`Generate PDFs (from commands ) for ${$car[0]}`, function () {
      Cypress.env('notificationId','rYWuDORwTxZSEoEAPfqBm') //temp
      cy.GeneratePDFs(['ergo_abschlussbericht','ergo_hagelbericht'])
    }) //it PDF from commands
  }) //forEach
})

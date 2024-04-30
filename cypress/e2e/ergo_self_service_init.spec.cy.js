import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import header from '../fixtures/headerXML.json'


const logFilename = 'cypress/fixtures/logs/ErgoSelfServiceInit.log'
const PathToImages ='cypress/fixtures/images/'
const b2bBody = 'cypress/fixtures/templates/ergoBody.xml'

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
  const entire_vehicle_damaged_by_hail = true
  const glass_parts_damaged_by_hail = true
  const client_email = Cypress.env("client_email")
  const vehicle_hsn_tsn_1 = '0588'
  const vehicle_hsn_tsn_2 = 'AUC'
  const vehicle_identification_by_hsn_tsn = false
  const changeRoleType = false
  const newEmail = `sivanchevski3@soft2run.com`


  function nextBtn() {
    cy.get('@nextBtn').click({ force: true })
    cy.waitFor2('@nextPage',goingPage,questionnaire)
  }

  function currentPage() {
    cy.waitFor2('@currentPage',goingPage,questionnaire)
  }


  const file1 = [
    ["WDB1704351F077666", "Cabrio", "01.01.2004", "MER SLK Cabrio"]
  ]

  file1.forEach($car => {
    it.only(`Execute /questionnaire/ergo_self_service_init with vin:${$car[0]}`, () =>{
      cy.readFile(b2bBody).then(xml => {
        const xmlDocument = new DOMParser().parseFromString(xml,'text/xml')
        /* let vin = xmlDocument.querySelector("Fin").textContent
        let claimNumber = xmlDocument.querySelector("SchadenNummer").textContent
        xmlDocument.querySelector("Fin").textContent = $car[0]
        xmlDocument.querySelector("SchadenNummer").textContent = `KS${getRandomInt(10000000,99999999)}-${getRandomInt(1000,9999)}`
        //<Bezeichnung>sivanchevski@soft2run.com</Bezeichnung>
        xmlDocument.querySelector("Bezeichnung").textContent = `sivanchevski1@soft2run.com`
        //console.log(`vin: ${xmlDocument.querySelector("Fin").textContent}`);
        //console.log(`claimNumber: ${claimNumber}`);
        if (vehicle_identification_by_hsn_tsn){
          xmlDocument.querySelector("Fin").textContent = ''
          xmlDocument.querySelector("KbaNr2Hersteller").textContent = vehicle_hsn_tsn_1
          xmlDocument.querySelector("KbaNr3Typ").textContent = vehicle_hsn_tsn_2
          console.log(`vehicle identification by hsn_tsn: ${xmlDocument.querySelector("KbaNr2Hersteller").textContent}/${xmlDocument.querySelector("KbaNr3Typ").textContent}`);
        }
        console.log(`vin: ${xmlDocument.querySelector("Fin").textContent}`);
        console.log(`claimNumber: ${xmlDocument.querySelector("SchadenNummer").textContent}`); */

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

      expect(parentElement.getElementsByTagName("SchadenNummer").length).to.eq(1)
      let claimNumberElement = parentElement.getElementsByTagName("SchadenNummer")[0]
      console.log(`claimNumber: ${claimNumberElement.textContent}`);

      Array.from(parentElement.getElementsByTagName("Bezeichnung")).forEach((element, index) => {
        console.log(`email ${index}: ${element.childNodes[0].nodeValue}`);
        element.childNodes[0].nodeValue = newEmail
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
      let claimNumber = `KS${getRandomInt(10000000,99999999)}-${getRandomInt(1000,9999)}`

      vinElement.textContent = vin
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
      console.log(`new claimNumber: ${parentElement.querySelector("SchadenNummer").textContent}`);
      Array.from(parentElement.getElementsByTagName("Bezeichnung")).forEach((element, index) => {
        console.log(`new email ${index}: ${element.childNodes[0].nodeValue}`);
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
                  console.log(`requestedInformation: ${JSON.stringify(response3.body.body.requestedInformation)}`)
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
                    cy.getQuestionAnswer('selected-parts-glass-parts-only').then(function (answer) {
                      let roof = answer.map(x => x.roof)
                      console.log(`roof: ${JSON.stringify(roof)}`);
                      console.log(`roof bool: ${!roof && roof.length > 0 && roof[0] == 'yes'}`);
                      if (!glass_parts_damaged_by_hail && (!roof && roof.length > 0 && roof[0] == 'yes')){
                        cy.selectSingleList('roof-equipment-panorama-roof',1)
                      }
                    })



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
                    cy.getQuestionnaireInfo($car[0], logFilename)
                    nextBtn()
                  }
                })

                cy.get('@goingPageId').then(function (aliasValue) {
                  if (aliasValue == 'summary-page'){
                    //cy.getQuestionnaireInfo2($car[0], logFilename)
                    cy.selectSingleList('client-salutation',1)
                    cy.fulfilInputIfEmpty('div#client-first-name','input#client-first-name-input','firstName')
                    cy.fulfilInputIfEmpty('div#client-last-name','input#client-last-name-input','lastName')
                    cy.fulfilInputIfEmpty('div#client-phone-number','input#client-phone-number-input','1234567890')
                    cy.fulfilInputIfEmpty('div#client-email','input#client-email-input',client_email)
                    //cy.get('div#client-email').find('input#client-email-input').blur()
                    cy.get('@questionnaireId').then(function (Id) {
                      console.log(`from summary-page, saved questionnaireId: ${Id}`);
                    })
                    if (executePost) {
                      cy.get('button[type="submit"]').contains('Senden').click()
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
  }) //forEach
})

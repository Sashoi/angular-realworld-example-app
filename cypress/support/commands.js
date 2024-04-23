/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

import header from '../fixtures/header.json'


const c_requestTimeout = 60000;

Cypress.Commands.add('elementExists', (selector) =>{
  cy.get('body').then(($body) => {
    if ($body.find(selector).length) {
      return cy.get(selector)
    } else {
      // Throws no error when element not found
      assert.isOk('OK', 'Element does not exist.')
    }
  })
})
Cypress.Commands.add('selectSVG', (selectorId) =>{
  cy.get('svg',{ log : false }).find(`g#${selectorId}`,{ log : false }).invoke('attr', 'data-selection-state').then(($state) => {
    if ($state == undefined || $state == "no"){
      cy.get('svg',{ log : false }).find(`g#${selectorId}`,{ log : false }).click({ force: true, log : false })
    }
    cy.get(`svg`,{ log : false }).find(`g#${selectorId}`,{ log : false }).invoke('attr', 'data-selection-state').should('eq', 'yes')
  })
})

Cypress.Commands.add('selectSVG_VZ', (selectorId) =>{
  const attrName = 'data-selection-state'
  cy.get('svg',{ log : false }).find(`g#${selectorId}`,{ log : false }).invoke('attr', attrName).then(($state) => {
    if ($state == undefined || $state == "no"){
      cy.get('svg',{ log : false }).find(`g#${selectorId}`,{ log : false }).children('path').eq(1).click({ force: true, log : false })
    }
    cy.get(`svg`,{ log : false }).find(`g#${selectorId}`,{ log : false }).invoke('attr', attrName).should('eq', 'yes')
  })
})

function selectFromList(selectorId,option,classValue){
  cy.get(`div#${selectorId}`,{ log : false }).find(`label[for="${selectorId}_${option}"]`,{ log : false }).parent('div').then(($parent) => {
    const classList = Array.from($parent[0].classList);
    if (!classList.includes(classValue)){
      cy.get(`div#${selectorId}`,{ log : false }).find(`label[for="${selectorId}_${option}"]`,{ log : false }).click({ force: true, log : false })
    }
    cy.get(`div#${selectorId}`,{ log : false }).find(`label[for="${selectorId}_${option}"]`,{ log : false }).parent('div').should('have.class', classValue)
  })
}


Cypress.Commands.add('selectMultipleList', (selectorId, option) =>{
  selectFromList(selectorId,option,'checkbox--checked');
})

Cypress.Commands.add('selectSingleList', (selectorId, option) =>{
  selectFromList(selectorId,option,'radio--checked');
})

Cypress.Commands.add('selectDropDown', (selectorId, option) =>{
  cy.get(`select#${selectorId}`).invoke('attr', 'class').then($classNames => {
    console.log(`class Names :  ${$classNames}.`)
    if ($classNames.includes('field-invalid')) {
      cy.get(`select#${selectorId}`).select(option)//.should('have.value', '200501')
      cy.get(`select#${selectorId}`).invoke('val').then($val => {
        console.log(`selected for ${selectorId} :  ${$val}.`)
      })
    }
  })
})

Cypress.Commands.add('selectorHasAttrClass', (selector, attr) =>{
  cy.get(selector).invoke('attr', 'class').then($classNames => {
    return cy.wrap($classNames.includes(attr))
  })
})

Cypress.Commands.add('uploadImage', (selectorId,toPath,fileName) =>{
  cy.intercept('POST', `/questionnaire/*/attachment/answer/${selectorId}/index-*?locale=de`).as(`attachmentAnswer-${selectorId}`)
  cy.get(`form#${selectorId}`).find('button').selectFile(`${toPath}${fileName}`, {
    action: 'drag-drop',
  })
  cy.wait([`@attachmentAnswer-${selectorId}`],{log : false, timeout : c_requestTimeout}).then(xhr => {
    expect(xhr.response.statusCode).to.equal(200)
  })
  cy.wait('@savePage',{timeout : c_requestTimeout}).then(xhr => {
    expect(xhr.response.statusCode).to.equal(200)
  })
  cy.get(`form#${selectorId}`).find(`img[alt="${fileName}"]`).invoke('attr', 'alt').should('eq', fileName)
  cy.get(`form#${selectorId}`).find(`img[alt="${fileName}"]`).should('exist')
})

Cypress.Commands.add('getBodyType', ($car,logFilename) =>{
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  cy.get('@authorization').then(function (authorization) {
    cy.get('@questionnaireId').then(function (questionnaireId) {
      Cypress._.merge(header, {'authorization' : authorization});

      const url = `${baseUrl_lp}questionnaire/${questionnaireId}`
      console.log(`url: ${url}`)
      const options = {
        method: 'GET',
        url: url,
        headers:  header,
        'timeout' : c_requestTimeout
      };
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200) // true
        let bodyType = response.body.supportInformation.bodyType
        console.log(`supportInformation.bodyType: ${bodyType}.`)
        if (bodyType == undefined || bodyType == null){
          bodyType = ''
        }
        cy.readFile(logFilename).then((text) => {
          const addRow = `vin: ${$car[0]} expected: ${$car[1].padStart(18, ' ')} real: ${bodyType.padStart(18, ' ')} desc: ${$car[3]} \n`
          text += addRow
          cy.writeFile(logFilename, text)

        })
        cy.wrap(bodyType).then((bodyType) => {
          return bodyType
        })
      }) //request(options)
    }) //get('@questionnaireId'
  }) //get('@authorization'
})


Cypress.Commands.add('getBodyType2', ($car,logFilename) =>{
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  cy.authenticate(false).then(function (authorization) {
    cy.get('@questionnaireId').then(function (questionnaireId) {
      Cypress._.merge(header, {'authorization' : authorization});

      const url = `${baseUrl_lp}questionnaire/${questionnaireId}`
      console.log(`url: ${url}`)
      const options = {
        method: 'GET',
        url: url,
        headers:  header,
        'timeout' : c_requestTimeout
      };
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200) // true
        let bodyType = response.body.supportInformation.bodyType
        console.log(`supportInformation.bodyType: ${bodyType}.`)
        if (bodyType == undefined || bodyType == null){
          bodyType = ''
        }
        cy.readFile(logFilename).then((text) => {
          const addRow = `vin: ${$car[0]} expected: ${$car[1].padStart(18, ' ')} real: ${bodyType.padStart(18, ' ')} desc: ${$car[3]} \n`
          text += addRow
          cy.writeFile(logFilename, text)
        })
        cy.wrap(bodyType).then((bodyType) => {
          return bodyType
        })
      }) //request(options)
    }) //get('@questionnaireId'
  }) //get('@authorization'
})
Cypress.Commands.add('getQuestionnaireInfo', () =>{
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  cy.get('@authorization').then(function (authorization) {
    cy.get('@questionnaireId').then(function (questionnaireId) {
      Cypress._.merge(header, {'authorization':authorization});
      Cypress._.merge(header, {'timeout':c_requestTimeout});
      const options = {
        method: 'GET',
        url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
        headers: header
      };
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200) // true
        let spearheadVehicle = ''
        let iBoxResult = ''
        let valuationResult = ''
        let iBoxResultSummary = ''
        let repairCost = ''
        if (response.body.internalInformation == undefined || response.body.internalInformation == null){
          spearheadVehicle = 'no internalInformation'
        } else {
          if (response.body.internalInformation.spearheadVehicle == undefined || response.body.internalInformation.spearheadVehicle == null){
            spearheadVehicle = 'no spearheadVehicle'
          } else {
            spearheadVehicle = 'has spearheadVehicle'
          }
          if (response.body.internalInformation.iBoxResult == undefined || response.body.internalInformation.iBoxResult == null){
            iBoxResult = 'no iBoxResult'
          } else {
            iBoxResult = 'has iBoxResult'
            if (response.body.internalInformation.iBoxResult.valuationResult == undefined || response.body.internalInformation.iBoxResult.valuationResult == null){
              valuationResult = 'no valuationResult'
            } else {
              valuationResult = 'has valuationResult'
              console.log(`retailValue :${response.body.internalInformation.iBoxResult.valuationResult.retailValue}.`)
            }
            if (response.body.internalInformation.iBoxResult.iBoxResultSummary == undefined || response.body.internalInformation.iBoxResult.iBoxResultSummary == null){
              iBoxResultSummary = 'no iBoxResultSummary'
            } else {
              iBoxResultSummary = 'has iBoxResultSummary'
              if (response.body.internalInformation.iBoxResult.iBoxResultSummary.repairCost == undefined || response.body.internalInformation.iBoxResult.iBoxResultSummaryrepairCost == null){
                repairCost = 'no repairCost'
              } else {
                repairCost = 'has repairCost'
                console.log(`systemValue :${response.body.internalInformation.iBoxResultSummary.repairCost.systemValue}.`)
              }
            }
          }
        }
        console.log(`spearheadVehicle :${spearheadVehicle}.`)
        console.log(`iBoxResult :${iBoxResult}.`)
        console.log(`valuationResult :${valuationResult}.`)
        console.log(`iBoxResultSummary :${iBoxResultSummary}.`)
        console.log(`repairCost :${repairCost}.`)
        // cy.wrap(bodyType).then((bodyType) => {
        //   return bodyType
        // })
      }) //request(options)
    }) //get('@questionnaireId'
  }) //get('@authorization'
})

Cypress.Commands.add('getQuestionnaireInfo2', (vin, logFilename) =>{
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  //cy.get('@authorization').then(function (authorization) {
  cy.authenticate(false).then(function (authorization) {
    cy.get('@questionnaireId').then(function (questionnaireId) {
      Cypress._.merge(header, {'authorization':authorization});
      Cypress._.merge(header, {'timeout':c_requestTimeout});
      const options = {
        method: 'GET',
        url: `${baseUrl_lp}questionnaire/${questionnaireId}`,
        headers: header
      };
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200) // true
        let spearheadVehicle = ''
        let iBoxResult = ''
        let valuationResult = ''
        let iBoxResultSummary = ''
        let repairCost = ''
        if (response.body.internalInformation == undefined || response.body.internalInformation == null){
          spearheadVehicle = 'no internalInformation'
        } else {
          if (response.body.internalInformation.spearheadVehicle == undefined || response.body.internalInformation.spearheadVehicle == null){
            spearheadVehicle = 'no spearheadVehicle'
          } else {
            spearheadVehicle = 'has spearheadVehicle'
          }
          if (response.body.internalInformation.iBoxResult == undefined || response.body.internalInformation.iBoxResult == null){
            iBoxResult = 'no iBoxResult'
          } else {
            iBoxResult = 'has iBoxResult'
            if (response.body.internalInformation.iBoxResult.valuationResult == undefined || response.body.internalInformation.iBoxResult.valuationResult == null){
              valuationResult = 'no valuationResult'
            } else {
              valuationResult = 'has valuationResult'
              console.log(`retailValue :${response.body.internalInformation.iBoxResult.valuationResult.retailValue}.`)
            }
            if (response.body.internalInformation.iBoxResult.iBoxResultSummary == undefined || response.body.internalInformation.iBoxResult.iBoxResultSummary == null){
              iBoxResultSummary = 'no iBoxResultSummary'
            } else {
              iBoxResultSummary = 'has iBoxResultSummary'
              if (response.body.internalInformation.iBoxResult.iBoxResultSummary.repairCost == undefined || response.body.internalInformation.iBoxResult.iBoxResultSummaryrepairCost == null){
                repairCost = 'no repairCost'
              } else {
                repairCost = 'has repairCost'
                console.log(`systemValue :${response.body.internalInformation.iBoxResultSummary.repairCost.systemValue}.`)
              }
            }
          }
        }
        console.log(`spearheadVehicle :${spearheadVehicle}.`)
        console.log(`iBoxResult :${iBoxResult}.`)
        console.log(`valuationResult :${valuationResult}.`)
        console.log(`iBoxResultSummary :${iBoxResultSummary}.`)
        console.log(`repairCost :${repairCost}.`)
        let pageId = response.body.pageId
        if (pageId === undefined){
          pageId = 'undefined'
        }
        console.log(`pageId :${pageId}.`)
        // cy.wrap(bodyType).then((bodyType) => {
        //   return bodyType
        // })
      }) //request(options)
    }) //get('@questionnaireId'
  }) //get('@authorization'
})

Cypress.Commands.add('postPost', (xhr, hasDialog = true) =>{
  if (xhr.response.statusCode != 200){
    console.log(`status: ${xhr.response.statusCode}`);
    console.log(`internalErrorCode: ${xhr.response.body.internalErrorCode}`);
    console.log(`message: ${xhr.response.body.message}`);
    throw new Error(`test fails : ${xhr.response.body.message}`)
  }
  expect(xhr.response.statusCode).to.equal(200)
  const notificationId = xhr.response.body.notification.id;
  Cypress.env('notificationId', notificationId)
  console.log(`notificationId: ${notificationId}`);
  cy.printRequestedInformation(xhr.response.body.notification.body.requestedInformation)
  if (hasDialog){
    const buttonRetry = 'button[type="button"][data-test="error-alert-button-retry"]'
    cy.get(buttonRetry, { timeout: c_requestTimeout }).should('be.visible');
    // close modal-dialog
    cy.get(buttonRetry).click()
  }
  cy.wrap(notificationId).then((notificationId) => {
    return notificationId
  })
})


Cypress.Commands.add('generatePdf', function (baseUrl_lp, pdfPath, pdf_template) {
  cy.get('@authorization').then(function (authorization) {
    const notificationId = Cypress.env('notificationId')
    Cypress._.merge(header, {'authorization':authorization})

    const options = {
      method: 'GET',
      encoding : 'base64',
      url: `${baseUrl_lp}damage/notification/${notificationId}/pdf/${pdf_template}`,
      headers: header
    }
    cy.request(options).then(
      (response) => {
      expect(response.status).to.eq(200)
      const filePath = `${pdfPath}${pdf_template}_${notificationId}.pdf`;
      cy.writeFile(filePath, response.body, 'base64')
    })
  }) //get('@authorization'
})

Cypress.Commands.add(`GeneratePDFs`, function (pdf_templates) {

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const pdfPath = 'cypress/fixtures/Pdf/'

  cy.authenticate().then(function (authorization) {

    Cypress._.merge(header, {'authorization':authorization});
    const damageNotificationId = Cypress.env('notificationId')
    if (damageNotificationId != null && damageNotificationId.length > 0){
      const options = {
        method: 'GET',
        url: `${baseUrl_lp}damage/notification/${damageNotificationId}`,
        headers: header
      }
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200) // true
        const vin = response.body.body.vehicleIdentification.vin;
        console.log(`GeneratePDFs for vin: ${vin}`)
        pdf_templates.forEach(pdf_template => {
          cy.generatePdf(baseUrl_lp, pdfPath, pdf_template)
        })
      })
    } else {
      assert.isOk('OK', 'damageNotificationId not exist.')
    }
  })
})

Cypress.Commands.add('printRequestedInformation', function (requestedInformation) {
  if (requestedInformation != null && requestedInformation.length > 0){
    requestedInformation.forEach((element, index) => {
      console.log(`ri[${index}]:`);
      console.log(`questionnaireId:${element.questionnaireId}`);
      console.log(`workflowType:${element.workflowType}`);
      console.log(`templateId:${element.templateId}`);
      console.log(`requestUrl:${element.requestUrl}`);
    });
  }

})


Cypress.Commands.add('authenticate', function (bearer = true) {
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const userCredentials =  {
    "password": Cypress.env("passwordHukS"),
    "remoteUser": "",
    "sessionLanguage": "en",
    "userName": Cypress.env("usernameHukS")
  }
  const options = {
    method: 'POST',
    url: `${baseUrl_lp}member/authenticate`,
    body: userCredentials,
    log : false
  }
  cy.request(options)
    .its('body').then(body => {
      const authorization = bearer ? `Bearer ${ body.accessToken }` : `${ body.accessToken }`;
      cy.wrap(authorization,{ log : false}).then((authorization) => {
        return authorization
      })
    })
})


Cypress.Commands.add('commanBeforeEach', () =>{
  console.clear()
  cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
  cy.intercept('POST', `/questionnaire/*/post?locale=de`).as('postPost')
  cy.intercept('GET',  `/questionnaire/*/currentPage?offset=*&locale=de`).as('currentPage')
  cy.intercept('GET', `/questionnaire/*/picture/clickableCar*`,{ log: false }).as('clickableCar')
  cy.intercept('POST', '/questionnaire/*/page/page-*', (req) => {
    if (req.url.includes('navigateTo')) {
      req.alias = "nextPage"
    } else {
      req.alias = "savePage"
    }
  })
  cy.intercept('GET', `/questionnaire/*/page/page-*?navigateTo=previous&locale=de`).as('prevPage')
  cy.intercept('POST', `/member/oauth/token`).as('token')
})















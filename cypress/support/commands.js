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

// Cypress.Commands.add('loginToApplication',() =>{

//   const userCredentials =  {
//     "user": {
//         "email": Cypress.env("username"),
//         "password": Cypress.env("password")
//     }
//   }

//   cy.request('POST',Cypress.env("apiUrl") + '/api/users/login',userCredentials)
//     .its('body').then(body => {
//       const token = body.user.token
//       cy.wrap(token).as('token')

//       cy.visit('/',{
//         onBeforeLoad(win){
//           win.localStorage.setItem('jwtToken', token)
//         }
//       })
//   })
//   // cy.visit('/login')
//   // cy.get('[placeholder="Email"]').type('artem.bondar16@gmail.com')
//   // cy.get('[placeholder="Password"]').type('CypressTest1')
//   // cy.get('form').submit()
// })

// Cypress.Commands.add('loginToHukStandalone',() =>{

//   const userCredentials =  {
//     "password": Cypress.env("passwordHukS"),
//     "remoteUser": "",
//     "sessionLanguage": "en",
//     "userName": Cypress.env("usernameHukS")
//   }


//   cy.request('POST','https://dev02.spearhead-ag.ch/member/authenticate',userCredentials)
//     .its('body').then(body => {
//       const token = body.accessToken
//       cy.wrap(token).as('token')

//       cy.visit('https://dev02.spearhead-ag.ch/ui/questionnaire/zurich/#/standalone/home?theme=huk',{
//         onBeforeLoad(win){
//           win.localStorage.setItem('jwtToken', token)
//           win.sessionStorage.setItem("access_token", "value")
//         }
//       })
//   })
//   // cy.visit('/login')
//   // cy.get('[placeholder="Email"]').type('artem.bondar16@gmail.com')
//   // cy.get('[placeholder="Password"]').type('CypressTest1')
//   // cy.get('form').submit()
// })

// Cypress.Commands.add('toniHdiPhotosUpload', ($dev,pageId,fileToUpload,timeoutFileUpload) =>{
//     cy.intercept('POST', `https://${$dev}.spearhead-ag.ch/questionnaire/*/page/page-${pageId}?locale=de`).as(`waitPage`)
//     cy.fixture(fileToUpload, null).as('MyfileToUpload')
//     cy.get('input[type=file]').each(($el, index, $list) => {
//       console.log(`index:` + index)
//       console.log(`$el:` + cy.wrap($el))
//       console.log(`$list[${index}]:` + $list[index])
//       console.log(`$list.length:` + $list.length)
//       console.log(`$list:` + $list)
//       // $el is a wrapped jQuery element
//       cy.wrap($el).selectFile('@MyfileToUpload',{ force: true , timeout: timeoutFileUpload})
//       const w = 3000*$list.length;
//       console.log(`wait:` + w)
//       cy.wait(w)
//   })
//   cy.wait(`@waitPage`).then(xhr => {
//     //console.log(xhr)
//     expect(xhr.response.statusCode).to.equal(200)
//     const pageId1 = xhr.response.body.pageId;
//     console.log(`pageId:${pageId1}`);
//     expect(pageId1).to.equal(`page-${pageId}`)
//   })
//   //cy.get('div[class="dz-preview dz-image-preview row dz-complete"]').should('exist');
//   cy.get('div[class^="error-container d-block"]').should('not.exist');
//   cy.wait(1000)

// })

// Cypress.Commands.add('toniHdiPhotosUpload2', ($dev,pageId,fileToUpload,timeoutFileUpload,len) =>{
//   cy.intercept('POST', `https://${$dev}.spearhead-ag.ch/questionnaire/*/page/page-${pageId}?locale=de`).as(`waitPage`)
//   cy.fixture(fileToUpload, null).as('MyfileToUpload')
//   cy.get('input[type=file]').each((item, index, list) => {
//     // Returns the elements from the cy.get command
//     //expect(list).to.have.length(len);
//     cy.wrap(item).selectFile('@MyfileToUpload',{ force: true , timeout: timeoutFileUpload})
//   });
//   cy.wait(`@waitPage`).then(xhr => {
//     //console.log(xhr)
//     expect(xhr.response.statusCode).to.equal(200)
//     const pageId1 = xhr.response.body.pageId;
//     console.log(`pageId:${pageId1}`);
//     expect(pageId1).to.equal(`page-${pageId}`)
//   })
//   //cy.get('div[class="dz-preview dz-image-preview row dz-complete"]').should('exist');
//   cy.get('div[class^="error-container d-block"]').should('not.exist');
//   cy.wait(1000)
// })

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


Cypress.Commands.add('postPost', (xhr, hasDialog = true) =>{
  if (xhr.response.statusCode != 200){
    console.log(`status: ${xhr.response.statusCode}`);
    console.log(`internalErrorCode: ${xhr.response.internalErrorCode}`);
    console.log(`message: ${xhr.response.message}`);
  }
  expect(xhr.response.statusCode).to.equal(200)
  const notificationId = xhr.response.body.notification.id;
  console.log(`notificationId: ${notificationId}`);
  const requestedInformation = xhr.response.body.notification.body.requestedInformation;
  console.log(`requestedInformation: ${requestedInformation}`);
  if (requestedInformation != null && requestedInformation.length > 0){
    requestedInformation.forEach((element, index) => {
      console.log(`requestedInformation[${index}]:`);
      console.log(`questionnaireId: ${element.questionnaireId}`);
      console.log(`workflowType: ${element.workflowType}`);
      console.log(`templateId: ${element.templateId}`);
      console.log(`requestUrl: ${element.requestUrl}`);
    });
    if (false) {
      cy.visit(requestedInformation[0].requestUrl)
      cy.get('.loader')
      .should('not.exist')
      cy.wait(1000)
    }
  }
  if (hasDialog){
    const buttonRetry = 'button[type="button"][data-test="error-alert-button-retry"]'
    cy.get(buttonRetry, { timeout: c_requestTimeout }).should('be.visible');
    // close modal-dialog
    cy.get(buttonRetry).click()
  }
})

Cypress.Commands.add('generatePdf', function (baseUrl_lp, pdfPath, pdf_template) {
  cy.get('@authorization').then(function (authorization) {
    cy.get('@notificationId').then(function (notificationId) {
      // console.log(`baseUrl_lp: ${baseUrl_lp}`)
      // console.log(`pdfPath: ${pdfPath}`)
      // console.log(`pdf_template: ${pdf_template}`)
      // console.log(`authorization: ${authorization}`)
      // console.log(`notificationId: ${notificationId}`)
      const options = {
        method: 'GET',
        encoding : 'base64',
        url: `${baseUrl_lp}damage/notification/${notificationId}/pdf/${pdf_template}`,

        //responseTimeout: 60000,
        headers: {
          'Accept': '*/*',
          'Accept-Encoding':'gzip, deflate, br',
          'Content-Type': 'application/json',
          'Connection' : 'keep-alive',
          authorization
        }
      }
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200)
        const filePath = `${pdfPath}${pdf_template}_${notificationId}.pdf`;
        cy.writeFile(filePath, response.body, 'base64')
      })
    }) //get('@notificationId'
  }) //get('@authorization'
})

















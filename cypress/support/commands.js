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
import emailBody from '../fixtures/templates/emailBody.json'
import smsBody from '../fixtures/templates/smsBody.json'

import { getPageTitle } from "../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../support/utils/common.js";


const c_requestTimeout = 999999//60000;



Cypress.Commands.add('elementExists', (selector) =>{
  cy.get('body').then(($body) => {
    if ($body.find(selector).length) {
      //return cy.get(selector)
      return true
    } else {
      // Throws no error when element not found
      assert.isOk('OK', 'Element does not exist.')
      return false
    }
  })
})

Cypress.Commands.add('selectSVG', (selectorId) =>{
  const attrName = 'data-selection-state'
  cy.get('svg',{ log : false }).find(`g#${selectorId}`,{ log : false }).invoke('attr', attrName).then(($state) => {
    if ($state == undefined || $state == "no"){
      cy.get('svg',{ log : false }).find(`g#${selectorId}`,{ log : false }).click({ force: true, log : false })
    }
    cy.get(`svg`,{ log : false }).find(`g#${selectorId}`,{ log : false }).invoke('attr', attrName).should('eq', 'yes')
  })
})


Cypress.Commands.add('selectAllSVGs', (areas,SVGbody,excludeAreas) =>{
  areas.forEach(area =>{
    const regex = `g id="${area.id}"`;
    if (area.visible && area.enabled && !excludeAreas.includes(area.id) && SVGbody.search(regex) > 0){
      //console.log(area.id)
      cy.selectSVG(area.id)
    }
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

function selectFromListOld(selectorId,option,classValue){
  cy.get(`div#${selectorId}`,{ log : false }).find(`label[for="${selectorId}_${option}"]`,{ log : false }).parent('div').then(($parent) => {
    const classList = Array.from($parent[0].classList);
    if (!classList.includes(classValue)){
      cy.get(`div#${selectorId}`,{ log : false }).find(`label[for="${selectorId}_${option}"]`,{ log : false }).click({ force: true, log : false })
    }
    cy.get(`div#${selectorId}`,{ log : false })
    .find(`label[for="${selectorId}_${option}"]`,{ log : false }).parent('div').should('have.class', classValue)
  })
}

function selectFromList(selectorId,option,classValue){
  cy.get(`div[id="${selectorId}"]`,{ log : false }).find(`label[for="${selectorId}_${option}"]`,{ log : false }).parent('div').then(($parent) => {
    const classList = Array.from($parent[0].classList);
    if (!classList.includes(classValue)){
      cy.get(`div[id="${selectorId}"]`,{ log : false }).find(`label[for="${selectorId}_${option}"]`,{ log : false }).click({ force: true, log : false })
    }
    cy.get(`div[id="${selectorId}"]`,{ log : false })
    .find(`label[for="${selectorId}_${option}"]`,{ log : false }).parent('div').should('have.class', classValue)
  })
}


Cypress.Commands.add('selectMultipleList', (selectorId, option) =>{
  selectFromList(selectorId,option,'checkbox--checked');
})

Cypress.Commands.add('selectSingleList', (selectorId, option) =>{
  selectFromList(selectorId,option,'radio--checked');
})


// You can use jquery via Cypress.$ to check if any exist.

// const listItemTitle = '[data-cy-component=list-item-title]';
// if (Cypress.$(listItemTitle).length > 0) {
//   cy.get(listItemTitle).each(($el, index, $list) => {
//     cy.wrap($el).then(($span) => {
//     const spanText = $span.text();
//     cy.log(`index: ` + index + ' ' + spanText);
//     });
//   });
// }
function selectAllFromLists(containerClass,option, log){
  cy.get(`div.${containerClass}`).should("have.length.gte", 0).then($containerClass => {
    if ($containerClass.length > 0){
          cy.get(`div.${containerClass}`)
          .should('be.visible')
          .each(($container, index, $list) => {
            //const firstDit = $container
            cy.wrap($container)
            .find('label.form-check-label').then(labels =>{
              //cy.wrap(labels).first().click({ force: true })
              cy.wrap(labels).first().invoke('attr','for').then($for => {
                if (log){
                  console.log(`${containerClass} : ${$for.slice(0, -2)}`)
                }
                if ( containerClass == 'single-list-container'){
                  cy.selectSingleList($for.slice(0, -2),option)
                } else {
                  cy.selectMultipleList($for.slice(0, -2),option)
                }
              })
            })
          })
        }
    }
  )
}

Cypress.Commands.add('selectAllMultipleList', (option,log = true) =>{
  selectAllFromLists('multiple-list-container',option, log)
})

Cypress.Commands.add('selectAllSingleLists', (option,log = true) =>{
    selectAllFromLists('single-list-container',option, log)
})



Cypress.Commands.add('selectDropDown', (selectorId, option) =>{
  cy.get(`select#${selectorId}`).invoke('attr', 'class').then($classNames => {
    console.log(`class Names :  ${$classNames}.`)
    if ($classNames.includes('field-invalid') || $classNames.includes('ng-invalid')) {
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
  cy.get(`form#${selectorId}`).find('button').last().selectFile(`${toPath}${fileName}`, {
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



//does not work
Cypress.Commands.add('selectAllSVG_VZ', () =>{
  cy.get('svg',{ log : false }).find('g').each(($g_element, index, $list) => {
    cy.wrap($g_element).invoke('attr', 'id')
    .then((id) => {
      cy.log(id) //prints id
      cy.selectSVG_VZ(id)
    })
  })

})

function pad_with_zeroes(number, length) {

  var my_string = '' + number;
  while (my_string.length < length) {
      my_string = '0' + my_string;
  }

  return my_string;

}

function typeIntoAllTextAreaOrInput (elements, text, delay = 0) {
  cy.get(elements).its('length').then((len) => {
    console.log(`Number of ${elements}s to type :${len}.`)
  })
  cy.get(elements).each(($element, index, $list) => {
    cy.wrap($element)
    .invoke('attr', 'id')
    .then((id) => {
      cy.wait(delay)
      console.log(`[${index}] : ${id}.`) //prints id
      cy.get(`#${id}`).clear().type(`${pad_with_zeroes(index+1,3)} ${id} - ${text}`)
    })
  })
}

Cypress.Commands.add('typeIntoAllTextArea', (text, delay = 0) =>{
  typeIntoAllTextAreaOrInput ('textarea', text, delay)
  // cy.get('textarea').each(($textarea, index, $list) => {
  //   cy.wrap($textarea)
  //   .invoke('attr', 'id')
  //   .then((id) => {
  //     console.log(`$textarea[${index}] : ${id}.`) //prints id
  //     cy.get(`#${id}`).clear().type(`${pad_with_zeroes(index+1,3)} ${id} - ${text}`)
  //   })
  // })
})

Cypress.Commands.add('typeIntoAllInput', (text, delay = 0) =>{
  typeIntoAllTextAreaOrInput ('input[type="text"]', text, delay)
  // cy.get('input[type="text"]').each(($input, index, $list) => {
  //   cy.wrap($input)
  //   .invoke('attr', 'id')
  //   .then((id) => {
  //     console.log(`$input[${index}] : ${id}.`) //prints id
  //     cy.get(`#${id}`).clear().type(`${pad_with_zeroes(index+1,3)} ${id} - ${text}`)
  //   })
  // })
})

Cypress.Commands.add('uploadAllImagesOnPage', (PathToImages, delay = 2000) =>{
  cy.get('form').its('length').then((len) => {
    console.log(`Number of images to upload :${len}.`)
  })
  cy.get('form').each(($form, index, $list) => {
    cy.wrap($form)
    .invoke('attr', 'id')
    .then((id) => {
      console.log(`$form[${index}] : ${id}.`) //prints id
      cy.wait(delay) // 3000 does not work for 80 images, 4000 -> only 68
      if (id.includes('hood')){
        cy.uploadImage(id,PathToImages,'hood.jpg')
      } else if (id.includes('roof')){
        cy.uploadImage(id,PathToImages,'roof.jpg')
      } else if (id.includes('window')){
        cy.uploadImage(id,PathToImages,'broken front window_2.jpg')
      } else if (id.includes('odometer')){
        cy.uploadImage(id,PathToImages,'image dashboard-odometer.jpg')
      } else if (id.includes('interior-front')){
        cy.uploadImage(id,PathToImages,'interior-front.jpg')
      }  else if (id.includes('-sill')){
        cy.uploadImage(id,PathToImages,'left-sill-d.jpg')
      } else if (id.includes('left-taillight')){
        cy.uploadImage(id,PathToImages,'left-taillight.jpg')
      } else if (id.includes('right-taillight')){
        cy.uploadImage(id,PathToImages,'right-taillight-o.jpg')
      } else if (id.includes('registration-part')){
        cy.uploadImage(id,PathToImages,'registration-part-1.jpg')
      } else if (id.includes('vehicle-left-rear') || id.includes('vehicle-right-rear') || id.includes('rear-view')){
        cy.uploadImage(id,PathToImages,'vehicle-left-rear-photo.jpg')
      } else if (id.includes('vehicle-left-front') || id.includes('vehicle-right-front') || id.includes('front-view')){
        cy.uploadImage(id,PathToImages,'vehicle-right-front-photo.jpg')
      } else if (id.includes('door')){
        cy.uploadImage(id,PathToImages,'door-2.jpg')
      }  else if (id.includes('grill')){
        cy.uploadImage(id,PathToImages,'grill-2.jpg')  //15mbmb.jpg grill-2.jpg
      } else if (id.includes('left-taillight')){
        cy.uploadImage(id,PathToImages,'right-taillight-o.jpg')
      } else if (id.includes('right-taillight')){
        cy.uploadImage(id,PathToImages,'right-taillight-d.jpg')
      } else if (id.includes('vehicle-registration-ocr-part-1-photo-upload')){
        cy.uploadImage(id,PathToImages,'registration-part-1.jpg')
      } else if (id.includes('vehicle-registration-part-1-photo-upload')){
        cy.uploadImage(id,PathToImages,'registration-part-1.jpg')
      }
      else {
        cy.uploadImage(id,PathToImages,'airbag.jpg')
      }

    })
  })
})

Cypress.Commands.add('getBodyType', ($car,logFilename) =>{
  const showDetailLog = false
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
        console.log(`templateId: ${response.body.templateId}.`)
        console.log(`pages total count: ${response.body.pages.length}.`)
        console.log(`pages question count: ${response.body.pages.filter((x) => x.pageType == "question").length}.`)
        console.log(`pages null count: ${response.body.pages.filter((x) => x.pageType == null).length}.`)
        console.log(`pages summary count: ${response.body.pages.filter((x) => x.pageType == "summary").length}.`)
        console.log(`pages summary-page-questions count: ${response.body.pages.filter((x) => x.id == "summary-page-questions").length}.`)
        console.log(`pages finalPage count: ${response.body.pages.filter((x) => x.pageType == "finalPage").length}.`)
        let questionsAll = 0
        response.body.pages.forEach((page, index) => {
            if (showDetailLog) {
              console.log(`page id : ${page.id} pageType : ${page.pageType} index :  ${index}.`)
            }
            const questions = page.elements.length
            if (page.pageType == "summary"){
              console.log(`summaryElements : ${questions}.`)
            } else {
              if (showDetailLog) {
                console.log(`questions : ${questions}.`)
              }
              questionsAll += questions
            }
        })
        console.log(`All questions count : ${questionsAll}.`)

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
        let spearheadVehicle = response.body.internalInformation
        let iBoxResult = response.body.internalInformation?.iBoxResult
        let valuationResult = response.body.internalInformation?.iBoxResult?.valuationResult
        let iBoxResultSummary = response.body.internalInformation?.iBoxResult?.iBoxResultSummary

        const retailValue = response.body.internalInformation?.iBoxResult?.valuationResult?.retailValue
        const systemValue = response.body.internalInformation?.iBoxResult?.iBoxResultSummary?.repairCost?.systemValue

        console.log(`spearheadVehicle :${spearheadVehicle}.`)
        console.log(`iBoxResult :${iBoxResult}.`)
        console.log(`valuationResult :${valuationResult}.`)
        console.log(`iBoxResultSummary :${iBoxResultSummary}.`)
        console.log(`retailValue :${retailValue}.`)
        console.log(`systemValue :${systemValue}.`)
        // cy.wrap(bodyType).then((bodyType) => {
        //   return bodyType
        // })
      }) //request(options)
    }) //get('@questionnaireId'
  }) //get('@authorization'
})


Cypress.Commands.add('getInternalInformation', () =>{
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
        cy.wrap(response.body.internalInformation).then((internalInformation) => {
           return internalInformation
        })
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

Cypress.Commands.add('completePost', (xhr, hasDialog = true) =>{
  if (xhr.response.statusCode != 200){
    console.log(`status: ${xhr.response.statusCode}`);
    console.log(`internalErrorCode: ${xhr.response.body.internalErrorCode}`);
    console.log(`message: ${xhr.response.body.message}`);
    throw new Error(`test fails : ${xhr.response.body.message}`)
  }
  expect(xhr.response.statusCode).to.equal(200)
  const notificationId = xhr.response.body.relatesTo.notificationId;
  Cypress.env('notificationId', notificationId)
  console.log(`answers count: ${xhr.response.body.answers.length}`);
  console.log(`notificationId: ${notificationId}`);
  console.log(`status: ${xhr.response.body.status}`);
  if (hasDialog){

  }
  cy.wrap(notificationId).then((notificationId) => {
    return notificationId
  })
})


Cypress.Commands.add('generatePdf', function (baseUrl_lp, pdfPath, pdf_template,authorization) {
  //cy.get('@authorization').then(function (authorization) {
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
  //}) //get('@authorization'
})

Cypress.Commands.add('generateEmail', function (baseUrl_lp, email_template,q_template) {
  cy.get('@authorization').then(function (authorization) {
    const notificationId = Cypress.env('notificationId')
    if(notificationId == undefined || notificationId == null || !notificationId.length > 0){
      throw new Error(`test fails : notificationId = ${notificationId}`)
    }
    Cypress._.merge(header, {'authorization':authorization})

    emailBody.emailTemplate = email_template

    const options = {
      method: 'POST',
      url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/${q_template}?unknownReceiver=false`,
      body: emailBody,
      headers: header
    }
    cy.request(options).then(
      (response) => {
      expect(response.status).to.eq(200)
      console.log(`notificationId : ${notificationId}`)
      cy.printRequestedInformation(response.body.requestedInformation)
    })
  }) //get('@authorization'
})

Cypress.Commands.add('generateSMS', function (baseUrl_lp, sms_template,q_template) {
  cy.get('@authorization').then(function (authorization) {
    const notificationId = Cypress.env('notificationId')
    if(notificationId == undefined || notificationId == null || !notificationId.length > 0){
      throw new Error(`test fails : notificationId = ${notificationId}`)
    }
    Cypress._.merge(header, {'authorization':authorization})

    smsBody.smsTemplate = sms_template

    const options = {
      method: 'POST',
      url: `${baseUrl_lp}damage/notification/${notificationId}/requestInformation/${q_template}?unknownReceiver=false`,
      body: smsBody,
      headers: header
    }
    cy.request(options).then(
      (response) => {
      expect(response.status).to.eq(200)
      console.log(`notificationId : ${notificationId}`)
      cy.printRequestedInformation(response.body.requestedInformation)
    })
  }) //get('@authorization'
})

Cypress.Commands.add(`GeneratePDFs`, function (pdf_templates) {

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const pdfPath = 'cypress/fixtures/Pdf/'

  cy.authenticate().then(function (authorization) {

    //console.log(`authorization: ${authorization}`)

    Cypress._.merge(header, {'authorization':authorization});
    const notificationId = Cypress.env('notificationId')
    if (notificationId != null && notificationId.length > 0){
      const options = {
        method: 'GET',
        url: `${baseUrl_lp}damage/notification/${notificationId}`,
        headers: header
      }
      //console.log(`header authorization: ${header.authorization}`)
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200) // true
        const vin = response.body.body.vehicleIdentification.vin;
        console.log(`GeneratePDFs for vin: ${vin}`)
        pdf_templates.forEach(pdf_template => {
          cy.generatePdf(baseUrl_lp, pdfPath, pdf_template,authorization)
          console.log(`pdf template : ${pdf_template}`)
        })
      })
    } else {
      assert.isOk('OK', 'notificationId not exist.')
    }
  })
})

Cypress.Commands.add(`GenerateEmails`, function (email_templates,q_template) {

  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`

  cy.authenticate().then(function (authorization) {

    Cypress._.merge(header, {'authorization':authorization});
    const notificationId = Cypress.env('notificationId')
    if (notificationId != null && notificationId.length > 0){
      const options = {
        method: 'GET',
        url: `${baseUrl_lp}damage/notification/${notificationId}`,
        headers: header
      }
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200) // true
        const vin = response.body.body.vehicleIdentification.vin;
        console.log(`GenerateEmails for vin: ${vin}`)
        email_templates.forEach(email_template => {
          cy.generateEmail(baseUrl_lp, email_template,q_template)
          console.log(`email template : ${email_template} q template : ${q_template}`)
        })
      })
    } else {
      assert.isOk('OK', 'notificationId not exist.')
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
      Cypress.env('requestUrl', element.requestUrl)
    });
  }

})

Cypress.Commands.add('getRequestUrl', function () {
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`
  const notificationId = Cypress.env('notificationId')
  if(notificationId == undefined || notificationId == null || !notificationId.length > 0){
    throw new Error(`test fails : notificationId = ${notificationId}`)
  }
  cy.authenticate().then(function (authorization) {
    Cypress._.merge(header, {'authorization':authorization});
    const options = {
      method: 'GET',
      url: `${baseUrl_lp}damage/notification/${notificationId}`,
      body: {},
      headers: header
    };
    cy.request(options).then(
      (response) => {
        // response.body is automatically serialized into JSON
        expect(response.status).to.eq(200) // true
        const arrLength = response.body.body.requestedInformation.length
        const requestedInformation = response.body.body.requestedInformation[arrLength - 1]
        const requestUrl = requestedInformation.requestUrl
        console.log(`requestUrl : ${requestUrl}`);
        Cypress.env('requestUrl', requestUrl)
        const templateId = requestedInformation.templateId
        console.log(`templateId : ${templateId}`);
        Cypress.env('templateId', templateId)
        const questionnaireId = requestedInformation.questionnaireId
        console.log(`questionnaireId : ${questionnaireId}`);
        Cypress.env('questionnaireId', questionnaireId)
        //cy.printRequestedInformation(response.body.requestedInformation);
    })
  })

})


Cypress.Commands.add('authenticate', function (bearer = true) {
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const username = Cypress.env("usernameHukS")
  console.log(`username : ${username}`);
  const userCredentials =  {
    "password": Cypress.env("passwordHukS"),
    "remoteUser": "",
    "sessionLanguage": "en",
    "userName": username
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

Cypress.Commands.add('commanBeforeEach',(goingPage,questionnaire) =>{
  console.clear()
  cy.intercept({ resourceType: /fetch/ }, { log: false })
  cy.intercept('POST', `/questionnaire/*/attachment/answer/*/index-*?locale=de`).as('attachmentAnswer')
  cy.intercept('POST', `/questionnaire/*/post?locale=de`,{ log: false }).as('postPost')
  cy.intercept('POST', `/questionnaire/*/complete`,{ log: false }).as('completePost')
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
  cy.wrap(goingPage).its('pageId').as('goingPageId')
  cy.wrap(goingPage).its('elements').as('goingPageElements')
  cy.wrap(questionnaire).its('Id').as('questionnaireId')
  cy.wrap(questionnaire).its('authorization').as('authorization')
  cy.wrap(questionnaire).its('bodyType').as('bodyType')
  cy.wrap(questionnaire).its('notificationId').as('notificationId')
  cy.wrap(questionnaire).its('is3Dcar').as('is3Dcar')
})

Cypress.Commands.add('fulfilInputIfEmpty', function ($div, $input, $newValue) {
  cy.get($div).find($input).then((element)=>{
    cy.wrap(element).invoke('val').then($val => {
      if (!$val.length > 0){
        cy.wrap(element).type($newValue)
      }
    })
  })
})

const pushElements = (obj, goingPage) => {
  if(!obj) return;  // Added a null check for  Uncaught TypeError: Cannot convert undefined or null to object
  for (const [key, val] of Object.entries(obj)) {
    if (key == 'id' || key == 'visibleExpression' || key == 'enableExpression'){
      console.log(`${key}: ${JSON.stringify(val)}`)
      cy.then(function () {
        goingPage.elements.push(val)
      })
    }
    if (typeof val === "object") {
      pushElements(val, goingPage);   // recursively call the function
    }
  }
}

Cypress.Commands.add('waitingFor', function ($waitFor, $goingPage, $questionnaire) {
  cy.wait($waitFor,{requestTimeout : c_requestTimeout}).then(xhr => {
    expect(xhr.response.statusCode).to.equal(200)
    const pageId = xhr.response.body.pageId
    const  title = getPageTitle(xhr.response.body)
    console.log(`Comming page ${pageId} - ${title}.`)
    cy.then(function () {
      //$goingPage.elements = []
      if (pageId != 'summary-page' && xhr.response.body?.elements != undefined && xhr.response.body?.elements != null){
        $goingPage.elements = xhr.response.body.elements
      } else {
        $goingPage.elements = []
      }
    })
    //pushElements(xhr.response.body.elements, $goingPage)
    //printQuestionnaireIds(xhr.response.body.elements)
    cy.then(function () {
      $goingPage.pageId = pageId
    })
    if ($waitFor == '@currentPage'){
      cy.then(function () {
        $questionnaire.Id = getQuestionnaireIdFromLinks(xhr.response.body.links.next)
        $questionnaire.authorization = xhr.request.headers.authorization
      })
    }
})

})

Cypress.Commands.add('getQuestionnaireAnswers', () =>{
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  cy.get('@authorization').then(function (authorization) {
    cy.get('@questionnaireId').then(function (questionnaireId) {
      Cypress._.merge(header, {'authorization':authorization});
      Cypress._.merge(header, {'timeout':c_requestTimeout});
      const options = {
        method: 'GET',
        url: `${baseUrl_lp}questionnaire/${questionnaireId}/questionnaireAnswers`,
        headers: header
      };
      cy.request(options).then(
        (response) => {
        expect(response.status).to.eq(200) // true
        //console.log(`getQuestionnaireAnswers body: ${JSON.stringify(response.body)}`);
        cy.wrap(response.body).then((body) => {
          return body
        })
      }) //request(options)
    }) //get('@questionnaireId'
  }) //get('@authorization'
})

Cypress.Commands.add('getQuestionAnswer', function ($questionId) {
  cy.getQuestionnaireAnswers().then(function (body) {
    const answer = body.answers.find(x => x.questionId === $questionId)?.answer
    cy.wrap(answer).then((answer) => {
      return answer
    })
  })
})

Cypress.Commands.add('standaloneLogin', function (theme, bearer = true) {
  const $dev = Cypress.env("dev");
  //const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443/`
  const username = Cypress.env("usernameHukS")
  console.log(`username : ${username}`);
  cy.visit(`https://${$dev}.spearhead-ag.ch/ui/questionnaire/zurich/#/login?theme=${theme}`,{ log : false })
  cy.get('[placeholder="Email"]').type(username)
  cy.get('[placeholder="Passwort"]').type(Cypress.env("passwordHukS"))
  cy.get('form').submit()
  cy.wait(500)

  cy.wait('@token',{requestTimeout : c_requestTimeout}).then(xhr => {
    expect(xhr.response.statusCode).to.equal(200)
    const access_token = xhr.response.body.access_token
    const authorization = bearer ? `Bearer ${ access_token }` : `${ access_token }`;
      cy.wrap(authorization,{ log : false}).then((authorization) => {
        return authorization
      })
  })
})

// Cypress.Commands.overwrite('select', (originalFn, subject, value, options) => {
//   if(typeof value == 'number'){
//     return cy.wrap(subject).children('option').eq(value).then(e => {
//       return originalFn(subject, e.text().trim(), options);
//     });
//   }
//   else{
//     return originalFn(subject, value, options);
//   }
// });

Cypress.Commands.add('fillInvalidDropDown', (selectorId) =>{
  console.log(`Try select ${selectorId} .`)
  cy.selectorHasAttrClass(`select#${selectorId}`,'field-invalid').then(res =>{
    if (res){
      const op = 1
      cy.get(`select#${selectorId}`).invoke('attr', 'class').then($classNames => {
        console.log(`class Names :  ${$classNames}.`)
        if ($classNames.includes('field-invalid') ) {
          cy.get(`select#${selectorId}`).children('option',{timeout: 6000}).eq(op).then($text => {
            //cy.get(`select#${selectorId}`).select($text.text().trim(),{force: true, timeout: 6000})
            cy.get(`select#${selectorId}`).select($text.text().trim())
          });
          //cy.wait(6000)
          cy.get(`select#${selectorId}`).invoke('val').then($val => {
            console.log(`selected for ${selectorId} :  ${$val}.`)
            cy.get(`select#${selectorId}`).should('have.value', $val)
          })
        }
      })
      //cy.wait(2000)
      cy.get('input#vehicle-first-registration-date-input').focus()
      cy.wait(2000)
    }
  })

})













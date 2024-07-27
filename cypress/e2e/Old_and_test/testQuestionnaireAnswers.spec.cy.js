/// <reference types="cypress" />

import { getRandomInt } from "../../support/utils/common.js";
import { makeid } from "../../support/utils/common.js";
import { questionnaire } from "../../support/utils/common.js";
import header from '../../fixtures/header.json'



describe('Execute test questionnaireAnswers', () =>{

  beforeEach('Login to the app', () =>{
    console.clear()
    cy.wrap(questionnaire).its('Id').as('questionnaireId')
    cy.wrap(questionnaire).its('authorization').as('authorization')
    cy.wrap(questionnaire).its('bodyType').as('bodyType')
    cy.wrap(questionnaire).its('notificationId').as('notificationId')
  })

  const c_requestTimeout = 60000;
  const $dev = Cypress.env("dev");
  const baseUrl_lp = `https://${$dev}.spearhead-ag.ch:443//`

  function isPartSelected(selectedParts,searchPart) {
    if (Array.isArray(selectedParts)){
      if (selectedParts.length > 0){
        const value = selectedParts[0][searchPart]
        if (value != undefined){
          console.log(`searchPart: ${searchPart} value: ${value}`);
          if (value != undefined){
            console.log(`value == 'yes': ${value == 'yes'}`);
            return value == 'yes'
          }
        } else {
          console.log(`searchPart: ${searchPart} value: ${value}`);
        }
      }
    }
    return false
  }

  it(`test questionnaireAnswers`, () =>{
    cy.authenticate().then(function (authorization) {
      cy.then(function () {
        questionnaire.authorization = authorization
      })
      cy.then(function () {
        questionnaire.Id = 'K2U5kBGEwZlwyhRfRF12e'//'K2U5kBGEwZlwyhRfRF12e'//'GlJ8rBWB7rLLWIAmhXIP1' //questionnaireId2
      })
      cy.getQuestionnaireAnswers().then(function (body) {
        //console.log(`answers: ${JSON.stringify(body.answers)}`);
        console.log(`selected-parts-glass-parts-only: ${JSON.stringify(body.answers.find(x => x.questionId === 'selected-parts-glass-parts-only')?.answer)}`);
        let roof = body.answers.find(x => x.questionId === 'selected-parts-glass-parts-only')?.answer.map(x => x.roof)
        if (roof != undefined){
          console.log(`roof: ${JSON.stringify(roof)}`);
          console.log(`roof bool: ${!roof && roof.length > 0 && roof[0] == 'yes'}`);
        }
      })

      // cy.getQuestionAnswer('hail-damage-intensity').then(function (answer) {
      //   console.log(`answer: ${JSON.stringify(answer)}`);
      // })

      cy.getQuestionAnswer('selected-parts').then(function (selectedParts) {
        console.log(`selectedParts: ${JSON.stringify(selectedParts)}`);
        console.log(`selectedParts isArray: ${Array.isArray(selectedParts)}`);
        for (const obj of selectedParts) {
          console.log(obj);
        }
        console.log(`answer: ${isPartSelected(selectedParts,'roof1')}`); //windshield
      })
    })
  })

  it.only(`test questionnaire pages questions`, () =>{
    const showDetailLog = true
    cy.authenticate().then(function (authorization) {
      cy.then(function () {
        questionnaire.authorization = authorization
      })
      cy.then(function () {
        questionnaire.Id = 'RFa79HuWcIAe6qxzlMFKO'//'VrKlTncUIl9lTTpbA9VvA'
      })
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
                const pageShowCriteria = page.pageShowCriteria;
                let pageShowCriteriaStr = 'null'
                if (!(pageShowCriteria == undefined || pageShowCriteria == null)){
                  pageShowCriteriaStr = JSON.stringify(pageShowCriteria)
                }
                console.log(`pageShowCriteria : ${pageShowCriteriaStr}.`)
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
          console.log(`All questions : ${questionsAll}.`)

          if (bodyType == undefined || bodyType == null){
            bodyType = ''
          }
          cy.wrap(bodyType).then((bodyType) => {
            return bodyType
          })
        }) //request(options)
      }) //get('@questionnaireId'




    })
  })
})

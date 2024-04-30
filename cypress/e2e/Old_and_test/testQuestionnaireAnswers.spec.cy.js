/// <reference types="cypress" />

import { getRandomInt } from "../../support/utils/common.js";
import { makeid } from "../../support/utils/common.js";
import { questionnaire } from "../../support/utils/common.js";



describe('Execute test questionnaireAnswers', () =>{

  beforeEach('Login to the app', () =>{
    console.clear()
    cy.wrap(questionnaire).its('Id').as('questionnaireId')
    cy.wrap(questionnaire).its('authorization').as('authorization')
    cy.wrap(questionnaire).its('bodyType').as('bodyType')
    cy.wrap(questionnaire).its('notificationId').as('notificationId')
  })

  it(`test questionnaireAnswers`, () =>{
    cy.authenticate().then(function (authorization) {
      cy.then(function () {
        questionnaire.authorization = authorization
      })
      cy.then(function () {
        questionnaire.Id = 'FYjnB2wL9LdkIvVUjgCWz' //questionnaireId2
      })
      cy.getQuestionnaireAnswers().then(function (body) {
        //console.log(`answers: ${JSON.stringify(body.answers)}`);
        console.log(`selected-parts-glass-parts-only: ${JSON.stringify(body.answers.find(x => x.questionId === 'selected-parts-glass-parts-only').answer)}`);
        let roof = body.answers.find(x => x.questionId === 'selected-parts-glass-parts-only').answer.map(x => x.roof)
        console.log(`roof: ${JSON.stringify(roof)}`);
        console.log(`roof bool: ${!roof && roof.length > 0 && roof[0] == 'yes'}`);
      })

      cy.getQuestionAnswer('hail-damage-intensity').then(function (answer) {
        console.log(`answer: ${JSON.stringify(answer)}`);
      })

    })
  })
})

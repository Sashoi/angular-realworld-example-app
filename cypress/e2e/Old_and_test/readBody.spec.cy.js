/// <reference types="cypress" />

import { getRandomInt } from "../../support/utils/common.js";
import { makeid } from "../../support/utils/common.js";
import b2bBody from '../../fixtures/templates/b2bBody.json'



describe('Execute read body from fixture', () =>{

  beforeEach('Login to the app', () =>{
    console.clear()
  })

  it(`read body from fixture`, () =>{

    b2bBody.qas.find(q => {return q.questionId === "client-insurance-claim-number"}).answer = '123456'
    b2bBody.qas.find(q => {return q.questionId === "vehicle-vin"}).answer = 'WDB1704351F077666'
    b2bBody.qas.find(q => {return q.questionId === "client-vehicle-license-plate"}).answer = 'SOF 51234'


    console.log(b2bBody)

  })
})

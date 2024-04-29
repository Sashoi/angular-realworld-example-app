/// <reference types="cypress" />

import { getRandomInt } from "../../support/utils/common.js";
import { makeid } from "../../support/utils/common.js";
const b2bBody = 'cypress/fixtures/templates/ergoBody.xml'



describe('Execute read XML body from fixture', () =>{

  beforeEach('Login to the app', () =>{
    console.clear()
  })

  it(`read XML body from fixture`, () =>{
    cy.readFile(b2bBody).then(xml => {
      const xmlDocument = new DOMParser().parseFromString(xml,'text/xml')
      let Bezeichnung1 = xmlDocument.querySelector("Bezeichnung").textContent
      console.log(`Bezeichnung1: ${Bezeichnung1}`);
      let Bezeichnung2 = xmlDocument.getElementsByTagName("Bezeichnung")[1].textContent
      console.log(`Bezeichnung2: ${Bezeichnung2}`);
      let vinElement = xmlDocument.getElementsByTagName("Fin")[0]
      console.log(`vin: ${vinElement.textContent}`);
      let claimNumberElement = xmlDocument.getElementsByTagName("SchadenNummer")[0]
      console.log(`claimNumber: ${claimNumberElement.textContent}`);
      let roleTypeElement = xmlDocument.getElementsByTagName("RollenTyp")[0]
      console.log(`roleType: ${roleTypeElement.textContent}`);
      vinElement.textContent = 'new vin'
      console.log(`new vin: ${xmlDocument.querySelector("Fin").textContent}`);
      claimNumberElement.textContent = 'new claimNumbern'
      console.log(`new claimNumber: ${xmlDocument.querySelector("SchadenNummer").textContent}`);

      const loop = [1,2,3,4,5,6]
      const loop2 = [1,2,3]
      let ParentElement = vinElement.parentElement
      loop.forEach(index => {
        console.log(`parent ${index} of vin: ${ParentElement.nodeName }`);
        ParentElement = ParentElement.parentElement
      })

      ParentElement = claimNumberElement.parentElement
      loop.forEach(index => {
        console.log(`parent ${index} of claimNumber: ${ParentElement.nodeName }`);
        ParentElement = ParentElement.parentElement
      })

      ParentElement = roleTypeElement.parentElement
      loop.forEach((v, index, arr) => {
        console.log(`parent ${v} of roleType: ${ParentElement.nodeName }`);
        if (ParentElement.nodeName == 'body') {
          arr.length = index + 1; // Behaves like `break`
        }
        ParentElement = ParentElement.parentElement
      })

      // xmlDocument.querySelector("Fin").textContent = $car[0]
      // xmlDocument.querySelector("SchadenNummer").textContent = `KS${getRandomInt(10000000,99999999)}-${getRandomInt(1000,9999)}`
      // //<Bezeichnung>sivanchevski@soft2run.com</Bezeichnung>
      // xmlDocument.querySelector("Bezeichnung").textContent = `sivanchevski1@soft2run.com`
      // //console.log(`vin: ${xmlDocument.querySelector("Fin").textContent}`);
      // //console.log(`claimNumber: ${claimNumber}`);
      // console.log(`vin: ${xmlDocument.querySelector("Fin").textContent}`);
      // console.log(`claimNumber: ${xmlDocument.querySelector("SchadenNummer").textContent}`);
      const xmlString = new XMLSerializer().serializeToString(xmlDocument);
      //console.log(`xmlString: ${xmlString}`);
    })

  })
})

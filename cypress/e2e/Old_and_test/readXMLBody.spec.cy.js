/// <reference types="cypress" />

import { getRandomInt } from "../../support/utils/common.js";
import { makeid } from "../../support/utils/common.js";
const b2bBody = 'cypress/fixtures/templates/ergoBody.xml'



describe('Execute read XML body from fixture', () =>{

  beforeEach('Login to the app', () =>{
    console.clear()
  })

  it(`read XML body from fixture`, () =>{
    const vehicle_identification_by_hsn_tsn = false
    const vehicle_hsn_tsn_1 = 'ABC'
    const vehicle_hsn_tsn_2 = '123'
    const changeRoleType = true
    const newEmail = `sivanchevski3@soft2run.com`

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

      expect(parentElement.getElementsByTagName("SchadenNummer").length).to.eq(1)
      let claimNumberElement = parentElement.getElementsByTagName("SchadenNummer")[0]
      console.log(`claimNumber: ${claimNumberElement.textContent}`);

      Array.from(parentElement.getElementsByTagName("Bezeichnung")).forEach((element, index) => {
        console.log(`email ${index}: ${element.childNodes[0].nodeValue}`);
        element.childNodes[0].nodeValue = newEmail
      })

      expect(parentElement.getElementsByTagName("Bezeichnung").length).to.eq(2)



      // let Bezeichnung1 = xmlDocument.querySelector("Bezeichnung").textContent
      // console.log(`Bezeichnung1: ${Bezeichnung1}`);
      // let Bezeichnung2 = xmlDocument.getElementsByTagName("Bezeichnung")[1].textContent
      // console.log(`Bezeichnung2: ${Bezeichnung2}`);

      vinElement.textContent = 'new vin'
      claimNumberElement.textContent = 'new claimNumbern'

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

      if (changeRoleType){
        //expect(parentElement.getElementsByTagName("RollenTyp").length).to.eq(1)
        roleTypeElement.textContent = 'ZH'
        //console.log(`new roleType: ${parentElement.querySelector("RollenTyp").textContent}`);
        Array.from(parentElement.getElementsByTagName("RollenTyp")).forEach((element, index) => {
          console.log(`new roleType ${index}: ${element.childNodes[0].nodeValue}`);
        })
      }


      // ParentElement = vinElement.parentElement
      // loop.forEach(index => {
      //   console.log(`parent ${index} of vin: ${ParentElement.nodeName }`);
      //   ParentElement = ParentElement.parentElement
      // })

      // ParentElement = claimNumberElement.parentElement
      // loop.forEach(index => {
      //   console.log(`parent ${index} of claimNumber: ${ParentElement.nodeName }`);
      //   ParentElement = ParentElement.parentElement
      // })

      const xmlString = new XMLSerializer().serializeToString(xmlDocument);
      //console.log(`xmlString: ${xmlString}`);
    })

  })
})

/// <reference types="cypress" />
import file from '..//../fixtures/vinsArray.json'

const logFilename = 'cypress/fixtures/logs/testText.log'

describe('each', () =>{

  before('Login to the app', () => {
    //cy.loginToHukStandalone()
    console.clear()
    cy.writeFile(logFilename, '')
  })

  beforeEach('Login to the app', () => {
    //cy.loginToHukStandalone()
    //console.clear()
  })

  function isEven(n) {
    return n % 2 === 0
  }

  it('it each', () => {
    cy.wrap([4, 6, 8, 12]).each((n) =>  expect(n, 'odd').to.satisfy(isEven))
  })

  it('it vin', () => {
    cy.wrap(['WDB1704351F077666','VF3VEAHXKLZ080921','WVWZZZ6RZGY304402','ZFA25000002K44267']).each((vin) =>  {
      console.log(vin)
    })
  })

  it('it Cypress.$.each', () => {
    Cypress.$.each([0, 1, 2], (index, value) => {
      expect(index).to.eq(value)
    }) // works
  })

  it('Filedata prints only in cy.fixture block', () => {
    cy.fixture('vinsArray.json').then(fileData => {
      cy.log(JSON.stringify(fileData)); // You can access fileData only in this block.
      fileData.forEach(data => {
        cy.log(data);
      })
    })
  })

  // file.forEach($car => {
  //   it.only(`Filedata prints from import: ${$car[0]}`, () => {
  //     cy.log($car[0]);
  //     console.log(`vin :${$car[0]}, description :${$car[1]}`)
  //   })
  // })
  file.forEach($car => {
    it.only(`Filedata prints from import: ${$car[0]}`, () => {
      cy.log($car[0]);
      console.log(`vin :${$car[0]}, description :${$car[3]}`)
      cy.readFile(logFilename).then((text) => {
        text += `${$car[0]} \n`
        console.log(text)
        // write the merged object
        cy.writeFile(logFilename, text)
      })
    })
  })





})

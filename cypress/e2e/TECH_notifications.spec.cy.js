import { getRandomInt } from "../support/utils/common.js";
import { getPageTitle } from "../support/utils/common.js";
import { getQuestionnaireIdFromLinks } from "../support/utils/common.js";
import { questionnaire } from "../support/utils/common.js";
import { goingPage } from "../support/utils/common.js";
import file from '../fixtures/vinsArray.json'
import header from '../fixtures/headerXML.json'


const logFilename = 'cypress/fixtures/logs/TECH_notifications.log'
const PathToImages ='cypress/fixtures/images/'
const b2bBody = 'cypress/fixtures/templates/ergoBodyNoVin.xml' // or ergoBodyL where <PLZ>04158</PLZ> Leipzig // or ergoBodyNoVinNoPhone
const b2bBodySave = 'cypress/fixtures/templates/TECH_notificationsSave.xml'

describe('TECH notifications', () =>{

  before('clear log file', () => {
    cy.writeFile(logFilename, '')
    //Cypress.Cookies.debug(true)
  })

  beforeEach('Setting up integrations and common variables', () =>{
    console.clear()
    //https://local.kbint.spearhead-ag.ch/ui/home/#!/cookiesAgreement
    //cy.intercept('GET', `/local.kbint.spearhead-ag.ch/ui/home/*/cookiesAgreement*`).as('cookiesAgreement')

  })

  const baseUrl_lp = `https://local.kbint.spearhead-ag.ch/ui/home/#!/notifications`
  const url_cookiesAgreement= 'local.kbint.spearhead-ag.ch/ui/home/#!/cookiesAgreement'
  const url_notifications= '/local.kbint.spearhead-ag.ch/ui/home/#!/notifications'
  const url_uiToken = 'local.kbint.spearhead-ag.ch/ui/dynamic-form/?uiToken'
  const url_area_selection_control = '/local.kbint.spearhead-ag.ch/ui/dynamic-form-service/template/form/area-selection-control'
  const $requestTimeout = 6000
  const username = 'development-user'
  const password = 'devuser'
  const $equipment_2_loading_doors = true

  //<Name2>Ilyovski</Name2>


  const file1 = [
    ["WF0KXXTTRKMC81361", "VanMidPanel", "01.01.2020", "Ford Transit 06/2021"]
  ]
  file1.forEach($car => {
    it(`Execute TECH notifications with vin:${$car[0]}`, () =>{

      const $vin = $car[0]
      const intS7 = getRandomInt(1000000,9999999).toString()
      const claimNumber = `TestSasho-${intS7}`

      cy.visit(baseUrl_lp, {
        onBeforeLoad(win) {
          //cy.stub(win.navigator, 'cookieEnabled', false).as('cookieEnabled')
        },
      })
      cy.get('input#username').type(username)
      cy.get('input#password').type(password)
      cy.wait(1000)
      //cy.get('input[name="login"]').click()
      cy.get('form').submit()
      cy.wait(500)
      // cy.wait('@cookiesAgreement',{requestTimeout : $requestTimeout}).then(xhr => {
      //   expect(xhr.response.statusCode).to.equal(200)
      // })
      cy.url({ timeout: 3000 }).should('include', url_cookiesAgreement) // => true
      cy.get('button[type="button"][data-test="cookies-agreement-btn-agree"]').click()
      cy.url({ timeout: 3000 }).should('include', url_notifications) // => true
      cy.get('button[type="button"][data-test="notifications-btn-new-notification"]').click()
      cy.get('input#claimNumber').type(claimNumber)
      cy.get('input#repairLocationZipCode').type('10115') //Berlin
      cy.get('input#licensePlate').type('SOF 9999')
      cy.get('input#vin').type($vin)
      cy.get('input[data-test="new-dn-dialog-input-date-picker"]').type($car[2])
      cy.get('input#mileage').type('123456')
      //cy.selectDropDown('damageCause',2)
      cy.get(`select#damageCause`).select(1)
      cy.wait(2000)
      cy.get('button[type="submit"][data-test="new-dn-dialog-btn-create"]').click()

      cy.url({ timeout: 3000 }).should('include', url_uiToken) // => true
      cy.get('div.steps-container.vertical-icon-menu').find('span').contains('Area selection').click()
      cy.get('label').contains(' Van ').click()



      cy.get('sph-button-select-renderer').contains('Equipment slide door left').parent().find('label').contains(' Yes ').click()
      cy.get('sph-button-select-renderer').contains('Equipment slide door right').parent().find('label').contains(' Yes ').click()
      cy.get('sph-button-select-renderer').contains('Equipment 2 loading doors').parent().find('label').contains(' Yes ').click()


      cy.get('sph-clickable-svg').find('g#right-rearWindow').click()
      cy.get('sph-clickable-svg').find('g#right-rearWindow').should('not.be.disabled'); // Wait until g is enabled
      cy.get('sph-clickable-svg').find('g#right-rearWindow').click()

      cy.get('g#left-rearWindow').click()
      cy.get('g#left-rearWindow').should('not.be.disabled'); // Wait until g is enabled
      cy.get('g#left-rearWindow').click()

      cy.get('sph-clickable-svg').find('g#right-rearWindow').should('have.class', 'cursor-pointer').and('have.class', 'selected');
      cy.get('sph-clickable-svg').find('g#left-rearWindow').should('have.class', 'cursor-pointer').and('have.class', 'selected');

      cy.get('sph-button-select-renderer').contains('Underbody damaged').parent().find('label').contains(' Yes ').click()
      cy.get('sph-clickable-svg').find('g#underBody').should('have.class', 'cursor-pointer').and('have.class', 'selected');


      cy.get('sph-button-select-renderer').contains('Underbody damaged').parent().find('label').contains(' No ').click()
      cy.get('sph-button-select-renderer').contains('Equipment 2 loading doors').parent().find('label').contains(' No ').click()

      cy.get('g#rear-window').should('not.be.disabled'); // Wait until g is enabled
      cy.get('g#rear-window').click({force: true})
      //cy.get('g#rear-window').find('path#rear-window-overlay').click()
      cy.get('sph-clickable-svg').find('g#rear-window').should('have.class', 'cursor-pointer').and('have.class', 'selected');


      //cy.get('div.steps-container.vertical-icon-menu').find('span').contains('Schadenbeschreibung').click()
      //cy.get('div.steps-container.vertical-icon-menu').find('span').contains('Area selection').click()

      //cy.url({ timeout: 3000 }).should('include', url_uiToken) // => true
      //console.log(cy.url({ timeout: 3000 }))





    }) //it


  }) //forEach
})

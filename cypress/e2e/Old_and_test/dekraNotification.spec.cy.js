/// <reference types="cypress" />

describe('Start dekra damage notification', () =>{

  beforeEach('Login to the app', () =>{
    //cy.loginToHukStandalone()
    cy.intercept('GET', `/damage/notification/*`).as('getNotification')
    console.clear()
  })

  it('', () => {
    const $dev = '2';
    cy.visit(`https://dev0${$dev}.spearhead-ag.ch/ui/dekra/notifications#!/cookiesAgreement`)
    cy.get('[data-test="cookies-agreement-btn-agree"]').click()
    cy.wait(500)
    cy.get('[placeholder="Email"]').type('TestAutomationIndividual@soft2run.com')
    cy.get('[placeholder="Passwort"]').type('Test123!')
    cy.get('form').submit()
    cy.wait(500)


      // 1 get the row by text
      cy.get('tbody').contains('tr','33-33-614/475492-S').then(tableRow => {
        cy.wrap(tableRow).find('.btn-group.dropdown').click()

        // both worked
        //cy.get('[data-test="item-action-dropdown-item-open"]').filter(':visible').click()
        //cy.get('[data-test="item-action-dropdown-item-open"]:visible').click()

        const action = 1 // 1 - Öffnen, 2 - Zuweisen, 3- Löschen
        let actionText = ""
        if(action == 1){
          actionText = 'Öffnen'
        } else if(action == 2){
          actionText = 'Zuweisen'
        } else {
          actionText = 'Löschen'
        }

        cy.get('[data-test="item-action-dropdown-menu"]:visible')
        .find('li')
        .contains(actionText)
        .click()


        if(action == 1){
            cy.wait('@getNotification').then( xhr => {
            console.log(xhr)
            expect(xhr.response.statusCode).to.equal(200)
            console.log(xhr.response.body.id)
            console.log(xhr.response.body.body.vehicleIdentification.vin)
            console.log(xhr.response.body.body.vehicleIdentification.licensePlate)
          })
        }

      })
      cy.wait(1000)

      // this works
      //cy.get('[class="dropdown langs text-normal"][data-test="language-select-dropdown"]').click()
      //cy.get('[class="dropdown-menu with-arrow list-langs pull-right dropdown-menu-scaleIn"]').contains('English').click()
      cy.window().its('localStorage').then(localStorage => {
        console.log(localStorage)
        //window.localStorage.removeItem("ngStorage-theme");
        //window.localStorage.setItem("ngStorage-theme", "wgv");

      })



  })
})

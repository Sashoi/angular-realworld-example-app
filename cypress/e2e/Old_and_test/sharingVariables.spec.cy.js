/// <reference types="cypress" />

describe('sharing variables', () =>{

  beforeEach('Login to the app', () =>{
    console.clear()
  })
  it('Environment Variables get', function (){
    // Retrieve all the environment variables
    console.log(Cypress.env())

    // Retrieve a specific environment variable using its key
    console.log(Cypress.env('apiUrl'))
    console.log(Cypress.env('passwordHukS'))

    });


    it('Environment Variables set', function (){
      Cypress.env('passwordHukS','wwwwwwww');
      Cypress.env({
        host: 'http://server.dev.local',
        foo: 'foo',
      })
    });

    it('Environment Variables get again', function (){
      console.log(Cypress.env('passwordHukS'))
      console.log(Cypress.env())
    });

    it('set Variable by cy.task', function (){
      const href = 'www.google.com'
      console.log('set href:' + href)
      cy.task('setHref', href)
      cy.task('setQurl', 'www.dir.bg')
    })

    it('get Variable by cy.task', function (){
      let localHref
      cy.task('getHref').then((href) => {
        localHref = href
        console.log('get href:' + href)
        //cy.visit(href)
      })
      // not work
      console.log('get local href:' + localHref)
      cy.task('getQurl').then((qUrl) => {
        console.log('get qUrl:' + qUrl)
      })
    })

    // change environment variable for single test
    it.skip('test against Spanish content',{
        env: {language: 'es',
      },
    },
    () => {
      cy.visit(`https://www.google.com/${Cypress.env('language')}/`)
      cy.contains('Buscar con Google')
    })

    // Search object
    it('Search object as page-09', function (){
        cy.fixture('page-09').then( page09 => {
            console.log(page09)

            var output = {};
            for(var key in page09){
              if(key = 'imageAnalyticsConfigurationId'){
                output['imageAnalyticsConfigurationId'] = 'null';
              } else {
                output[key] = page09[key];
              }
            };
            console.log(output)
          }
        )
      }
    )
    // Print object
    it('Print object page-09', function (){
      const keyValuePairFuncs = (obj) => {
        if(!obj) return;  // Added a null check for  Uncaught TypeError: Cannot convert undefined or null to object
        for (const [key, val] of Object.entries(obj)) {
            console.log(`${key}: ${JSON.stringify(val)}`)
            if (typeof val === "object") {
                keyValuePairFuncs(val);   // recursively call the function
            }
        }
      }
      cy.fixture('page-09').then( page09 => {
        console.log('Print object page-09 elements')
        keyValuePairFuncs(page09.elements)
      })
      cy.fixture('page-09').then( page09 => {
        console.log('Print jSON page-09 elements')
        console.log(JSON.stringify(page09.elements))
      })
    })
    // Print object id
    it.only('Print object id page-09', function (){
      const keyValuePairFuncs = (obj) => {
        if(!obj) return;  // Added a null check for  Uncaught TypeError: Cannot convert undefined or null to object
        for (const [key, val] of Object.entries(obj)) {
          if (key == 'id'){
            console.log(`${key}: ${JSON.stringify(val)}`)
          }
          if (typeof val === "object") {
            keyValuePairFuncs(val);   // recursively call the function
          }
        }
      }
      cy.fixture('page-09').then( page09 => {
        console.log('Print object id page-09 elements')
        keyValuePairFuncs(page09.elements)
      })
    })
})

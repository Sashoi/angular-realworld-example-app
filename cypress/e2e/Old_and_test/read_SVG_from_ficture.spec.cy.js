

describe('Execute b2b/integration/toni-digital/hdiLiabilitySelfService', () =>{
  it('Read svg from fixture', () =>{
    cy.fixture('LCV-LeftDoor-NoTailgate.svg','ascii').then( svg => {
      console.log(svg.search('g id="windshield"1'))
    })
  })
})

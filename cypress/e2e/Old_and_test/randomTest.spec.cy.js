/// <reference types="cypress" />

describe('Random test', () =>{

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
  }

  it('test', () => {

    const int = getRandomInt(1000,9999)
    const intS = int.toString()
    console.log(intS)


  })
})

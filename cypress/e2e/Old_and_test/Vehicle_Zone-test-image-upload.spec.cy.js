/// <reference types="cypress" />

describe('Vehicle Zone test image upload', () =>{


  function uploadImages(fileToUpload,URL,auth){
    cy.fixture(fileToUpload,'base64')
          .then(image => {
            const blob = Cypress.Blob.base64StringToBlob(image,'image/jpeg');
            var formdata = new FormData();
            formdata.set("content", blob, fileToUpload);
            var requestOptions = {
              method: 'POST',
              url: `${URL}`,
              headers: {
                'Authorization' : auth
              },
              body: formdata,
              redirect: 'follow'
            };

            //works
            cy.request(requestOptions).then(
              (response) => {
                // response.body is automatically serialized into JSON
                expect(response.status).to.eq(200) // true
                console.log(response.body)
              })
          })
  }

  function saveQuestions(aBody,URL,auth){
    var requestOptions = {
      method: 'POST',
      url: `${URL}`,
      headers: {
        'Authorization' : auth
      },
      body: aBody
    }

    cy.request(requestOptions).then(
      (response) => {
        // response.body is automatically serialized into JSON
        expect(response.status).to.eq(200) // true
        console.log(response.body)
    })
  }

  it('verify use can log out successfully', () =>{
    const $dev = '2';
    const baseUrl_l = `https://dev0${$dev}.spearhead-ag.ch/`
    const baseUrl_lp = `https://dev0${$dev}.spearhead-ag.ch:443//`
    const userCredentials =  {
      "password": Cypress.env("passwordHukS"),
      "remoteUser": "",
      "sessionLanguage": "en",
      "userName": Cypress.env("usernameHukS")
    }

    cy.request('POST',`${baseUrl_l}member/authenticate`,userCredentials)
        .its('body').then(body => {
          const token = body.accessToken
          //cy.wrap(token).as('token')

          const authorization = `Bearer ${token}`;
          const fileToUpload = "registration-part-1.jpg"; //registration-part-1.jpg, airbag.jpg
          const questionnaireId2 = 'ASkxGowMMa24jVJCgY5xf';

          if (false){
            cy.fixture(fileToUpload,'base64')
            .then(image => {
              //console.log('image');
              //console.log(image);

              const blob = Cypress.Blob.base64StringToBlob(image,'image/jpeg');
              var formdata = new FormData();
              formdata.set("content", blob, fileToUpload);

              //console.log('formdata');
              //Array.from(formdata) // Same as above
              //console.log(...formdata) // shortest script solution
              //console.log([...formdata]) // Think 2D array makes it more readable
              //console.table([...formdata]) // could use console.table if you like that
              //console.log(Object.fromEntries(formdata)) // Works if all fields are uniq
              //console.table(Object.fromEntries(formdata)) // another representation in table form
              //new Response(formdata).text().then(console.log) // To see the entire raw body



              var requestOptions = {
                method: 'POST',
                url: `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-registration-part-1-photo-upload/index-1?locale=de`,
                headers: {
                  'Authorization' : authorization
                },
                body: formdata,
                redirect: 'follow'
              };

              //works
              cy.request(requestOptions).then(
                (response) => {
                  // response.body is automatically serialized into JSON
                  expect(response.status).to.eq(200) // true
                  console.log(response.body)
                })

              //works
              // fetch(`${baseUrl_lp}questionnaire/0xJgxGu7tGFQfqE0TWlFy/attachment/answer/vehicle-registration-part-1-photo-upload/index-1?locale=de`, requestOptions)
              // .then(response => response.text())
              // .then(result => console.log(result))
              // .catch(error => console.log('error', error));

            })  //then
          }

          const URL1 = `${baseUrl_lp}questionnaire/${questionnaireId2}/attachment/answer/vehicle-registration-part-1-photo-upload/index-1?locale=de`
          uploadImages('airbag.jpg',URL1,authorization)

          const b2bBody2 = {
            "answers": [
                {
                    "questionId": "vehicle-registration-part-1-photo-upload",
                    "answer": {
                        "value": {
                            "index-1": "vehicle-registration-part-1-photo-upload-index-1"
                        },
                        "fileUploaded": true
                    }
                }
            ]
          }

          if (false){
            var requestOptions2 = {
              method: 'POST',
              url: `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-06?locale=de`,
              headers: {
                'Authorization' : authorization
              },
              body: b2bBody2
            }

            cy.request(requestOptions2).then(
              (response) => {
                // response.body is automatically serialized into JSON
                expect(response.status).to.eq(200) // true
                console.log(response.body)
            })
          }

          const URL2 = `${baseUrl_lp}questionnaire/${questionnaireId2}/page/page-06?locale=de`

          saveQuestions(b2bBody2,URL2,authorization)
        })
      })
})

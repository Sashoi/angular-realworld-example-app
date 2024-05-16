
export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

export const makeid = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export const getPageTitle = (body) => {
  let title = body.pageTitle
  if ((title.length <= 2)){
    title = body.uiBlocks[0].label.content
    if ((title.length <= 2)){
      const elements = body.uiBlocks[0].elements
      if (elements.sections != null && elements.sections.length > 0){
        title = elements.sections[0].label.content
      } else {
        if (elements.rootQuestions != null && elements.rootQuestions.length > 0){
          title = elements.rootQuestions[0]
        }
      }
    }
  }
  return title
}

export const getQuestionnaireIdFromLinks = (nextUrl) => {
  //"https://dev02.spearhead-ag.ch:443/questionnaire/7uRjDM92M9eWEhZVkBrSr/page/page-01?navigateTo=next"
  const startStr = '/questionnaire/'
  const endStr = '/page/page'
  const pos = nextUrl.indexOf(startStr) + startStr.length;
  const questionnaireId =  nextUrl.substring(pos, nextUrl.indexOf(endStr, pos));
  // cy.then(function () {
  //   questionnaire.Id = questionnaireId
  // })
  console.log(`From @currentPage questionnaireId: ${questionnaireId}`)
  return questionnaireId
}

export const goingPage = { pageId: '', elements: []} 
export const questionnaire = { Id:'', authorization : '', bodyType: '', notificationId: ''}




import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import constants from './constants'
import _some from 'lodash/some'
import _every from 'lodash/every'

const specialButtons = {
  [constants.qIDFAIL]: true,
  [constants.qIDEXIT]: true,
  [constants.qMESSAGE]: true,
  [constants.qIDSUCCESS]: true,
  [constants.qIDASSEMBLESUCCESS]: true,
  [constants.qIDASSEMBLE]: true
}

export const FuturePages = DefineMap.extend('FuturePages', {
  // reference to a page from the current interview that you want to check for future pages
  interviewPage: {},

  // reference object of all of the current interview pages key'd by their names
  interviewPagesByName: {},

  get hasMultipleButtons () {
    const buttons = this.interviewPage.buttons
    return buttons && buttons.length > 1
  },

  get hasSpecialButton () {
    const buttons = this.interviewPage.buttons
    return _some(buttons, (button) => specialButtons[button.next] === true)
  },

  get hasNoNextPageTarget () {
    const buttons = this.interviewPage.buttons
    return _every(buttons, button => !button.next)
  },

  get hasRequiredField () {
    const fields = this.interviewPage.fields
    return _some(fields, (field) => field.required)
  },

  get hasPageLogic () {
    const page = this.interviewPage
    return (!!page.codeBefore || !!page.codeAfter)
  },

  get hasStopper () {
    return this.hasMultipleButtons ||
      this.hasSpecialButton ||
      this.hasNoNextPageTarget ||
      this.hasRequiredField ||
      this.hasPageLogic
  },

  get nextPageName () {
    const nextButton = (this.interviewPage.buttons || [])[0]
    return nextButton && nextButton.next
  },

  get nextInterviewPage () {
    const interviewPagesByName = this.interviewPagesByName
    return this.hasStopper ? undefined : interviewPagesByName[this.nextPageName]
  },

  get nextFuturePage () {
    const futureInterviewPage = this.nextInterviewPage
    const nfp = futureInterviewPage
      ? new FuturePages({
          interviewPage: futureInterviewPage,
          interviewPagesByName: this.interviewPagesByName
        })
      : undefined
    // if the next page has before logic, it must be excluded
    return nfp && !nfp.interviewPage.codeBefore ? nfp : undefined
  },

  get futureInterviewPages () {
    const futurePages = new DefineList()
    let nextFuturePage = this.nextFuturePage
    while (nextFuturePage) {
      futurePages.push(nextFuturePage)
      nextFuturePage = nextFuturePage.nextFuturePage
    }
    return futurePages
  }
})

export default FuturePages

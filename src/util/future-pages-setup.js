import constants from '../models/constants'
import _some from 'lodash/some'
import _every from 'lodash/every'

export function hasRequiredField (fields) {
  return _some(fields, (field) => field.required)
}

export function hasPageLogic (page) {
  return (!!page.codeBefore || !!page.codeAfter)
}

export function hasMultipleButtons (buttons) {
  return buttons && buttons.length > 1
}

export function hasSpecialButton (buttons) {
  return _some(buttons, (button) => {
    return button.next === constants.qIDFAIL ||
      button.next === constants.qIDEXIT ||
      button.next === constants.qIDSUCCESS ||
      button.next === constants.qIDASSEMBLESUCCESS ||
      button.next === constants.qIDASSEMBLE
  })
}

export function hasNoNextPageTarget (buttons) {
  return _every(buttons, button => !button.next)
}

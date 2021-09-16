import constants from '../models/constants'

export function isFieldRequired (fields) {
  let required = false
  fields.map(field => {
    if (field.required) {
      required = true
    }
  })
  return required
}

export function hasGoToLogic (page) {
  let containsGOTO = false
  if (page.codeBefore && page.codeAfter) {
    containsGOTO = true
  }
  return containsGOTO
}

export function isSpecialButton (button) {
  return button.next === constants.qIDFAIL ||
  button.next === constants.qIDEXIT ||
  button.next === constants.qIDSUCCESS ||
  button.next === constants.qIDASSEMBLESUCCESS ||
  button.next === constants.qIDASSEMBLE
}

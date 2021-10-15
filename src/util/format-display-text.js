import _truncate from 'lodash/truncate'
import cString from '@caliorg/a2jdeps/utils/string'

export default function formatDisplayText (pageData) {
  const repeatVarValue = pageData.repeatVarValue
  const stepQuestionText = `Step ${pageData.stepNumber} Q${pageData.questionNumber}: `
  let text = pageData.questionNumber ? (stepQuestionText + pageData.text) : pageData.text

  text = cString.stripHtml(text)

  // truncate text to avoid https://github.com/CCALI/CAJA/issues/685
  text = _truncate(text, { length: 50, separator: ' ' })
  text = typeof repeatVarValue === 'number' ? text + ' #' + repeatVarValue : text

  return text
}

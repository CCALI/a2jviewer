import _truncate from 'lodash/truncate'
import cString from '@caliorg/a2jdeps/utils/string'

export default function formatDisplayText (pageData) {
  const repeatVarValue = pageData.repeatVarValue
  const stepQuestionText = `Step ${pageData.stepNumber} Q${pageData.questionNumber}: `
  let text = pageData.questionNumber ? (stepQuestionText + pageData.text) : pageData.text

  text = cString.stripHtml(text)

  // truncate text to avoid https://github.com/CCALI/CAJA/issues/685
  const repeatVal = typeof repeatVarValue === 'number' ? '#' + repeatVarValue : ''
  const truncated = _truncate(text, { length: 50, separator: ' ' })
  const textRepeatTruncated = repeatVal ? _truncate(text, { length: 49 - repeatVal.length, separator: ' ' }) + ' ' + repeatVal : truncated

  return { text, repeatVal, truncated, textRepeatTruncated }
}

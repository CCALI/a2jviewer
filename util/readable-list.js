import _filter from 'lodash/filter'
import _isFunction from 'lodash/isFunction'

// 2014-09-03 Return comma separated, optional 'and' for array.
export default function readableList (list, lang) {
  const values = _isFunction(list.attr) ? list.attr() : list
  const repeatAnd = (lang && lang.RepeatAnd) ? lang.RepeatAnd : 'and'

  // Remove null or blanks.
  const nonEmptyValues = _filter(values, function (val) {
    return (val != null && val !== '')
  })

  if (!nonEmptyValues.length) {
    return ''
  }

  if (nonEmptyValues.length === 1) {
    return nonEmptyValues[0]
  } else {
    const lastValue = nonEmptyValues.pop()
    return `${nonEmptyValues.join(', ')} ${repeatAnd} ${lastValue}`
  }
}

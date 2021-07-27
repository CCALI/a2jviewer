import stache from 'can-stache'
import route from 'can-route'
import $ from 'jquery'
import _isFunction from 'lodash/isFunction'
import _truncate from 'lodash/truncate'
import normalizePath from '~/src/util/normalize-path'

export const normalizePathHelper = function (fileDataUrl, path) {
  path = _isFunction(path) ? path() : path
  fileDataUrl = _isFunction(fileDataUrl) ? fileDataUrl() : fileDataUrl

  return normalizePath(fileDataUrl, path)
}

export const insertExternalLinkIconHelper = function (html) {
  const hrefMatch = /(<a href="(?!POPUP:))(.*?)(?=<\/a)/gi
  const output = html && html.replace(hrefMatch, (match) => {
    return match + ` <span class="glyphicon-link-ext" aria-hidden="true"/>`
  })
  return output
}

export const keydownFireClickHandlerHelper = function (ev, clickHandler, params) {
  // activated by keyboard navigation, only allow Enter(13)/Space(32) to trigger
  if (ev && (ev.keyCode === 13 || ev.keyCode === 32)) {
    clickHandler(params)
  }
}

export const truncateTextHelper = function (text, maxChars, overflowText) {
  maxChars = maxChars || 50
  overflowText = overflowText || '...'

  let returnValue = _truncate(text, {
    length: maxChars,
    separator: ' ',
    omission: overflowText
  })
  return returnValue
}

stache.registerHelper('normalizePath', normalizePathHelper)

stache.registerHelper('insertExternalLinkIcon', insertExternalLinkIconHelper)

stache.registerHelper('keydownFireClickHandler', keydownFireClickHandlerHelper)

stache.registerHelper('truncateText', truncateTextHelper)

// override for setURL issue
route.bindings.hashchange.setURL = function (path) {
  window.location.hash = path.length ? '#!' + path : ''
  return path
}

// http://james.padolsey.com/javascript/regex-selector-for-jquery/
// Used for finding case-insensitive popup:// signatures
$.expr[':'].regex = function (elem, index, match) {
  let matchParams = match[3].split(',')
  let validLabels = /^(data|css):/
  let attr = {
    method: matchParams[0].match(validLabels) ? matchParams[0].split(':')[0] : 'attr',
    property: matchParams.shift().replace(validLabels, '')
  }
  let regexFlags = 'ig'
  let regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g, ''), regexFlags)

  return regex.test($(elem)[attr.method](attr.property))
}

import stache from 'can-stache'
import route from 'can-route'
import $ from 'jquery'
import _isFunction from 'lodash/isFunction'
import normalizePath from '~/src/util/normalize-path'
import _truncate from 'lodash/truncate'

export const normalizePathHelper = function (fileDataUrl, path) {
  path = _isFunction(path) ? path() : path
  fileDataUrl = _isFunction(fileDataUrl) ? fileDataUrl() : fileDataUrl

  return normalizePath(fileDataUrl, path)
}

export const insertExternalLinkIconHelper = function (html) {
  const hrefMatch = /<a href="http\b[^>]*>(.*?)(?=<)/gi
  const output = html && html.replace(hrefMatch, (match) => {
    return match + ` <span class="glyphicon-link-ext" aria-hidden="true"/>`
  })
  return output
}

export const keydownFireClickHandlerHelper = function (ev, clickHandler) {
  // activated by keyboard navigation, only allow Enter(13)/Space(32) to trigger
  if (ev && (ev.keyCode === 13 || ev.keyCode === 32)) {
    clickHandler()
  }
}

/**
   * @param {String} text that has to be truncated; required
   * @param {Number} maxChars optional
   * @param {String} overflowText optional
   *
   * final text will be truncated and displayed with ellipses at the end
   */

export const truncateTextHelper = function (text, maxChars, overflowText) {
  maxChars = maxChars || 50
  overflowText = overflowText || '...'

  return _truncate(text, {
    length: maxChars + overflowText.length,
    separator: ' ',
    omission: overflowText
  })
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

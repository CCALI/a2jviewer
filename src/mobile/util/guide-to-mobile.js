import _pick from 'lodash/pick'

// Convert guide into JSON for Mobile viewer

const buttonProperties = [
  'url', 'next', 'name', 'value',
  'repeatVar', 'repeatVarSet', 'label'
]

const fieldProperties = [
  'type', 'label', 'name', 'value', 'order', 'required',
  'min', 'max', 'maxChars', 'listSrc', 'listData', 'sample',
  'invalidPrompt', 'calculator'
]

const pageProperties = [
  'name', 'type', 'step', 'repeatVar', 'outerLoopVar', 'text', 'textCitation', 'textAudioURL',
  'learn', 'help', 'helpCitation', 'helpMediaLabel', 'helpAudioURL', 'helpReader', 'helpImageURL', 'helpAltText',
  'helpVideoURL', 'codeBefore', 'codeAfter', 'codeCitation', 'notes'
]

const guideProperties = [
  'authorId',
  'avatar',
  'avatarHairColor',
  'avatarSkinTone',
  'completionTime',
  'copyrights',
  'createdate',
  'credits',
  'description',
  'emailContact',
  'endImage',
  'exitPage',
  'firstPage',
  'guideGender',
  'jurisdiction',
  'language',
  'logoImage',
  'modifydate',
  'notes',
  'sendfeedback',
  'subjectarea',
  'title',
  'tool',
  'toolversion',
  'version',
  'viewer'
]

function parseButtons (pageButtons = []) {
  return pageButtons.map(function (button) {
    let result = _pick(button, buttonProperties)

    return result
  })
}

function parseFields (pageFields = []) {
  return pageFields.map(function (field) {
    let result = _pick(field, fieldProperties)

    // make sure `required` and `calculator` are boolean values
    result.required = Boolean(result.required)
    result.calculator = Boolean(result.calculator)

    return result
  })
}

function parseAuthors (guideAuthors = []) {
  return guideAuthors.map(function (author) {
    return {
      name: author.name,
      title: author.title,
      email: author.email,
      organization: author.organization
    }
  })
}

function parseSteps (guideSteps = []) {
  return guideSteps.map(function (step) {
    return {
      text: step.text,
      number: step.number
    }
  })
}

function parseVars (guideVars = {}) {
  let result = {}

  Object.keys(guideVars).forEach(function (key) {
    let variable = guideVars[key]

    // 2015-01-12 mobile needs variaable keys in lowercase
    let lowerCasedName = variable.name.toLowerCase()

    result[lowerCasedName] = {
      name: variable.name,
      type: variable.type,
      comment: variable.comment,
      repeating: (variable.repeating === true)
    }
  })

  return result
}

function parsePages (guidePages = {}) {
  let result = {}

  // 12/22/2014 Convert native TPage into Mobile JSON format.
  // Include only properties used by viewer, dropping internal pointers/cyclic references.
  Object.keys(guidePages).forEach(function (key) {
    let page = guidePages[key]
    let mobilePage = _pick(page, pageProperties)

    mobilePage.buttons = parseButtons(page.buttons)
    mobilePage.fields = parseFields(page.fields)

    result[page.name] = mobilePage
  })

  return result
}

// 12/22/2014 Convert internal Guide structure into Mobile JSON format.
// Drop internal references and cyclic pointers.
export default function parseGuide (guide) {
  var mobileGuide = _pick(guide, guideProperties)

  mobileGuide.authors = parseAuthors(guide.authors)
  mobileGuide.steps = parseSteps(guide.steps)
  mobileGuide.vars = parseVars(guide.vars)
  mobileGuide.pages = parsePages(guide.pages)

  return mobileGuide
}

import _truncate from 'lodash/truncate'

// Create and re-create options list to update based on changed user input
// but still preserve the state of the current myProgress options.
// Specifically this handles the challenge of mapping multi-value variables
// to their specific loop count/state.å
export function getSingleOptionText (visitedPage, logic) {
  const questionText = visitedPage.text
  let result

  const foundMacros = findMacros(questionText)
  if (foundMacros) {
    const sortedMacros = sortMacros(foundMacros)

    const resolvedMacros = resolveMacros(
      sortedMacros,
      logic,
      visitedPage.repeatVarValue
    )
    result = replaceMacros(resolvedMacros, questionText)
  }

  const resolvedText = result && result.resolvedText
  const varNames = result ? result.varNames : []

  const formatResult = formatDisplayText({
    name: visitedPage.name,
    text: resolvedText || questionText,
    repeatVarValue: visitedPage.repeatVarValue,
    stepNumber: visitedPage.step.number,
    questionNumber: visitedPage.questionNumber
  })

  return { displayText: formatResult, varNames }
}

export default function buildOptions (visitedPages, logic) {
  return visitedPages.map((visitedPage) => {
    return getSingleOptionText(visitedPage, logic)
  })
}

// Find A2J Macro Syntax %%someVar%%, %%[some Var]%%, %%ORDINAL(someVar)%%, %%ORDINAL([some var])%%
// first pass, detect enclosing %%...%% denoting a macro of any kind
function findMacros (questionText) {
  const macroRegEx = /%%(.*?)%%/g
  const foundMacros = questionText.match(macroRegEx)

  return foundMacros
}

// second pass, detect variable or function macro and sort into type objects
// param : array of foundMacros -> [ %%[some Var]%%, %%ORDINAL(someVar)%% ]
function sortMacros (foundMacros) {
  return foundMacros.map(macroText => {
    // remove %% bookends %%[some var]%% -> [some var]
    const resolveText = macroText.replace(/%%/g, '')
    const funcRegEx = /\w\((.*?)\)/g
    const isFunctionMacro = resolveText.match(funcRegEx)
    const type = isFunctionMacro ? 'function' : 'variable'
    return {
      type,
      resolveText,
      replaceText: macroText
    }
  })
}

// 3rd -> resolve sortedMacros, and return a tuple of a replacement target, and string resolved displayValue
// param: [{ type: 'variable', replaceText: '%%[some name TE]%%', resolveText: '[some name TE]' }]
// return: [{replaceText: '%%[some name TE]%%', displayValue: 'JessBob'}]
function resolveMacros (sortedMacros, logic, visitedPageRepeatVarValue) {
  const resolvedMacros = []

  sortedMacros.forEach(macro => {
    if (macro.type === 'function') {
      const { displayValue, varName } = getFunctionMacro(
        macro.resolveText,
        visitedPageRepeatVarValue,
        logic
      )

      resolvedMacros.push({
        replaceText: macro.replaceText,
        displayValue,
        varName
      })
    } else {
      const { displayValue, varName } = getVariableMacro(
        macro.resolveText,
        visitedPageRepeatVarValue,
        logic
      )

      resolvedMacros.push({
        replaceText: macro.replaceText,
        displayValue,
        varName
      })
    }
  })

  return resolvedMacros
}

// 4th and last step, actually replace the macro syntax text with the resolved displayValue
// Hello %%[First name TE]%%! -> Hello JessBob!
function replaceMacros (resolvedMacros, questionText) {
  let displayText = questionText
  const varNames = []

  if (resolvedMacros && resolvedMacros.length) {
    resolvedMacros.forEach(macro => {
      displayText = displayText.replace(macro.replaceText, macro.displayValue)
      varNames.push(macro.varName)
    })
  }

  return { displayText, varNames }
}

function formatDisplayText (pageData) {
  const repeatVarValue = pageData.repeatVarValue
  const stepQuestionText = `Step ${pageData.stepNumber} Q${pageData.questionNumber}: `
  let text = pageData.questionNumber ? (stepQuestionText + pageData.text) : pageData.text
  // strip html tags
  text = text.replace(/(<([^>]+)>)/gi, '').trim()

  // truncate text to avoid https://github.com/CCALI/CAJA/issues/685
  text = _truncate(text, { length: 50, separator: ' ' })
  text =
    typeof repeatVarValue === 'number' ? text + ' #' + repeatVarValue : text

  // return {name: pageData.name, text}
  return text
}

// call Macro Functions to resolve display values
function getFunctionMacro (resolveText, visitedPageRepeatVarValue, logic) {
  const userFunctions = logic._tLogic.userFunctions
  const { funcName, funcArgs } = parseFunctionMacro(resolveText)
  const func =
    funcName && userFunctions[funcName] && userFunctions[funcName].func
  const varName = funcArgs[0]
  const varValue = getVariableMacro(varName, visitedPageRepeatVarValue, logic)
  // edge case, CONTAINS macro is only one that takes second param
  const compareStringForContains = funcArgs[1]
  const displayValue = func(varValue, compareStringForContains)

  return { displayValue, varName }
}

function getVariableMacro (resolveText, visitedPageRepeatVarValue, logic) {
  resolveText = resolveText.replace(/\[|\]/g, '')
  resolveText = resolveText.replace(/\(|\)/g, '')
  const [varName, numberOrCountingVar] = resolveText.split('#')
  const displayValue = varGet(
    varName,
    numberOrCountingVar,
    visitedPageRepeatVarValue,
    logic
  )

  return { displayValue, varName }
}

// answerIndex uses explicit counting var (someVar#3), visitedPage.repeatVarValue,
// or null in that order - _tLogic._VG() knows how to resolve null based on var type
// options: [varName#3], [varName#someCountingVar], [varName]
function varGet (varName, numberOrCountingVar, repeatVarValue, logic) {
  let answerIndex = null
  if (numberOrCountingVar) {
    const numberIndex = +numberOrCountingVar
    const isCountingVar = isNaN(numberIndex)
    answerIndex = isCountingVar ? repeatVarValue : numberIndex
  } else if (repeatVarValue) {
    return repeatVarValue
  }

  // falsy values display nothing/empty string
  return logic._tLogic._VG(varName, answerIndex) || ''
}

// parse out function name and arguments from A2J Macros
// %%ORDINAL([someVar])%% -> { funcName: "ordinal", funcArgs: ["someVar"]}
function parseFunctionMacro (functionString) {
  // remove var brackets `[some Var#count]` -> `some Var#count`
  functionString = functionString.replace('[', '').replace(']', '')
  // remove leading spaces
  functionString = $.trim(functionString)

  const funcRegEx = /(.*?)\((.*)\)/
  const match = functionString.match(funcRegEx)
  const funcName = match[1].toLowerCase()
  const funcArgs = match[2].split(',').map(arg => {
    // remove leading whitespace and extra outer "" from args
    return $.trim(arg).replace(/^"|"$/gm, '')
  })

  return { funcName, funcArgs }
}

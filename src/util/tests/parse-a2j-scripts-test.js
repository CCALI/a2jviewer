/* eslint-disable */
// Disabled linting so tests can pass without worrying about this currently unused/unfinished file/idea

import { assert } from 'chai'
import { differenceInYears, parseISO } from 'date-fns'
import buildOptions from '../parse-a2j-scripts'

describe('<a2j-viewer-navigation>', function () {
  it('buildOptions', function () {
    const visitedPages = [
      { text: 'Welcome to the interview', step: { number: '0' }, questionNumber: 1, repeatVarValue: undefined },
      { text: 'Enter your info, as this is a very long question text', step: { number: '0' }, questionNumber: 2, repeatVarValue: 1 }
    ]
    const bopts = buildOptions(visitedPages)
    const expectedOptions = [
      'Step 0 Q1: Welcome to the interview',
      'Step 0 Q2: Enter your info, as this is a very... #1'
    ]

    assert.equal(bopts.length, 2, 'should build an option for each page in visitedPages')
    assert.deepEqual(bopts, expectedOptions, 'maps visitedPages info to the list of options')
  })

  it('parseFunctionMacro', () => {
    let functionString = 'ORDINAL([loopCount])'
    let functionMacros = vm.parseFunctionMacro(functionString)
    let expectedResults = { funcName: 'ordinal', funcArgs: ['loopCount'] }

    assert.deepEqual(functionMacros, expectedResults, 'should parse out function name and arguments')

    functionString = 'CONTAINS([some text TE], "some test string")'
    functionMacros = vm.parseFunctionMacro(functionString)
    expectedResults = { funcName: 'contains', funcArgs: ['some text TE', 'some test string'] }

    assert.deepEqual(functionMacros, expectedResults, 'should parse CONTAINS, the only macro function with 2 arguments, a variable and string')
  })

  it('findMacros', () => {
    const macroPatterns = [
      { questionText: 'No Space Var %%someVar%%', expectedFoundMacros: ['%%someVar%%'] },
      { questionText: 'Classic Var %%[First name TE]%%', expectedFoundMacros: ['%%[First name TE]%%'] },
      { questionText: 'Parens only %%(First name TE)%%', expectedFoundMacros: ['%%(First name TE)%%'] },
      { questionText: 'Parens&Brackets %%([First name TE])%%', expectedFoundMacros: ['%%([First name TE])%%'] },
      { questionText: 'Whitespace Pairs %% ( [ First name TE ])%%', expectedFoundMacros: ['%% ( [ First name TE ])%%'] },
      { questionText: 'Function %%DOLLAR([Salary NU])%%', expectedFoundMacros: ['%%DOLLAR([Salary NU])%%'] },
      { questionText: 'Edge Case %%CONTAINS([Message TE#loopCount], "string to test for match")%%', expectedFoundMacros: ['%%CONTAINS([Message TE#loopCount], "string to test for match")%%'] },
      { questionText: 'combo %%[First name TE]%% makes %%DOLLAR([Salary NU])%% per year', expectedFoundMacros: ['%%[First name TE]%%', '%%DOLLAR([Salary NU])%%'] },
      { questionText: 'contains edge case %%[First name TE]%% is found in %%CONTAINS([First name TE], "some string to test")%%', expectedFoundMacros: ['%%[First name TE]%%', '%%CONTAINS([First name TE], "some string to test")%%'] }
    ]
    macroPatterns.forEach(({ questionText, expectedFoundMacros }) => {
      const foundMacros = vm.findMacros(questionText)
      assert.deepEqual(foundMacros, expectedFoundMacros, 'should find A2J Macros in question text')
    })
  })

  it('sortMacros', () => {
    const questionText = 'Basic %%[first name TE]%%, Parens %%([first name TE])%%, Function %%DOLLAR(salary NU)%% Edge Case %%CONTAINS([message TE#loopCount], "hooray")%%'
    const foundMacros = vm.findMacros(questionText)
    const sortedMacros = vm.sortMacros(foundMacros)

    const expectedResults = [
      { type: 'variable', replaceText: '%%[first name TE]%%', resolveText: '[first name TE]' },
      { type: 'variable', replaceText: '%%([first name TE])%%', resolveText: '([first name TE])' },
      { type: 'function', replaceText: '%%DOLLAR(salary NU)%%', resolveText: 'DOLLAR(salary NU)' },
      { type: 'function', replaceText: '%%CONTAINS([message TE#loopCount], "hooray")%%', resolveText: 'CONTAINS([message TE#loopCount], "hooray")' }
    ]

    assert.deepEqual(sortedMacros, expectedResults, 'should find A2J Macros in question text')
  })

  it('varGet(varName, numberOrCountingVar, visitedPageRepeatVarValue)', function () {
    interview.answers.varCreate('name', 'Text', true) // varName, type, repeating
    interview.answers.varCreate('color', 'Text', false)
    interview.answers.varCreate('loopCount', 'Number', false)
    interview.answers.varSet('name', 'Fred', 1) // varName, value, index
    interview.answers.varSet('name', 'JessBob', 2)
    interview.answers.varSet('name', 'SpecialName', 3)
    interview.answers.varSet('color', 'red', 1)
    interview.answers.varSet('loopCount', 1, 1)

    const varValue = vm.varGet('color', undefined, null)
    assert.equal(varValue, 'red', 'should get current var value if no #countVar set or not in loop')

    const multiVarValue = vm.varGet('name', undefined, null)
    assert.equal(multiVarValue, 'Fred, JessBob and SpecialName', 'should get readable list if multi values but no #countVar set or not in loop')

    const explicitIndexValue = vm.varGet('name', 3, null)
    assert.equal(explicitIndexValue, 'SpecialName', 'should get explicitly indexed value, even if in loop')

    const varValueWithLoopVar = vm.varGet('name', 'loopCount', 2)
    assert.equal(varValueWithLoopVar, 'JessBob', 'visitedPageRepeatVarValue(2) should override loopCount indexing')

    const countingVarInRepeatLoop = vm.varGet('loopCount', undefined, 2)
    assert.equal(countingVarInRepeatLoop, 2, 'should return the visitedPageRepeatVarValue if no #countingVar, but has repeatVarValue')
  })

  it('resolveMacros - Variable lookup', () => {
    const sortedMacros = [
      { type: 'variable', replaceText: '%%[First name TE#3]%%', resolveText: '[First name TE#3]' },
      { type: 'variable', replaceText: '%%([First name TE#loopCount])%%', resolveText: '([First name TE#loopCount])' }
    ]

    interview.answers.varCreate('First name TE', 'Text', true)
    interview.answers.varCreate('loopCount', 'Number', false)
    interview.answers.varSet('First name TE', 'Fred', 1)
    interview.answers.varSet('First name TE', 'JessBob', 2)
    interview.answers.varSet('First name TE', 'Third', 3)
    interview.answers.varSet('loopCount', 1, 1)

    let visitedPageRepeatVarValue = null
    let resolvedMacros = vm.resolveMacros(sortedMacros, visitedPageRepeatVarValue)
    let expectedResults = [
      { replaceText: '%%[First name TE#3]%%', displayValue: 'Third' },
      { replaceText: '%%([First name TE#loopCount])%%', displayValue: 'Fred, JessBob and Third' }
    ]

    assert.deepEqual(resolvedMacros, expectedResults, 'without repeatVarValue, explicit #index honored, but single value or readable list returned')

    visitedPageRepeatVarValue = 2
    resolvedMacros = vm.resolveMacros(sortedMacros, visitedPageRepeatVarValue)
    expectedResults = [
      { replaceText: '%%[First name TE#3]%%', displayValue: 'Third' },
      { replaceText: '%%([First name TE#loopCount])%%', displayValue: 'JessBob' }
    ]

    assert.deepEqual(resolvedMacros, expectedResults, 'with repeatVarValue, explicit #index honored, otherwise value indexed by repeatVarValue is returned')
  })

  it('resolveMacros - Function lookup', () => {
    interview.answers.varCreate('First name TE', 'Text', true)
    interview.answers.varCreate('number NU', 'Number', true)
    interview.answers.varCreate('date DA', 'Date', true)
    interview.answers.varCreate('loopCount', 'Number', false)
    interview.answers.varSet('First name TE', 'Fred', 1)
    interview.answers.varSet('First name TE', 'Female', 2)
    interview.answers.varSet('Some number NU', 3, 1)
    interview.answers.varSet('Some number NU', 9.345, 2)
    interview.answers.varSet('date DA', '01/01/2000', 1)
    const expectedAgeResult = differenceInYears(Date.now(), parseISO('2000-01-01'))
    interview.answers.varSet('date DA', 1000, 2)
    interview.answers.varSet('loopCount', 1, 1)

    const sortedMacros = [
      { type: 'function', replaceText: '%%AGE([date DA#loopCount])%%', resolveText: 'AGE([date DA#loopCount])', expectedValue: expectedAgeResult, repeatVarValue: 1 },
      { type: 'function', replaceText: '%%DATE([date DA#2])%%', resolveText: 'DATE([date DA#2])', expectedValue: '09/27/1972' },
      { type: 'function', replaceText: '%%DOLLAR([Some number NU#1])%%', resolveText: 'DOLLAR([Some number NU#1])', expectedValue: '3.00' },
      { type: 'function', replaceText: '%%HASANSWERED([First name TE#1])%%', resolveText: 'HASANSWERED([First name TE#1])', expectedValue: true },
      { type: 'function', replaceText: '%%HISHER([First name TE#2])%%', resolveText: 'HISHER([First name TE#2])', expectedValue: 'her' },
      { type: 'function', replaceText: '%%HESHE([First name TE#2])%%', resolveText: 'HESHE([First name TE#2])', expectedValue: 'she' },
      { type: 'function', replaceText: '%%HIMHER([First name TE#2])%%', resolveText: 'HIMHER([First name TE#2])', expectedValue: 'her' },
      { type: 'function', replaceText: '%%ORDINAL([Some number NU#1])%%', resolveText: 'ORDINAL([Some number NU#1])', expectedValue: 'third' },
      { type: 'function', replaceText: '%%ROUND([Some number NU#2])%%', resolveText: 'ROUND([Some number NU#2])', expectedValue: 9 },
      { type: 'function', replaceText: '%%ROUND2([Some number NU#2])%%', resolveText: 'ROUND2([Some number NU#2])', expectedValue: 9.35 },
      { type: 'function', replaceText: '%%SUM([Some number NU])%%', resolveText: 'SUM([Some number NU])', expectedValue: 12.345 },
      { type: 'function', replaceText: '%%DATE(TODAY)%%', resolveText: 'DATE(TODAY)', expectedValue: () => { return vm.logic.eval('%%DATE(TODAY)%%') } },
      { type: 'function', replaceText: '%%TRUNC([Some number NU#2])%%', resolveText: 'TRUNC([Some number NU#2])', expectedValue: 9 },
      { type: 'function', replaceText: '%%TRUNC2([Some number NU#2])%%', resolveText: 'TRUNC2([Some number NU#2])', expectedValue: 9.34 },
      { type: 'function', replaceText: '%%CONTAINS([First name TE#1], "red")%%', resolveText: 'CONTAINS([First name TE#1], "red")', expectedValue: true }
    ]

    sortedMacros.forEach((data, index) => {
      const visitedPageRepeatVarValue = data.repeatVarValue || null
      const expectedResults = [
        {
          replaceText: data.replaceText,
          displayValue: (typeof data.expectedValue) === 'function' ? data.expectedValue() : data.expectedValue
        }
      ]

      const resolvedMacros = vm.resolveMacros([sortedMacros[index]], visitedPageRepeatVarValue)
      assert.deepEqual(resolvedMacros, expectedResults, `should resolve ${data.resolveText} to ${data.expectedValue}`)
    })
  })

  it('replaceMacros', () => {
    const questionText = 'Hello %%[First name TE#1]%%, you said your age was %%AGE([date DA#loopCount])%%. The word red is in your name: %%CONTAINS([First name TE#1], "red")%%!'
    const resolvedMacros = [
      { replaceText: '%%[First name TE#1]%%', displayValue: 'Fred' },
      { replaceText: '%%AGE([date DA#loopCount])%%', displayValue: 32 },
      { replaceText: '%%CONTAINS([First name TE#1], "red")%%', displayValue: true }
    ]

    const displayText = vm.replaceMacros(resolvedMacros, questionText)
    const expectedText = 'Hello Fred, you said your age was 32. The word red is in your name: true!'

    assert.equal(displayText, expectedText, 'should replace macro syntax in a string with displayValue text')
  })

  it('formatOptionData', function () {
    const option = {
      text: 'Hello Fred, you said your age was 32. The word red is in your name: true!',
      repeatVarValue: 2,
      stepNumber: '0',
      questionNumber: 3
    }
    const displayText = vm.formatOptionData(option)
    const expectedText = 'Step 0 Q3: Hello Fred, you said your age was... #2'

    assert.equal(displayText, expectedText, 'should prepend step & question number to page text and then truncate the result')
  })
})

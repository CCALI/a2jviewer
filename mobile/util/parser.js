import $ from 'jquery'
import _keys from 'lodash/keys'
import _find from 'lodash/find'
import _forEach from 'lodash/forEach'
import Answers from 'caja/viewer/models/answers'
import constants from 'caja/viewer/models/constants'
import cString from 'caja/viewer/mobile/util/string'
import cDate from 'caja/viewer/mobile/util/date'

const mapANX2Var = {
  unknown: constants.vtUnknown,
  textvalue: constants.vtText,
  tfvalue: constants.vtTF,
  mcvalue: constants.vtMC,
  numvalue: constants.vtNumber,
  datevalue: constants.vtDate,
  othervalue: constants.vtOther,
  rptvalue: constants.vtUnknown
}

let variableToField = function (varName, pages) {
  let field

  _forEach(_keys(pages), function (pageName) {
    let page = pages[pageName]

    field = _find(page.fields, function (field) {
      return field.name.toLowerCase() === varName.toLowerCase()
    })

    // early exit of the iteration if field found.
    if (field) return false
  })

  return field
}

let setVariable = function (variable, pages) {
  var varType
  var field = variableToField(variable.name, pages)

  if (variable && variable.type) {
    varType = variable.type
  } else if (field && field.type) {
    varType = cString.fieldTypeToVariableType(field.type)
  } else {
    varType = constants.vtText
  }

  var mapVar2ANX = {}

  mapVar2ANX[constants.vtUnknown] = 'Unknown'
  mapVar2ANX[constants.vtText] = 'TextValue'
  mapVar2ANX[constants.vtTF] = 'TFValue'
  mapVar2ANX[constants.vtMC] = 'MCValue'
  mapVar2ANX[constants.vtNumber] = 'NumValue'
  mapVar2ANX[constants.vtDate] = 'DateValue'
  mapVar2ANX[constants.vtOther] = 'OtherValue'

  var ansType = mapVar2ANX[varType]

  // Type unknown possible with a Looping variable like CHILD
  if (ansType === constants.vtUnknown || ansType == null) {
    ansType = [constants.vtText]
  }

  var getXMLValue = function (value) {
    if (varType === constants.vtDate) {
      // Ensure our m/d/y is converted to HotDocs d/m/y
      value = cDate.swapMonthAndDay(value)
    }

    var xmlV
    if (typeof value === 'undefined' || value === null || value === '') {
      // 2014-06-02 SJG Blank value for Repeating variables MUST be in answer file (acting as placeholders.)
      xmlV = '<' + ansType + ' UNANS="true">' + '</' + ansType + '>'
    } else {
      xmlV = cString.escapeHtml(value)

      if (varType === constants.vtMC) {
        xmlV = '<SelValue>' + xmlV + '</SelValue>'
      }

      xmlV = '<' + ansType + '>' + xmlV + '</' + ansType + '>'
    }

    return xmlV
  }

  var xml = ''
  if (variable.repeating) {
    // Repeating variables are nested in RptValue tag.
    for (var i = 1; i < variable.values.length; i += 1) {
      xml += getXMLValue(variable.values[i])
    }

    xml = '<RptValue>' + xml + '</RptValue>'
  } else {
    var value = variable.values[1]
    if (!(typeof value === 'undefined' || value === null || value === '')) {
      // 2014-06-02 SJG Blank value for non-repeating must NOT be in the answer file.
      xml = getXMLValue(value)
    }
  }

  if (xml !== '') {
    xml = '<Answer name="' + variable.name + '">' + xml + '</Answer>'
  }

  return xml
}

export default {
  parseANX (answers, pages) {
    var xml = constants.HotDocsANXHeader_UTF8_str // jshint ignore:line

    xml += '<AnswerSet title="">'

    Object.keys(answers).forEach(function (varName) {
      xml += setVariable(answers[varName], pages)
    })

    xml += '</AnswerSet>'

    return xml
  },

  // 11/13 Parse HotDocs answer file XML string into guide's variables.
  // Add to existing variables. Do NOT override variable types.

  // FIX: answersXML needs to be the XML string and not the parsed XML
  // (eg. $.parseXML(xmlstring)), jquery parses strings as HTML DOM Nodes which
  // are case-insensitive and normalized to lowercase. This function depends on
  // the tags to be lowercase.
  parseJSON (answersXML, vars) {
    var guide = new Answers(vars)

    $(answersXML).find('answer').each(function () {
      var varName = cString.makestr($(this).attr('name'))

      // 12/03/2013 Do not allow # in variable names.
      if (varName.indexOf('#') !== -1) return

      var v = guide.varExists(varName)
      var varANXType = $(this).children().get(0).tagName.toLowerCase()
      var varType = mapANX2Var[varANXType]

      // Variables not defined in the interview should be added in case
      // we're passing variables between interviews.
      if (v == null) {
        v = guide.varCreate(varName, varType, false, '')
      }

      switch (varANXType) {
        case 'textvalue':
          guide.varSet(varName, $(this).find('TextValue').html())
          break

        case 'numvalue':
          guide.varSet(varName, +$(this).find('NumValue').html())
          break

        case 'tfvalue':
        // Needs to be true boolean for 2 way binding in checkbox.stache view
          var bool = $(this).find('TFValue').html()
          if (bool.toLowerCase() === 'true') {
            bool = true
          } else {
            bool = false
          }
          guide.varSet(varName, bool)
          break

        case 'datevalue':
        // HotDocs dates in british format while A2J expects US format
          let britDate = $(this).find('DateValue').html()
          let usDate = cDate.swapMonthAndDay(britDate)
          guide.varSet(varName, usDate)
          break

        case 'mcvalue':
          guide.varSet(varName, $(this).find('MCValue > SelValue').html())
          break

        case 'rptvalue':
          v.attr('repeating', true)

          $('rptvalue', this).children().each(function (i) {
            varANXType = $(this).get(0).tagName.toLowerCase()
            varType = mapANX2Var[varANXType]
            // Only set answers with values to keep Author Var list in Debug Panel clean
            if ($(this).html() !== '') {
              switch (varANXType) {
                case 'textvalue':
                  guide.varSet(varName, $(this).html(), i + 1)
                  break

                case 'numvalue':
                  guide.varSet(varName, +$(this).html(), i + 1)
                  break

                case 'tfvalue':
                  // Needs to be true boolean for 2 way binding in checkbox.stache view
                  var bool = $(this).html()
                  if (bool.toLowerCase() === 'true') {
                    bool = true
                  } else {
                    bool = false
                  }
                  guide.varSet(varName, bool, i + 1)
                  break

                case 'datevalue':
                  let britDate = $(this).html()
                  let usDate = cDate.swapMonthAndDay(britDate)
                  guide.varSet(varName, usDate, i + 1)
                  break

                case 'mcvalue':
                  guide.varSet(varName, $(this).find('SelValue').html(), i + 1)
                  break
              }
            }
          })

          break
      }

      if (v.attr('type') === constants.vtUnknown) {
        v.attr('type', varType)

        if (v.attr('type') === constants.vtUnknown) {
          varName = varName.split(' ')
          varName = varName[varName.length - 1]

          if (varName === 'MC') {
            v.attr('type', constants.vtMC)
          } else if (varName === 'TF') {
            v.attr('type', constants.vtTF)
          } else if (varName === 'NU') {
            v.attr('type', constants.vtNumber)
          } else {
            v.attr('type', constants.vtText)
          }
        }
      }
    })

    return guide.serialize()
  },

  // Traverses XML of uploaded HotDocs cmp file to find variables to import
  // returns list of tuples - [ {name: name, type: constants.vtText } ]
  parseHotDocsXML (cmp) {
    const $cmpXML = $($.parseXML(cmp))

    return new Promise((resolve) => {
      // TODO: catch errors with 'reject'
      const newVarList = []

      // parse a cmp xml file and return a list of variables to be added to guide var list
      $cmpXML.find('*').each(function () {
        const name = cString.makestr($(this).attr('name'))

        switch (this.nodeName) {
          case 'hd:text':
            // hd:text name="AGR Petitioner Mother-Father-TE" askAutomatically="false" saveAnswer="false" warnIfUnanswered="false"/>
            newVarList.push({ name: name, type: constants.vtText })
            break

          case 'hd:trueFalse':
            // <hd:trueFalse name="Petitioner unemployment TF">
            newVarList.push({ name: name, type: constants.vtTF })
            break

          case 'hd:date':
            // <hd:date name="Date child came into petitioner care DA">
            // <hd:defFormat>June 3, 1990</hd:defFormat>
            // <hd:prompt>Date on which child came into care of petitioner(s)</hd:prompt>
            // <hd:fieldWidth widthType="calculated"/>
            // </hd:date>
            newVarList.push({ name: name, type: constants.vtDate })
            break

          case 'hd:number':
            // <hd:number name="Putative children counter" askAutomatically="false" saveAnswer="false" warnIfUnanswered="false"/>
            newVarList.push({ name: name, type: constants.vtNumber })
            break

          case 'hd:multipleChoice':
            // <hd:multipleChoice name="Child gender MC" askAutomatically="false">
            newVarList.push({ name: name, type: constants.vtMC })
            break

          case 'hd:computation':
            // <hd:computation name="Any parent address not known CO" resultType="trueFalse">
            // <hd:computation name="A minor/minors aff of due dliligence CO" resultType="text">
            var resultType = $(this).attr('resultType')
            if (resultType === 'text') {
              newVarList.push({ name: name, type: constants.vtText })
            }

            if (resultType === 'trueFalse') {
              newVarList.push({ name: name, type: constants.vtTF })
            }
            break
        }
      })

      resolve(newVarList)
    })
  }
}

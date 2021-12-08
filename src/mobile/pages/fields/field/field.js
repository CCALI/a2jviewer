import $ from 'jquery'
import DefineMap from 'can-define/map/map'
import DefineList from 'can-define/list/list'
import FieldModel from '~/src/models/field'
import moment from 'moment'
import views from './views/'
import _range from 'lodash/range'
import _isNaN from 'lodash/isNaN'
import Component from 'can-component'
import template from './field.stache'
import invalidPromptTpl from './views/invalid-prompt.stache'
import exceededMaxcharsTpl from './views/exceeded-maxchars.stache'
import constants from '~/src/models/constants'
import stache from 'can-stache'
import domData from 'can-dom-data'
import isMobile from '~/src/util/is-mobile'
import joinURIs from 'can-util/js/join-uris/join-uris'

import 'jquery-ui/ui/widgets/datepicker'
import '~/src/calculator/jquery.plugin'
import '~/src/calculator/jquery.calculator'
import '~/src/calculator/jquery.calculator.css'

function getBaseUrl () {
  return window.System.baseURL
}

function joinBaseUrl (path) {
  return joinURIs(getBaseUrl(), path)
}

stache.registerPartial('invalid-prompt-tpl', invalidPromptTpl)
stache.registerPartial('exceeded-maxchars-tpl', exceededMaxcharsTpl)

/**
 * @property {can.Map} field.ViewModel
 * @parent <a2j-field>
 *
 * `<a2j-field>`'s viewModel.
 */
export const FieldVM = DefineMap.extend('FieldVM', {
  // passed in via fields.stache binding
  lang: {},
  field: {
    Type: FieldModel
  },
  fieldIndex: {},
  groupValidationMap: {},
  lastIndexMap: {},
  appState: {},
  modalContent: {
    get () {
      return this.appState.modalContent
    }
  },

  // used in field views/*
  repeatVarValue: {
    get () {
      return this.appState.repeatVarValue
    }
  },

  /**
   * @property {can.compute} field.ViewModel.prototype.isMobile isMobile
   *
   * used to detect mobile viewer loaded
   *
   * */
  isMobile: {
    get () {
      return isMobile()
    }
  },

  /**
   * @property {DefineMap} field.ViewModel.prototype.userAvatar userAvatar
   * @parent field.ViewModel
   *
   *  current userAvatar
   */
  userAvatar: {
    get () {
      return this.appState.userAvatar
    }
  },

  /**
   * @property {Boolean} field.ViewModel.prototype.hasError hasError
   * @parent field.ViewModel
   *
   * Tracks if field has invalid answer based on constraints ie: min, max, required, etc
   */
  hasError: {},

  /**
   * @property {List} field.ViewModel.prototype.numberPickOptions numberPickOptions
   * @parent field.ViewModel
   *
   * List of integers used to render the `select` tag options when the field
   * type is 'numberpick'. e.g, if `field.min` is `1` and and `field.max` is
   * `5`, this property would return `[1, 2, 3, 4, 5]`.
   */
  numberPickOptions: {
    get () {
      const min = parseInt(this.field.min, 10)
      const max = parseInt(this.field.max, 10)
      const options = (_isNaN(min) || _isNaN(max)) ? [] : _range(min, max + 1)

      return new DefineList(options)
    }
  },

  /**
   * @property {Boolean} field.ViewModel.prototype.showInvalidPrompt showInvalidPrompt
   * @parent field.ViewModel
   *
   * Whether a prompt should be shown to indicate the field's answer is invalid
   *
   */
  showInvalidPrompt: {
    get () {
      const varName = this.field.name
      const lastIndex = this.lastIndexMap && this.lastIndexMap[varName]
      const isLastIndex = this.fieldIndex === lastIndex
      const hasGroupError = this.groupValidationMap && this.groupValidationMap[varName]

      return hasGroupError && isLastIndex && this.invalidPrompt
    }
  },

  /**
   * @property {String} field.ViewModel.prototype.invalidPrompt invalidPrompt
   * @parent field.ViewModel
   *
   * The prompt that should be shown when a field's answer is invalid
   *
   */
  invalidPrompt: {
    get () {
      let field = this.field
      let defaultInvalidPrompt = this.lang['FieldPrompts_' + field.type]
      return field.invalidPrompt || defaultInvalidPrompt
    }
  },

  /**
   * @property {Boolean} field.ViewModel.prototype.showMinMaxPrompt showMinMaxPrompt
   * @parent field.ViewModel
   *
   * Whether a prompt should be shown to indicate the field's min and max values
   *
   */
  showMinMaxPrompt: {
    get () {
      const min = this.field.min
      const max = this.field.max
      return !!(min || max)
    }
  },

  /**
   * @property {String} field.ViewModel.prototype.minMaxPrompt minMaxPrompt
   * @parent field.ViewModel
   *
   * The prompt that should be shown when a field's answer is out of min/max range
   *
   */
  minMaxPrompt: {
    get () {
      const min = this.field.min || 'any'
      const max = this.field.max || 'any'
      return `(${min} ~~~ ${max})`
    }
  },

  /**
   * @property {String} field.ViewModel.prototype.savedGenderValue savedGenderValue
   * @parent field.ViewModel
   *
   * Used to determine if gender radio button should be checked based on saved answer
   *
   */
  savedGenderValue: {
    get: function () {
      let name = this.field.name.toLowerCase()
      let answerIndex = this.appState.answerIndex
      let answers = this.logic.interview.answers
      if (name && answers) {
        return answers.varGet(name, answerIndex)
      }
    }
  },

  /**
   * @property {String} field.ViewModel.prototype.suggestionText suggestionText
   * @parent field.ViewModel
   *
   * Used to suggest input format for text strings
   *
   */

  suggestionText: {
    get: function () {
      let fieldType = this.field.type
      if (fieldType === 'numberssn') {
        return '999-99-9999'
      } else if (fieldType === 'numberphone') {
        return '(555) 555-5555'
      } else {
        return ''
      }
    }
  },

  /**
   * @property {Number} field.ViewModel.prototype.availableLength availableLength
   * @parent field.ViewModel
   *
   * remaining allowed characters before maxChar limit is reached
   *
   */
  availableLength: {},

  /**
   * @property {Boolean} field.ViewModel.prototype.overCharacterLimit overCharacterLimit
   * @parent field.ViewModel
   *
   * used to trigger messages when over the maxChars value
   *
   */
  overCharacterLimit: {
    get () {
      return this.availableLength < 0
    }
  },

  onUserAvatarChange (selectedAvatar) {
    const userAvatar = this.userAvatar

    userAvatar.gender = selectedAvatar.gender
    userAvatar.isOld = selectedAvatar.isOld
    userAvatar.hasWheelchair = selectedAvatar.hasWheelchair

    this.validateField()
  },

  onUserAvatarSkinToneChange (skinTone) {
    const userAvatar = this.userAvatar
    userAvatar.skinTone = skinTone

    this.validateField()
  },

  onUserAvatarHairColorChange (hairColor) {
    const userAvatar = this.userAvatar
    userAvatar.hairColor = hairColor

    this.validateField()
  },

  /**
     * @property {Number} field.ViewModel.prototype.calcAvailableLength suggestionText
     * @parent field.ViewModel
     *
     * Remaining character count
     *
     */

  calcAvailableLength (ev) {
    let maxChars = this.field.maxChars
    let availableLengthValue
    if (maxChars) {
      availableLengthValue = (maxChars - ev.target.value.length)
      this.availableLength = availableLengthValue
    }
    return availableLengthValue
  },

  /**
   * @property {Function} field.ViewModel.prototype.validateField validateField
   * @parent field.ViewModel
   *
   * validates a field for errors
   *
   */
  validateField (ctx, el) {
    const $el = $(el)
    let field = this.field
    let _answerVm = field._answerVm
    let value

    // textpick binding fired onChange even on first load
    // this skips the first pass: https://github.com/CCALI/CAJA/issues/2432
    let initialized = domData.get(el, 'initialized')
    if (!initialized && field.type === 'textpick') {
      domData.set(el, 'initialized', true)
      return
    }

    if (field.type === 'checkbox' || field.type === 'checkboxNOTA') {
      value = $el[0].checked
      this.notaCheckboxHandler(field, value)
    } else if (field.type === 'useravatar') { // TODO: validate the JSON string here?
      value = JSON.stringify(this.userAvatar.serialize())
    } else if (field.type === 'datemdy') {
      // format date to (mm/dd/yyyy) from acceptable inputs
      value = this.normalizeDateInput($el.val())
      // render formatted date for end user
      $el.val(value)
    } else {
      value = $el.val()
    }

    _answerVm.values = value

    let errors = _answerVm.errors
    field.hasError = errors
    // update group validation for radio buttons
    const varName = field.name
    this.groupValidationMap[varName] = !!errors

    if (!errors) {
      this.debugPanelMessage(field, value)
    }

    return errors
  },

  debugPanelMessage (field, value) {
    const answerName = field.name
    const answerIndex = field._answerVm.answerIndex
    const isRepeating = field._answerVm.answer.repeating
    // if repeating true, show var#count in debug-panel
    const displayAnswerIndex = isRepeating ? `#${answerIndex}` : ''

    const message = {
      key: answerName,
      fragments: [
        { format: 'var', msg: answerName + displayAnswerIndex },
        { format: '', msg: ' = ' },
        { format: 'val', msg: value }
      ]
    }
    this.appState.traceMessage.addMessage(message)
  },

  /**
   * @property {Function} field.ViewModel.prototype.preValidateNumber preValidateNumber
   * @parent field.ViewModel
   *
   * number inputs use a normal text input and need to be pre-validated as text is entered
   *
   */
  preValidateNumber (ctx, el) {
    const $el = $(el)
    const field = this.field
    const varName = field.name
    // accept only numbers, commas, periods, and negative sign
    const currentValue = $el.val()
    const scrubbedValue = currentValue.replace(/[^\d.,-]/g, '')
    if (currentValue !== scrubbedValue) {
      field.hasError = true
      this.groupValidationMap[varName] = true
    } else {
      field.hasError = false
      this.groupValidationMap[varName] = false
    }
  },

  /**
   * @property {Function} field.ViewModel.prototype.showCalculator showCalculator
   * @parent field.ViewModel
   *
   * shows input calculator
   *
   */
  showCalculator (field) {
    if (field && field.calculator === true) {
      const vm = this
      const inputId = field.label
      const $inputEl = $("[id='" + inputId + "']")
      $inputEl.calculator({
        showOn: 'operator',
        eraseText: 'Clear',
        onClose: function (calcValue, instance) {
          const $el = instance.elem
          const vm = $el.prop('vm')
          const field = vm.field

          // set answer and validate
          field._answerVm.values = calcValue
          vm.validateField(null, $el)
        },
        useText: 'Enter',
        useStatus: 'Execute any pending operation and then use the resulting value'
      })
      $inputEl.prop('vm', vm)
      $inputEl.calculator('show')
    }
  },

  /**
   * @property {Function} field.ViewModel.prototype.convertDate convertDate
   * @parent field.ViewModel
   *
   * convert a Date using moment with options input and output formats
   *
   * ## use
   * @codestart
   * vm.convertDate('2015-12-01'); // "12/01/2015"
   * vm.convertDate('2015-12-01', 'YYYY-MM-DD'); // "2015-12-01"
   * vm.convertDate('2015/12/01', 'YYYY-MM-DD', 'YYYY/MM/DD'); // "2015-12-01"
   * @codeend
   */
  convertDate (date, outputFormat, inputFormat) {
    inputFormat = inputFormat || ''
    outputFormat = outputFormat || 'MM/DD/YYYY'

    return (date && date.toUpperCase() !== 'TODAY') ? moment(date, inputFormat).format(outputFormat) : date
  },

  /*
   * @property {Function} field.ViewModel.prototype.expandTextlong expandTextlong
   * @parent field.ViewModel
   *
   * expands textlong field types into larger modal for easier editing
   *
   */
  expandTextlong (field) {
    const answerName = field.name
    const previewActive = this.appState.previewActive
    // warning modal only in Author for missing variable assignment
    if (!answerName && previewActive) {
      this.assign('modalContent', { title: 'Author Warning', text: 'Text(long) fields require an assigned variable to expand' })
    }
    if (answerName) {
      const title = field.label
      const textlongFieldVM = this
      this.appState.modalContent = {
        title,
        field,
        textlongFieldVM
      }
    }
  },

  fireModalClose (field, newValue, textlongFieldVM, availableLength) {
    field._answerVm.values = newValue
    const selector = "[name='" + field.name + "']"
    const longtextEl = $(selector)[0]
    textlongFieldVM.validateField(textlongFieldVM, longtextEl)
    this.availableLength = availableLength
  },

  /**
   * @property {Function} field.ViewModel.prototype.normalizeDateInput normalizeDateInput
   * @parent field.ViewModel
   *
   * allows date inputs like '010203', '01/02/03', '01022003', '01-02-03'
   * and reformats them to standard mm/dd/yyyy format
   * now checks for standard date separators to allow single digit dates, '4/2/19', '4-2-19'
   */
  normalizeDateInput (dateVal) {
    // preserve special value of 'TODAY'
    if (dateVal.toUpperCase() === 'TODAY') { return dateVal }

    // check for separators
    const hasSeparator = dateVal.match(/\/|-/g)
    let normalizedDate
    if (hasSeparator && hasSeparator.length === 2) {
      const separator = hasSeparator[0]
      const mdyArray = dateVal.split(separator)
      mdyArray.forEach((part, index) => {
        // don't correct single digit years
        if (part.length === 1 && index < 2) {
          mdyArray[index] = '0' + part
        }
      })
      // rebuild string date with leading zeros
      normalizedDate = mdyArray[0] + mdyArray[1] + mdyArray[2]
    } else {
      normalizedDate = dateVal.replace(/\/|-/g, '')
    }
    // legal dates will be 6 or 8 digits sans separators at this point, 010203 or 01022003
    if (normalizedDate.length === 8 || normalizedDate.length === 6) {
      const inputFormat = normalizedDate.length === 8 ? 'MMDDYYYY' : 'MMDDYY'
      normalizedDate = this.convertDate(normalizedDate, 'MM/DD/YYYY', inputFormat)
    }

    return normalizedDate
  },

  restoreUserAvatar (userAvatarJSON) {
    const restoredUserAvatar = JSON.parse(userAvatarJSON)
    this.onUserAvatarChange(restoredUserAvatar)
    this.onUserAvatarSkinToneChange(restoredUserAvatar.skinTone)
    this.onUserAvatarHairColorChange(restoredUserAvatar.hairColor)
  },

  // checkbox groups that include None of the Above(nota) need to uncheck any
  // other checkbox selections when nota is checked, and vice-versa
  notaCheckboxHandler (field, isChecked) {
    if (isChecked) {
      const fields = field._answerVm.fields
      if (fields) {
        const toStayChecked = field.type
        fields.forEach(function (field) {
          if (field.type !== toStayChecked && (field.type === 'checkbox' || field.type === 'checkboxNOTA')) {
            field._answerVm.values = false
          }
        })
      }
    }
  },

  trimFieldLabel (html) {
    // this fixes first preview edge case of datemdy.stache fields
    //  https://github.com/CCALI/CAJA/issues/2722
    return html.trim()
  },

  connectedCallback (el) {
    const vm = this
    // default availableLength
    vm.availableLength = vm.field.maxChars

    // userAvatar stored as json string and needs manual restore aka not bound in stache
    if (vm.field.type === 'useravatar') {
      const userAvatarJSON = vm.logic.varGet('user avatar')
      if (userAvatarJSON) {
        vm.restoreUserAvatar(userAvatarJSON)
      }
    }

    // setup datepicker widget
    // TODO: src url assumes a2jviewer app is sibling of a2jauthor app for preview
    const datepickerButtonSvg = joinBaseUrl('images/datepicker-button.svg')

    if (vm.field.type === 'datemdy') {
      const defaultDate = vm.field._answerVm.values
        ? vm.normalizeDateInput(vm.field._answerVm.values) : null
      // TODO: these dates need to be internationalized for output/input format
      // min/max values currently only come in as mm/dd/yyyy, or special value, TODAY, which is handled in convertDate above
      const minDate = vm.convertDate(vm.field.min, null, 'MM/DD/YYYY') || null
      const maxDate = vm.convertDate(vm.field.max, null, 'MM/DD/YYYY') || null
      const lang = vm.lang

      $('input.datepicker-input', $(el)).datepicker({
        showOn: 'button',
        buttonImage: datepickerButtonSvg,
        buttonImageOnly: false,
        buttonText: 'Open Calendar Widget',
        defaultDate,
        minDate,
        maxDate,
        changeMonth: true,
        changeYear: true,
        yearRange: constants.kMinYear + ':' + constants.kMaxYear,
        monthNames: lang.MonthNamesLong.split(','),
        monthNamesShort: lang.MonthNamesShort.split(','),
        appendText: '(mm/dd/yyyy)',
        dateFormat: 'mm/dd/yy',
        onClose (val, datepickerInstance) {
          const $el = $(this)
          vm.validateField(null, $el)
        }
      }).val(defaultDate)

      // add wcag aui-action="open" to date-picker button
      // and bootstrap standard button classes
      $('.ui-datepicker-trigger').attr('aui-action', 'open').addClass('btn btn-default')
    }
  }
})

/**
 * @module {Module} viewer/mobile/pages/fields/field/ <a2j-field>
 * @parent viewer/mobile/pages/fields/
 *
 * This component allows you to display a form field of a specific type
 *
 * ## use
 * @codestart
  <a2j-field
    field:from="field"
    fieldIndex:from="scope.index"
    lastIndexMap:from="lastIndexMap"
    groupValidationMap:from="groupValidationMap"
    lang:from="lang"
    logic:from="logic"
    appState:from="appState"/>
 * @codeend
 */
export default Component.extend('FieldComponent', {
  view: template,
  tag: 'a2j-field',
  ViewModel: FieldVM,
  leakScope: true,

  helpers: {
    selector (type, options) {
      type = typeof type === 'function' ? type() : type

      let self = this

      // TODO: CanJS should allow for passing helpers as well as scope.
      // This below is a copy of screenManager's eval helper.
      return views[type](options.scope, {
        eval (str) {
          // TODO: should this always have a value, even empty string?
          if (!str) { return }
          str = typeof str === 'function' ? str() : str
          // re-eval if answer values have updated via beforeCode
          const interview = self.logic.interview
          const answersChanged = interview && interview.answers.serialize() // eslint-disable-line

          return self.logic.eval(str)
        },

        dateformat (val, format) {
          return self.convertDate(val, format)
        },

        i18n (key) {
          key = typeof key === 'function' ? key() : key
          return self.lang[key] || key
        }
      })
    }
  }
})

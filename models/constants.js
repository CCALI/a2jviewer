export default {
  devShowTesting: false,
  showXML: 0,
  uploadURL: '',
  uploadGuideURL: '',
  // Spinnner for loading wait
  AJAXLoader: '<span class="loader">&nbsp;</span>',

  A2JVersionNum: '6.0', // VersionInfo.verNum
  A2JVersionDate: '2020-04-28',

  // CAVersionNum:'5.0.0',
  // CAVersionDate:'2013-04-15',

  vnNavigationTF: 'A2J Navigation TF', // 11/24/08 2.6 Navigation button toggler.
  // if FALSE, navigation next/back/my progress are turned off.
  vnInterviewIncompleteTF: 'A2J Interview Incomplete TF', // 08/17/09 3.0.1 Is interview complete?
  // If defined to TRUE, user hit Exit before completion of variables.
  vnBookmark: 'A2J Bookmark',
  vnHistory: 'A2J History',
  vnInterviewID: 'A2J Interview ID',
  vnStepPrefix: 'A2J Step ', // Step sign replacements (A2J Step 0 through MAXSTEPS )
  vnVersion: 'A2J Version',

  // Page Types
  ptPopup: 'Popup',

  // Field Types
  ftButton: 'button',
  ftText: 'text',
  ftTextLong: 'textlong',
  ftTextPick: 'textpick',
  ftNumber: 'number',
  ftNumberDollar: 'numberdollar',
  ftNumberSSN: 'numberssn',
  ftNumberPhone: 'numberphone',
  ftNumberZIP: 'numberzip',
  ftNumberPick: 'numberpick',
  ftDateMDY: 'datemdy',
  ftGender: 'gender',
  ftRace: 'race',
  ftRadioButton: 'radio',
  ftCheckBox: 'checkbox',
  ftCheckBoxNOTA: 'checkboxNOTA',
  ftCheckBoxMultiple: 'checkboxmultiple',
  ftUserAvatar: 'useravatar',

  // Variable Types
  vtUnknown: 'Unknown', // 0,
  vtText: 'Text', // 1,
  vtTF: 'TF', // 2,
  vtMC: 'MC', // 5,
  vtNumber: 'Number', // 3,
  vtDate: 'Date', // 4,
  vtOther: 'Other', // 6,
  // vtStringsAns: ['Unknown','TextValue','TFValue','NumValue','DateValue','MCValue','OtherValue'],
  // vtStrings: ['Unknown','Text','TF','Number','Date','MC','Other'],
  // vtStringsGrid: ['Unknown','Text','True/False','Number','Date','Multiple Choice','Other'],

  // Limits
  // 2014-05-27 HotDocs has 50 character limit on variable name length
  MAXVARNAMELENGTH: 50,
  // Arbitrarily chosen limit on fields per question
  MAXFIELDS: 9,
  // Reasonable limit on buttons per question
  MAXBUTTONS: 3,
  MAXSTEPS: 13,
  // Reasonable limits for years in jquery date picker option list
  kMinYear: 1900,
  kMaxYear: 2200,

  // 11/27/07 1.7.7 Ordering options for lists such as a county list
  ordDefault: '',
  ordAscending: 'ASC',
  ordDescending: 'DESC',

  // Navigation page destinations
  qIDNOWHERE: '',
  qIDSUCCESS: 'SUCCESS', // Posts data to server and exits viewer
  qIDFAIL: 'FAIL', // Discards any data and exits viewer
  qIDEXIT: 'EXIT', // 8/17/09 3.0.1 Save like SUCCESS but flag incomplete true.
  qIDBACK: 'BACK', // 8/17/09 3.0.1 Same as history Back button.
  qIDRESUME: 'RESUME', // 8/24/09 3.0.2
  qIDASSEMBLE: 'ASSEMBLE',
  qIDASSEMBLESUCCESS: 'ASSEMBLE-SUCCESS',

  // 2014-06-04 Button-based repeat options
  RepeatVarSetOne: '=1',
  RepeatVarSetPlusOne: '+=1',

  // HotDocs ANX
  // 4/8/04 This is the DTD for the HotDocs ANX file format.
  // It's prepended to the answer set for upload.
  HotDocsANXHeader_UTF8_str: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n',
  ScriptLineBreak: '<BR/>'
}

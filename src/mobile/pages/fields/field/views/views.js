import text from './text.stache'
import radio from './radio.stache'
import number from './number.stache'
import numberphone from './numberphone.stache'
import numberdollar from './numberdollar.stache'
import gender from './gender.stache'
import datemdy from './datemdy.stache'
import textpick from './textpick.stache'
import textlong from './textlong.stache'
import checkbox from './checkbox.stache'
import useravatar from './user-avatar.stache'
import numberpick from './numberpick.stache'

/**
 * @property {Module} viewer/mobile/pages/fields/field/views/ views
 * @parent viewer/mobile/pages/fields/field/
 *
 * This module maps field types to their templates renderer function
 *
 * ## use
 * @codestart
 *   import views from 'views/';
 *   let renderer = views['checkbox'];
 *   let fragment = renderer({ field, label, name });
 *   document.body.appendChild(fragment);
 * @codeend
 */
export default {
  checkbox,
  checkboxNOTA: checkbox,
  useravatar,
  datemdy,
  gender,
  number,
  numberdollar,
  numberphone,
  numberpick,
  numberssn: numberphone,
  numberzip: text,
  radio,
  text,
  textlong,
  textpick
}

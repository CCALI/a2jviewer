import canAjax from 'can-ajax'
import Model from 'can-model'

import 'can-map-define'

/**
 * @module {function} Preview
 * @inherits can.Model
 * @parent api-models
 *
 * The **Preview** model is used for fetching the HTML preview from DAT.
 *
 *  @codestart
 *    Preview
 *      .findOne({ answers, fileDataUrl, guideId, guideTitle })
 *      .then(function(preview) {}, function(error) {});
 *  @codeend
 *
 */

const Preview = Model.extend('PreviewModel', {
  findOne (data) {
    return canAjax({
      data,
      dataType: 'html',
      type: 'POST',
      url: '/api/preview'
    })
  },

  parseModel (html) {
    return {
      html
    }
  }
}, {
  define: {
    html: {
      type: 'string'
    }
  }
})

export default Preview

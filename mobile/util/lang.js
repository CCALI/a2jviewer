import DefineMap from 'can-define/map/map'
import TLang from 'caja/viewer/mobile/util/tlang'
import cString from 'caja/viewer/mobile/util/string'

export default DefineMap.extend({
  seal: false
},
{
  init: function (id) {
    var o = {}

    TLang(o, cString.makestr.bind(cString)).set(id)
    return this.assign(o)
  }
})

import DefineMap from 'can-define/map/map'
import TLang from '~/src/mobile/util/tlang'
import cString from '@caliorg/a2jdeps/utils/string'

export default DefineMap.extend({
  seal: false
},
{
  init: function (id) {
    const o = {}

    TLang(o, cString.makestr.bind(cString)).set(id)
    return this.assign(o)
  }
})

import { assert } from 'chai'
import normalizePath from '../normalize-path'

import 'steal-mocha'

describe('normalizePath', function () {
  const pathToGuide = '/userfiles/user/guide/'
  const fullyQualifiedPathToGuide = 'http://www.cali.org/userfiles/user/guide/'

  it('returns empty string with invalid parameters', function () {
    assert.equal(normalizePath(), '')
    assert.equal(normalizePath('foo', null), '')
    assert.equal(normalizePath(null, 'foo'), '')
  })

  it('keeps urls', function () {
    let url = 'http://some/folder/file.xxx'
    assert.equal(normalizePath(pathToGuide, url), url)
  })

  it('keeps fully qualified guide path', function () {
    let file = 'buds.jpg'
    assert.equal(normalizePath(fullyQualifiedPathToGuide, file), 'http://www.cali.org/userfiles/user/guide/buds.jpg')
  })

  it('replaces the file path with path provided as first argument', function () {
    let path = 'C:\\Users\\dev\\Documents\\logo.jpg'
    assert.equal(normalizePath(pathToGuide, path), '/userfiles/user/guide/logo.jpg')

    path = '/Users/dev/Sites/file.xml'
    assert.equal(normalizePath(pathToGuide, path), '/userfiles/user/guide/file.xml')
  })
})

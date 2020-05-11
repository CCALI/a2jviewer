const skinClassMap = {
  lighter: 'skin-lighter',
  light: 'skin-light',
  medium: 'skin-medium',
  dark: 'skin-dark',
  darker: 'skin-darker'
}

const hairClassMap = {
  blonde: 'hair-blonde',
  red: 'hair-red',
  brownLight: 'hair-brown-light',
  brownMedium: 'hair-brown-medium',
  brownDark: 'hair-brown-dark',
  grayDark: 'hair-gray-dark',
  grayLight: 'hair-gray-light',
  bald: 'hair-bald'
}

export const skinTones = Object.keys(skinClassMap)
export const hairColors = Object.keys(hairClassMap)
export const genders = ['female', 'male']
export const faces = ['front', 'right', 'left']

export function getClassNameForSkin (skin) {
  return skinClassMap[skin]
}

export function getClassNameForHair (hair) {
  return hairClassMap[hair]
}

const enumType = function (enumColl, defaultValue) {
  function EnumType (value) {
    const hasValue = enumColl.indexOf(value) !== -1
    if (hasValue) {
      return value
    }

    return defaultValue || enumColl[0]
  }

  EnumType.defaultValue = defaultValue
  return EnumType
}

export const Face = enumType(faces, 'front')
export const Gender = enumType(genders, 'female')
export const Skin = enumType(skinTones, 'medium')
export const Hair = enumType(hairColors, 'brownDark')

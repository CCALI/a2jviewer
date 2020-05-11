let dark = 'dark'
let darker = 'darker'
let lighter = 'lighter'

let tonesMap = {
  tan: dark,
  tan2: darker,
  blank: lighter,
  avatar1: lighter,
  avatar2: dark,
  avatar3: darker
}

export default function getSkinTone (avatarName) {
  if (!avatarName) return lighter
  return tonesMap[avatarName]
}

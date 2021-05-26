import DefineMap from 'can-define/map/map'

export default DefineMap.extend('ModalContent', {
  // variable name

  // shows glyphicon-lifebuoy if emptry
  title: { default: '' },

  // question text
  text: { default: '' },

  audioURL: { default: '' },

  // summary or transcription of audio content
  mediaLabel: { default: '' },

  imageURL: { default: '' },

  // represents imageURL
  altText: { default: '' },

  videoURL: { default: '' },

  // text transcript of video content
  helpReader: { default: '' },

  // only used for textlong `zoom` modals
  textlongValue: { default: '' },
  textlongFieldVM: { Default: DefineMap },
  field: { Default: DefineMap }
})

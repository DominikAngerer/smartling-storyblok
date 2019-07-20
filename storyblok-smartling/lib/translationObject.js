class TranslationObject {
  constructor(translationObject) {
    this.translationObject = translationObject
  }

  toSmartling() {
    delete this.translationObject['page']
    delete this.translationObject['language']

    // escape ## and other syntaxes for smartling
    this.translationObject = JSON.parse(JSON.stringify(this.translationObject).replace(/#/g, '-#'))

    return JSON.stringify(this.translationObject)
  }

  toStoryblok({ story_id, language }) {
    this.translationObject['page'] = story_id.toString()
    this.translationObject['language'] = language

    // unescape ## and other syntaxes from smartling
    this.translationObject = JSON.parse(JSON.stringify(this.translationObject).replace(/-#/g, '#'))

    return JSON.stringify(this.translationObject)
  }
}

module.exports = TranslationObject
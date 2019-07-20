const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

const StoryblokClient = require('storyblok-js-client')
const SmartlingClient = require('../lib/smartling')
const TranslationObject = require('../lib/translationObject')
const asyncRoute = require('../lib/asyncRoute')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(helmet())
app.use(cors())

app.get('*', asyncRoute(async (req, res) => {
  try {
    const locale = req.query.locale
    const fileUri = req.query.fileUri

    const Smartling = await new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET
    })
    
    const Storyblok = new StoryblokClient({
      oauthToken: process.env.STORYBLOK_MANAGEMENT_TOKEN
    })
    
    const smartinglingTranslations = await Smartling.get(`files-api/v2/projects/${process.env.SMARTLING_PROJECT_ID}/locales/${locale}/file`, {
      params: { 
        fileUri: fileUri
      }
    })
    
    const currentStory = await Storyblok.get(`spaces/${process.env.STORYBLOK_SPACE_ID}/stories/`, { with_slug: fileUri })
    const story = currentStory.data.stories[0]

    const importTranslationObject = new TranslationObject(smartinglingTranslations.data).toStoryblok({ story_id: story.id, language: locale })

    const storyblokImportResult = await Storyblok.put(`spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${story.id}/import.json?lang_code=${locale}`, {
      data: importTranslationObject
    })

    res.status(200).json({ message: 'Translation pushed into Storyblok' })
  } catch(e) {
    res.status(500).json({ message: 'Translation was not pushed into Storyblok', error: e })
  }
}))

module.exports = app



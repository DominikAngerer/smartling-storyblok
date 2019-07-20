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

app.post('*', asyncRoute(async (req, res) => {
  // Params: {
  //   space_id: 12345,
  //   story_id: 1231231,
  //   smartling_translation_job_uid: 123213123
  //   smartling_authorize: true
  // }
  
  // https://api.smartling.com/jobs-api/v3/projects/{projectId}/jobs/{translationJobUid}/file/add

  try {
    const Storyblok = new StoryblokClient({
      oauthToken: process.env.STORYBLOK_MANAGEMENT_TOKEN
    })

    const exportResponse = await Storyblok.get(`spaces/${process.env.STORYBLOK_SPACE_ID}/stories/${req.body.story_id}/export.json`)

    const Smartling = await new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET
    })
    
    const uploadResponse = await Smartling.upload(`files-api/v2/projects/${process.env.SMARTLING_PROJECT_ID}/file`, {
      file: new TranslationObject(exportResponse.data).toSmartling(),
      fileName: `${req.body.full_slug}.json`,
      fileUri: req.body.full_slug,
      fileType: 'json',
      callbackUrl: 'https://storyblok-smartling.dastoryblok.now.sh/api/to-storyblok.js'
    })

    const addFileToJobResponse = await Smartling.post(`jobs-api/v3/projects/${process.env.SMARTLING_PROJECT_ID}/jobs/${req.body.smartling_translation_job_uid}/file/add`, {
      fileUri: req.body.full_slug,
      targetLocaleIds: req.body.smartling_target_locales
    })
    
    res.status(200).json({ message: 'Translation pushed into Smartling' })
  } catch(e) {
    console.log(e)
    res.status(500).json({ message: 'Translation was not pushed into Smartling', errors: e })
  }
}))

module.exports = app



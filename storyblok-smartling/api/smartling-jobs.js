const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

const SmartlingClient = require('../lib/smartling')
const asyncRoute = require('../lib/asyncRoute')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(helmet())
app.use(cors())

app.get('*', asyncRoute(async (req, res) => {
  try {

    console.log(process.env.SMARTLING_USER_IDENTIFIER)
    console.log(process.env.SMARTLING_USER_SECRET)
    console.log(process.env.SMARTLING_PROJECT_ID)

    const Smartling = await new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET
    })
    
    const smartlingJobResponse = await Smartling.get(`jobs-api/v3/projects/${process.env.SMARTLING_PROJECT_ID}/jobs`, {
      sortBy: 'jobName'
    })
    
    res.status(200).json(smartlingJobResponse.data)
  } catch(e) {
    console.log(e.response.data.response.errors)
    res.status(500).json({ message: 'Can not load jobs from Smartling', errors: e.response.data.response.errors })
  }
}))

app.post('*', asyncRoute(async (req, res) => {
  try {
    const Smartling = await new SmartlingClient({
      userIdentifier: process.env.SMARTLING_USER_IDENTIFIER,
      userSecret: process.env.SMARTLING_USER_SECRET
    })
    const smartlingJobResponse = await Smartling.post(`jobs-api/v3/projects/${process.env.SMARTLING_PROJECT_ID}/jobs`, req.body)

    res.status(200).json(smartlingJobResponse.data)
  } catch(e) {
    console.log(e.response.data.response.errors)
    res.status(500).json({ message: 'Can not create job in Smartling', errors: e.response.data.response.errors })
  }
}))

module.exports = app



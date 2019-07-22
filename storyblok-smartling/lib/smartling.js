const axios = require('axios')
const FormData = require('form-data')
const Blob = require('node-blob')

class Smartling {
  constructor(options) {
    return (async (options) => {
      const auth = await axios.post(
        'https://api.smartling.com/auth-api/v2/authenticate', {
          userIdentifier: options.userIdentifier,
          userSecret: options.userSecret
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

      this.client = axios.create({
        baseURL: 'https://api.smartling.com/',
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${auth.data.response.data.accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      return this
    })(options)
  }

  get(path, params) {
    return this.client.get(path, params)
  }

  put(path, params) {
    return this.client.put(path, params)
  }

  post(path, params) {
    return this.client.post(path, params)
  }

  delete(path, params) {
    return this.client.delete(path, params)
  }

  upload(path, { file, fileName, fileUri, fileType = 'json', callbackUrl }) {
    const form = new FormData()
    form.append('file', file, fileName)
    form.append('fileUri', fileUri)
    form.append('fileType', fileType)
    form.append('authorize', 'true')
    form.append('callbackUrl', callbackUrl)
    
    let headers = form.getHeaders()
    headers['Authorization'] = this.client.defaults.headers.Authorization
    
    return this.client.post(path, form, {
      headers: headers
    })
  }
}

module.exports = Smartling
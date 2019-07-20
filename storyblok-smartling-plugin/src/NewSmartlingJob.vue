<template>
  <div>
    <fieldset>
      <span class="form__topic uk-margin-top">Enter new Smartling Job name</span>
      <input type="text" class="uk-width-1-1" v-model="jobName" />
    </fieldset>

    <fieldset>
      <span class="form__topic uk-margin-top">Enter a Smartling Job Description</span>
      <textarea class="uk-width-1-1" v-model="description" ></textarea>
    </fieldset>

    <fieldset>
      <span class="form__topic uk-margin-top">Enter a Smartling Job reference identifier</span>
      <input type="text" class="uk-width-1-1" @focus="dirtyReferenceNumber = true" v-model="referenceNumber" />
    </fieldset>

    <fieldset>
      <span class="form__topic uk-margin-top">Locales configured in this Storyblok Space</span>
      <ul class="uk-grid">
        <li class="uk-width-1-3" :key="locale" v-for="locale in targetLocaleIds">
          <label>
            <input
              type="checkbox"
              name="storyblokLocales"
              disabled="true"
              checked="checked"
              :value="locale"
            />
            {{locale}}
          </label>
        </li>
      </ul>
    </fieldset>

    <fieldset>
      <div class="uk-grid uk-margin-top">
        <div class="uk-width-1-2">
          <button class="uk-button uk-width-1-1" @click.prevent="cancel">Cancel</button>
        </div>
        <div class="uk-width-1-2">
          <button class="uk-button uk-width-1-1 uk-button-primary" @click.prevent="createSmartlingJob" :disabled="!readyToSubmit">
            <span v-if="!creatingSmartlingJob">Create Job</span>
            <span v-if="creatingSmartlingJob">Creating ...</span>
          </button>
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script>
import axios from 'axios'
import slugify from 'slugify'

export default {
  props: {
    api: Object,
    current: Object,
    handleError: Function,
    clearErrors: Function
  },
  name: 'NewSmartlingJob',
  data() {
    return {
      jobName: '',
      description: '',
      dueDate: '',
      referenceNumber: '',
      dirtyReferenceNumber: false,
      targetLocaleIds: [],
      loadingStoryblokLocales: false,
      creatingSmartlingJob: false,
      uploadToSmartling: false,
      smartlingJobId: '',
      story: null
    }
  },
  computed: {
    readyToSubmit() {
      return (this.jobName.length > 0 && this.jobName.length <= 170) && this.description.length > 0 && this.referenceNumber.length > 0
    }
  },
  mounted() {
    this.loadStoryblokLocales()
  },
  methods: {
    loadStoryblokLocales() {
      this.api
        .get(`cdn/spaces/me`)
        .then(res => {
          this.targetLocaleIds = res.data.space.language_codes
          this.loadingStoryblokLocales = false
        })
        .catch(err => this.handleError(err, `Couldn't create new Smartling Job.`, () => { 
          this.targetLocaleIds = []
          this.loadingStoryblokLocales = false }))
    },
    createSmartlingJob() {
      if(this.creatingSmartlingJob) {
        return
      }

      this.creatingSmartlingJob = true

      let smartlingJob = {
        jobName: this.jobName,
        description: this.description,
        referenceNumber: this.referenceNumber,
        targetLocaleIds: this.targetLocaleIds,
        callbackUrl: "https://storyblok-smartling.dastoryblok.now.sh/api/to-storyblok.js",
        callbackMethod: 'GET'
      }

      axios.post('https://storyblok-smartling.dastoryblok.now.sh/api/smartling-jobs.js', smartlingJob).then(res => {
        this.creatingSmartlingJob = false

        this.smartlingJobId = res.data.response.data.translationJobUid
        this.addToSmartlingJob()

      }).catch(err => this.handleError(err, `Couldn't create new Smartling Job.`, () => { 
        this.creatingSmartlingJob = false 
      }))
    },
    addToSmartlingJob() {
      let translationRequestObject = {
        space_id: this.current.spaceId,
        story_id: this.current.story.id,
        full_slug: this.current.story.full_slug,
        smartling_translation_job_uid: this.smartlingJobId
      }

      console.log('Adding file to Job', translationRequestObject.full_slug)

      this.uploadToSmartling = true
      axios.post('https://storyblok-smartling.dastoryblok.now.sh/api/to-smartling.js', translationRequestObject).then(res => {
        this.uploadToSmartling = false
        
        console.log(res)
        
      }).catch(err => this.handleError(err, `Couldn't upload file to Smartling.`, () => { 
        this.uploadToSmartling = false 
      }))
    },
    cancel() {
      Object.assign(this.$data, this.$options.data.apply(this))
      this.loadStoryblokLocales()
      this.clearErrors()
    }
  },
  watch: {
    jobName(newVal) {
      if(!this.dirtyReferenceNumber || this.referenceNumber.length <= 0) {
        this.referenceNumber = slugify(newVal).toLowerCase()
        this.dirtyReferenceNumber = false
      }
    }
  }
}
</script>

<template>
  <div>
    <div class="uk-margin-top" v-if="loadingSmartlingJobs">
      <span class="uk-text-muted">Loading Smartling jobs</span>
    </div>
    <div v-if="!loadingSmartlingJobs">
      <fieldset>
        <span class="form__topic uk-margin-top">Choose a Smartling Job</span>
        <select class="uk-width-1-1" v-model="selectedSmartlingJob">
          <option :value="null"></option>
          <option
            :value="smartlingJob"
            :key="smartlingJob.translationJobUid"
            v-for="smartlingJob in smartlingJobs"
          >{{smartlingJob.jobName}}</option>
        </select>
      </fieldset>

      <fieldset>
        <span class="form__topic uk-margin-top">Choose locales for translation</span>

        <div v-if="selectedSmartlingJob === null">
          <span class="uk-text-muted">Select a Smartling job first</span>
        </div>
        <div v-else>
          <ul class="uk-grid">
            <li
              class="uk-width-1-3"
              :key="locale"
              v-for="locale in selectedSmartlingJob.targetLocaleIds"
            >
              <label>
                <input type="checkbox" name="locales" v-model="selectedLocales" :value="locale" />
                {{locale}}
              </label>
            </li>
          </ul>
        </div>
      </fieldset>

      <fieldset>
        <div class="uk-grid uk-margin-top">
          <div class="uk-width-1-2">
            <button class="uk-button uk-width-1-1" @click.prevent="cancel">Cancel</button>
          </div>
          <div class="uk-width-1-2">
            <button class="uk-button uk-width-1-1 uk-button-primary" :disabled="!readyToSubmit" @click.prevent="addToSmartlingJob">Add to Job</button>
          </div>
        </div>
      </fieldset>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ReuseSmartlingJob',
  props: {
    api: Object,
    current: Object,
    handleError: Function,
    clearErrors: Function
  },
  data() {
    return {
      loadingSmartlingJobs: true,
      smartlingJobs: [],
      selectedSmartlingJob: null,
      selectedLocales: []
    }
  },
  computed: {
    readyToSubmit() {
      return this.selectedSmartlingJob != null && this.selectedLocales.length > 0
    }
  },
  mounted() {
    this.loadSmartlingJobs()
  },
  methods: {
    loadSmartlingJobs() {
      axios.get('https://storyblok-smartling.dastoryblok.now.sh/api/smartling-jobs.js').then(res => {
        this.smartlingJobs = res.data.response.data.items
        this.loadingSmartlingJobs = false
      }).catch(err => handleError(err, `Smartling Jobs couldn't be loaded.`, () => {
        this.loadingSmartlingJobs = false
      }))
    },
    cancel() {
      Object.assign(this.$data, this.$options.data.apply(this))
      this.loadStoryblokLocales()
    },
    addToSmartlingJob() {
      let translationRequestObject = {
        space_id: this.current.spaceId,
        story_id: this.current.story.id,
        full_slug: this.current.story.full_slug,
        smartling_translation_job_uid: this.selectedSmartlingJob.translationJobUid
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
  },
  watch: {
    selectedSmartlingJob(newVal) {
      this.selectedLocales = newVal.targetLocaleIds
    }
  }
}
</script>

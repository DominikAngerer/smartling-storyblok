<template>
  <div class="smartling">
    <div class="uk-grid">
      <div class="uk-width-1-2">
        <button class="uk-button uk-width-1-1" @click="action = 'NewSmartlingJob'">
          <i class="uk-icon-language"></i> New Job
        </button>
      </div>
      <div class="uk-width-1-2">
        <button class="uk-button uk-width-1-1" @click="action = 'ReuseSmartlingJob'">
          <i class="uk-icon-recycle"></i> Reuse Job
        </button>
      </div>
    </div>

    <template v-if="action">
      <component :is="action" :api="api" :current="current" :story="story" 
        :handle-error="handleError" :clear-errors="clearErrors"/>
    </template>

  </div>
</template>

<script>
import NewSmartlingJob from './NewSmartlingJob.vue'
import ReuseSmartlingJob from './ReuseSmartlingJob.vue'

export default {
  mixins: [ window.Storyblok.plugin ],
  data() {
    return {
      errors: [],
      story: null,
      action: ''
    }
  },
  computed: {
    current() {
      return {
        spaceId: this.spaceId
      }
    }
  },
  components: {
    'NewSmartlingJob': NewSmartlingJob,
    'ReuseSmartlingJob': ReuseSmartlingJob
  },
  methods: {
    initWith() {
      return {
        plugin: 'smartling'
      }
    },
    pluginCreated() {
      this.loadCurrentStory()
    },
    loadCurrentStory() {
      this.api.get(`cdn/stories/${this.storyId}`, {version:'draft'}).then(res => {
        this.story = res.data.story
        this.story = res.data.story
      })
      .catch(err => this.handleError(err, `Couldn't load current Story.`))
    },
    handleError(err, message, cb) {
      // eslint-disable-next-line
      console.error(err)
      this.errors.push(message)
      typeof cb !== 'undefined' ? cb() : null;
    },
    clearErrors() {
      this.errors = []
    }
  },
  watch: {
    'model': {
      handler: function (value) {
        this.$emit('changed-model', value);
      },
      deep: true
    }
  }
}
</script>

<style>
.smartling textarea {
  font-size: 14px;
}

.smartling input {
  font-size: 14px;
}
</style>

# Storyblok V1: Smartling Integration

> Caution: field type plugin was written for Storyblok v1. Check out: https://www.storyblok.com/docs/plugins/field-type how you can create and deploy your own field type within Storyblok.

> Caution: field type plugin does not use blok.ink but Storyblok v1 UIKit styles.

## Folder structure

This repository contains two independent projects

- `storyblok-smartling-plugin`: handling the UI field type inside Storyblok
- `storyblok-smartling`: handling the vercel (now back than) function to transfer data from and to Smartling 

## `storyblok-smartling-plugin`

This contains a set-up for Storyblok field type based on Storyblok V1 UIkit components and styles. 

### Initial Screen

Allows for selection of either a new or existing Smartling Job. A Smartling Job (https://api-reference.smartling.com/#tag/Jobs) is the request to translate something - this is bascially an active translation happening in Smartling associated with words, priority, dates, and a Job Status. Translations are always "per Story" in Storyblok and therefore we can check for the current existance of a Job for the current StoryId. Depending on the existance we either chose to:

1. Create new Smartling Job
1. Reuse existing Smartling Job 

### Create new Smartling Job

This contains the Form which provides all the information needed to create a new Smartling Job through their API using our vercel function contained in `storyblok-smartling` folder. Below you can see a screenshot of: https://github.com/DominikAngerer/smartling-storyblok/blob/master/storyblok-smartling-plugin/src/NewSmartlingJob.vue as a field type inside the content area of v1. 

> Recommendation: If to be rebuilt for V2 try using a [Storyblok Tool](https://www.storyblok.com/docs/plugins/tool) to build out the "Push to Smartling" option; and a [Storyblok App](https://www.storyblok.com/docs/plugins/custom-application) for a proper overview of all open Smartling Jobs using their API.

![smartling-01](https://user-images.githubusercontent.com/7952803/218566597-7e48ced0-120d-43bd-8839-f03bf6c657e3.png)

### Reuse existing Smartling Job

Basically the same as the previous screen but with less options and with a selection of existing jobs to add a more locales of the current Storyblok Story to the Smartling Job.

## `storyblok-smartling`

Contains a vercel project (called Now) running on express back than created using their `now cli`. 

### Folder Structure

- `/api`: this is where the transfer functions are located
- `/lib`: handling of Storyblok and Smartling client initializations and wrapper for async usage
- `/www`: just for hosting purposes. Index.html showing a logo of Storyblok and Smartling.

### `/api`

The `/api` folder contains the routes available in our vercel function / express application which are used to actually connect Storyblok and Smartling. 

#### `/api/smartling-job.js`

This endpoint is used for the "Reuse Smartling Job" option that tries to load an existing Smartling job to either update or add new locales to it. It bascially lists those jobs or updates them based on the information submitted through the Storyblok field type.

#### `/api/to-smartling.js`

This endpoint handles the communication from the Storyblok smartling field type which receives the following information after hitting submit in the UI:

```
{
  space_id: 12345,
  story_id: 1231231,
  smartling_translation_job_uid: 123213123
  smartling_authorize: true
}
```

Once the endpoint is triggered the actual content will be loaded using the Storyblok Management API through [Storybloks `export` API endpoint](https://github.com/DominikAngerer/smartling-storyblok/blob/master/storyblok-smartling/api/to-smartling.js#LL32C49-L32C49) which allows to get a flat "key/value" pair version of the content only containing fields marked as "translatable" in the interface itself.

> Information: this works on the field translation feature and does not filter on a folder level translation using the dimensions app. Endpoint is still available for default language and based on folders for dimensions approach.

> Recommendation: If integration to be rebuilt: Start implementation with field level translation and once finished and approved add dimension/folder level translation compatibility.

Each Story will be escaped to be used within Smartling using the `TranslationObject` and `.toSmartling()` function (see details below).

The escaped Story of Storyblok will be uploaded as a Smartling File with the Storyblok `full_slug` as the `fileUri` at Smartling: https://github.com/DominikAngerer/smartling-storyblok/blob/master/storyblok-smartling/api/to-smartling.js#L39 and a callback URL will be submitted to Smartling to trigger the `/api/to-storyblok.js` option once the file has been translated.

Once the file has been uploaded succesfully it will be attached to the open Smartling job and information will be passed back to the Storyblok field type plugin to display for the user inside Storyblok.

#### `/api/to-storyblok.js`

The `/api/to-storyblok` endpoint doesn't receive any body parameter but two query strings: `locale` and `fileUri` with which we can load the appropriate Smartling Translations using their API. 

With the `fileUri` reflecting the `full_slug` in Storyblok we are able to load the actual story to receive the `story_id` needed to import the translations back into Storyblok as Smartling can't hide specific fields we had to remove them before importing. 

Once we recieve the story and therefore the `story_id` we unescape the key/value pair string of Smartling again, adding the story_id and language as keys. Once added the Storyblok Management API endpoint for `import` will be called https://github.com/DominikAngerer/smartling-storyblok/blob/master/storyblok-smartling/api/to-storyblok.js#L42 and the translated version therefore updated within Storyblok.

### `/lib`

The `/lib` folder contains supporting JS classes that are used in the `/api` enpoints itself. 

#### `lib/smartling.js`

It contains a [Smartling API Client Wrapper](https://github.com/DominikAngerer/smartling-storyblok/blob/master/storyblok-smartling/lib/smartling.js) class used to access the Smartling API as there was no proper JS Client library available. The constructor in the Smartling class returns a customized `axios` client already initialized with the correct authorization header and baseUrl needed to perform requests.

#### `lib/translationObject.js`

Simple wrapper allowing to fix some escapings that Smartling can't handle but needs and adds or removes them depending on the direction of "to Storyblok" or "to Smartling". Smartling also can't handle the default `page` and `language` property of Storyblok therefore it is removed in the `toSmartling` function and passed as parameter in the `toStoryblok` transformer function which got the missing information from the incoming request of the storyblok field type inside Storyblok (knowing the story_id and language).

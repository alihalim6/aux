<template>
  <section>
    <div class="title-border"></div>

    <div class="new-releases-container">
      <LoadingOverlay v-if="!newReleases.length"/>
      <VerticalContent :data="newReleases"/>
    </div>
  </section>
</template>

<script>
  import {Component, Vue} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import {format} from 'timeago.js';
  import {httpClient} from '~/utils/api';

  @Component
  export default class NewReleases extends Vue {
    newReleases = [];

    async beforeMount(){
      const { data } = await httpClient.post('/passthru', {
        url: '/browse/new-releases?limit=50',
        method: 'GET'
      });

      this.newReleases = setItemMetaData(data.albums.items);

      this.newReleases.forEach(release => {
        if(release.release_date){
          release.timeAgo = format(release.release_date);
        }
      });
    }
  }
</script>

<style lang="scss">
  .new-releases-container {
    padding-top: $base-padding;
  }
</style>
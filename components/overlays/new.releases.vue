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
  import {httpClient} from '~/utils/api';
  import moment from 'moment';

  @Component
  export default class NewReleases extends Vue {
    newReleases = [];

    async beforeMount(){
      const { data } = await httpClient.post('/passthru', {url: '/browse/new-releases?limit=50'});

      this.newReleases = setItemMetaData(data.albums.items);

      this.newReleases.forEach(release => {
        if(release.release_date){
          release.timeAgo = moment(release.release_date).toISOString();
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
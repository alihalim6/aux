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
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import {httpClient} from '~/utils/api';
  import moment from 'moment';

  @Component
  export default class NewReleases extends Vue {
    newReleases = [];

    @Prop({required: true})
    initialData;

    async beforeMount(){
      //get the rest of the new releases (initial set is retrieved on app load)
      const { data } = await httpClient.post('/passthru', {url: `/browse/new-releases?offset=${this.initialData.length}&limit=50`});

      this.newReleases = [...this.initialData, ...data.albums.items];
      this.newReleases = setItemMetaData(this.newReleases);

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
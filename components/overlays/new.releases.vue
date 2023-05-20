<template>
  <section>
    <div class="title-border"></div>

    <div class="new-releases-container">
      <VerticalContent :data="newReleases"/>
    </div>
  </section>
</template>

<script>
  import {Component, Vue} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import moment from 'moment';
  import spotify from '~/api/spotify';

  @Component
  export default class NewReleases extends Vue {
    newReleases = [];

    async beforeMount(){
      const {albums} = await spotify({url: '/browse/new-releases?limit=50'})
      this.newReleases = setItemMetaData(albums.items);

      this.newReleases.forEach(release => {
        if(release.release_date){
          release.timeAgo = moment(release.release_date).toISOString();
        }
      });
    }

    mounted(){
      this.$nuxt.$root.$emit('newAndRecoOverlayShown');
    }
  }
</script>

<style lang="scss">
  .new-releases-container {
    margin-top: $base-padding;
  }
</style>
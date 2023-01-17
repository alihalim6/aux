<template>
  <section>
    <div class="title-border"></div>

    <div class="new-releases-container">
      <VerticalContent :data="newReleases"/>
    </div>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import moment from 'moment';

  @Component
  export default class NewReleases extends Vue {
    newReleases = [];

    @Prop({required: true})
    data;

    beforeMount(){
      this.newReleases = setItemMetaData(this.data);

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
<template>
  <section>
    <div class="title-container max-inner-width">
      <div class="title">
        <div class="title-border">
          Discover
          <div class="secondary-title-border"></div>
        </div>
        
        <div class="clickable see-all">
          <div class="sub-title-label">See All</div><v-icon class="see-all-icon" color="red">mdi-arrow-right</v-icon>
        </div>
      </div>

      <div class="sub-title">Lorem ipsum dolor sit amet, consectetur adipiscing elit, consectetur adipiscing.</div>
    </div>
  </section>
</template>

<script>
  import {Component, Vue} from 'nuxt-property-decorator';
  import {storageGet} from '~/utils/storage';
  import {AUTH} from '~/utils/constants';
  
  @Component
  export default class Discover extends Vue {
      data = {};

      //getting token relies on window object which isn't avaialable until beforeMount
      async beforeMount(){
        await this.$store.dispatch('fetchDiscoverData', {accessToken: storageGet(AUTH.ACCESS_TOKEN)});
        const {allData} = this.$store.getters.data('discover');
        //thls.data = allData;
      }
  }
</script>

<style lang="scss">

</style>
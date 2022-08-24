<template>
  <section class="mt-1">
    <div class="title-border mb-3"></div>

    <v-card elevation="7" class="pt-1">
      <v-tabs class="" v-model="selectedTab" slider-color="black" grow color="rgba(0, 0, 0, 0.8)">
        <v-tab v-for="(item, index) in content" :key="item.key">
          <div class="unselected-tab" :class="{'selected-tab': selectedTab === index}">
            <span class="">{{item.label}}</span>
          </div>
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="selectedTab">
        <v-tab-item v-for="item in content" :key="item.label">
          <div class="" v-if="item.data.length">
            <ContentCarousel v-if="item.carousel" :data="item.data" :vertical="true"/>
            <TrackList v-else :tracks="item.data" :tracksFromDifferentAlbums="true" :displayArtists="true" :hideAlbums="true"/>
          </div>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import {UI} from '~/store/constants';

  @Component
  export default class NewAndRecommendedDetails extends Vue {
    selectedTab = 0;
    newAndRecommended = [];

    content = [
      {
        data: [],
        label: 'Tracks'
      },
      {
        data: [],
        label: 'Albums',
        carousel: true
      },
      {
        data: [],
        label: 'Artists',
        carousel: true
      }
    ];

    @Prop({required: true})
    data;

    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;

    async beforeMount(){
      this.newAndRecommended = setItemMetaData(this.data);
      this.content[0].data = this.newAndRecommended.filter(item => item.isTrack || item.singleTrack);//tracks
      this.content[1].data = this.newAndRecommended.filter(item => item.isAlbum && !item.singleTrack);//albums
      this.content[2].data = this.newAndRecommended.filter(item => item.isArtist);//artists
    }
  }
</script>

<style lang="scss">
  .unselected-tab {
    color: #888888;
    font-weight: bold;
    text-transform: none;
  }

  .selected-tab {
    background-color: $primary-theme-color;
    color: $secondary-theme-color;
    padding: 8px;
    border-radius: 2px;
  }
</style>
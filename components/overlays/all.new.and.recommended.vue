<template>
  <section class="mt-1 simple-overlay-container">
    <div class="title-border mb-3"></div>

    <v-card elevation="7" class="pa-2">
      <v-tabs v-model="selectedTab" slider-color="black" grow color="rgba(0, 0, 0, 0.8)">
        <v-tab v-for="(item, index) in content" :key="item.label">
          <div class="unselected-tab" :class="{'selected-tab': selectedTab === index}">
            <span class="">{{item.label}}</span>
          </div>
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="selectedTab">
        <v-tab-item v-for="item in content" :key="item.label">
          <div v-if="item.data.length">
            <div v-if="item.tracks">
              <PlayAllAndShuffle :tracks="item.data" collectionKey="newAndRecommended"/>
              <TrackList :tracks="item.data" :tracksFromDifferentAlbums="true" :hideAlbums="true" :new-and-recommended="true"/>
            </div>

            <ContentCarousel v-else :data="item.data" :vertical="true" :new-and-recommended="true"/>
          </div>
        </v-tab-item>
      </v-tabs-items>
    </v-card>
  </section>
</template>

<script>
  import {Component, Prop, Vue} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import cloneDeep from 'lodash.clonedeep';//prevent modification of parent new.and.recommended.vue data
  
  @Component
  export default class AllNewAndRecommended extends Vue {
    selectedTab = 0;
    newAndRecommended = [];

    content = [
      {
        data: [],
        label: 'Tracks',
        tracks: true
      },
      {
        data: [],
        label: 'Albums'
      },
      {
        data: [],
        label: 'Artist'
      }
    ];

    @Prop({required: true})
    data;

    async beforeMount(){
      this.newAndRecommended = setItemMetaData(cloneDeep(this.data));
      this.content[0].data = this.newAndRecommended.filter(item => item.isTrack || item.singleTrack);//tracks
      this.content[1].data = this.newAndRecommended.filter(item => item.isAlbum && !item.singleTrack);//albums
      this.content[2].data = this.newAndRecommended.filter(item => item.isArtist);//artists
    }

    mounted(){
      this.$nuxt.$root.$emit('newAndRecoOverlayShown');
    }
  }
</script>

<style lang="scss" scoped>
  .unselected-tab {
    color: #888888;
    font-weight: bold;
    text-transform: none;
    font-weight: bold;
  }

  .selected-tab {
    background-color: $rose-red;
    color: $cream;
    padding: 8px;
    border-radius: 2px;
    font-weight: 900;
  }
</style>
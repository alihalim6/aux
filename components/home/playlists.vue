<template>
  <section class="pt-1 pb-6">
    <div class="title-container mt-4">
      <div class="home-content-title">
        <div class="d-flex align-center">
          <span>Playlists</span>

          <v-hover v-slot="{hover}">
            <v-icon @click="refreshData()" class="clickable refresh-data" :class="{'hover-scale': hover, 'refreshing-data': refreshingData}" color="#1DB954">mdi-refresh</v-icon>
          </v-hover>
        </div>
      </div>
      
      <div class="home-content d-flex">
        <v-tabs v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active vertical class="playlist-tabs">
          <v-tab v-for="(item, index) in content" :key="item.type" class="justify-start">
            <div class="playlist-tab" :class="{'selected-tab': selectedTab === index}">
              <span>{{item.label}}</span>
            </div>
          </v-tab>
        </v-tabs>

        <v-tabs-items v-model="selectedTab" class="overflow-scroll home-tabs scroll-shadow" id="playlistTabContent">
          <v-tab-item v-for="item in getTabContent()" :key="item.type">
            <div class="pa-2">
              <VerticalContent :data="item.data" :alternate-format="true" :playlists="true"/>
            </div>

            <BackToTop elementId="playlistTabContent"/>
          </v-tab-item>
        </v-tabs-items>
      </div>
    </div>
  </section>
</template>

<script>
  import {Component, Vue} from 'nuxt-property-decorator';
  import {PLAYLISTS} from '~/utils/constants';
  import playlists from '~/api/playlists';
  import {setItemMetaData} from '~/utils/helpers';

  @Component
  export default class Playlists extends Vue {
    selectedTab = 0;
    refreshingData = false;

    content = [
      {
        data: [],
        type: 'featured',
        label: PLAYLISTS.FEATURED
      },
      {
        data: [],
        type: 'byMe',
        label: PLAYLISTS.BY_ME
      },
      {
        data: [],
        type: 'liked',
        label: PLAYLISTS.LIKED
      }
    ];

    async beforeMount(){
      await this.getData();
    }

    async getData(){
      const data = await playlists();
      
      this.content.forEach(playlistTab => {
        const playlist = data[playlistTab.type].filter(playlist => playlist);//spotify can send null playlists
        playlistTab.data = setItemMetaData(playlist);
      });
    }

    getTabContent(){
      return this.content.filter(content => content.data.length);
    }

    async refreshData(){
      this.refreshingData = true;
      await this.getData();
      this.refreshingData = false;
    }
  }
</script>

<style lang="scss">
  .playlist-tabs {
    max-width: 150px;
    padding: 4px 4px 4px 0px;

    .playlist-tab {
      color: $filter-label-color;
      font-weight: bold;

      @media(min-width: 400px){
        font-size: 16px;
      }
    }

    .selected-tab {
      color: $secondary-theme-color;
      background-color: $spotify-green;
      font-weight: bold;
      padding: 4px;
      border-radius: 4px;
    }
  }
</style>
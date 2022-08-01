<template>
  <section class="pt-1 pb-6">
    <div class="title-container mt-4">
      <div class="home-content-title">Playlists</div>
      
      <div class="home-content d-flex pa-1">
        <v-tabs v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active vertical class="playlist-tabs">
          <v-tab v-for="(item, index) in content" :key="item.key" class="justify-start">
            <div class="playlist-tab" :class="{'selected-tab': selectedTab === index}">
              <span>{{item.label}}</span>
            </div>
          </v-tab>
        </v-tabs>

        <v-tabs-items v-model="selectedTab" class="overflow-scroll home-tabs" id="playlistTabContent">
          <v-tab-item v-for="item in getContent()" :key="item.key">
            <div class="pa-2">
              <VerticalContent :data="item.data" :alternate-format="true"/>
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
  import {httpClient} from '~/utils/api';
  import {setItemMetaData} from '~/utils/helpers';

  @Component
  export default class Playlists extends Vue {
    selectedTab = 0;

    content = [
      {
        data: [],
        key: 'featured',
        label: PLAYLISTS.FEATURED
      },
      {
        data: [],
        key: 'byMe',
        label: PLAYLISTS.BY_ME
      },
      {
        data: [],
        key: 'liked',
        label: PLAYLISTS.LIKED
      }
    ];

    async beforeMount(){
      const { data } = await httpClient.get('/playlists');
      this.content.forEach(item => item.data = setItemMetaData(data[item.key]));
    }

    getContent(){
      return this.content.filter(content => content.data.length);
    }
  }
</script>

<style lang="scss">
  .playlist-tabs {
    max-width: 150px;
    padding: 4px;
    padding-left: 12px;

    .playlist-tab {
      color: $filter-label-color;

      @media(min-width: 400px){
        font-size: 18px;
      }
    }

    .selected-tab {
      color: $secondary-theme-color;
      background-color: $spotify-green;
      font-weight: bold;
    }
  }
</style>
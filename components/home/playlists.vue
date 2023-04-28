<template>
  <section class="mt-8 pt-3 pb-8 cream-background">
    <div class="content-container">
      <div class="home-content-title">
        <v-img @click="spotifyLogoPressed()" class="clickable spotify-full" src="/Spotify_Logo_Full.png"></v-img>

        <div class="d-flex align-center">
          <h3>Playlists</h3>

          <v-hover v-slot="{hover}">
            <v-icon 
              @click="refreshData()" 
              @keyup.enter="refreshData()"
              class="clickable refresh-data" 
              :class="{'hover-scale': hover, 'refreshing-data': refreshingData}" 
              color="#1DB954"
              aria-label="press enter to refresh Spotify playlists"
            >
                mdi-refresh
              </v-icon>
          </v-hover>
        </div>
      </div>
      
      <v-tabs class="tab-container home-content-responsive" v-model="selectedTab" background-color="transparent" color="rgba(0, 0, 0, 0.8)" hide-slider center-active>
        <v-tab v-for="(item, index) in content" :key="item.type" class="justify-start">
          <v-hover v-slot="{hover}">
            <div class="tab-label" :class="{'selected-tab': selectedTab === index, 'hover-tab': hover}" :aria-label="`Spotify playlists: ${item.label}`">
              <span>{{item.label}}</span>
            </div>
          </v-hover>

          <span v-if="index < (content.length - 1)" class="tab-divider color-black">/</span>
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="selectedTab" class="overflow-scroll home-tabs home-content cream-background py-0" id="playlistTabContent">
        <v-tab-item v-for="content in getTabContent()" :key="content.type">
          <div v-for="item in content.data" :key="item.uuid">
            <v-hover v-slot="{hover}">
              <v-card elevation="7" class="clickable playlist-container" @click="$nuxt.$root.$emit('displayDetailOverlay', item)">
                <v-img :src="item.imgUrl.large" class="playlist-img">
                  <template v-slot:placeholder>
                    <span class="content-placeholder">{{item.name.substring(0, 1)}}</span>
                  </template>
                </v-img>

                <div class="playlist-info" :style="{'background-image': `url(${item.imgUrl.large})`}" :class="{'playlist-hovered': hover}">
                  <div class="d-flex flex-column align-start justify-space-between height-100 width-100">
                    <div class="d-flex flex-column">
                      <span class="playlist-title">{{item.primaryLabel}}</span>
                      <span class="playlist-description">{{item.secondaryLabel}}</span>
                    </div>

                    <div class="number-of-playlist-tracks">{{item.numberOfTracks}}</div>
                  </div>
                </div>
              </v-card>
            </v-hover>
          </div>

          <BackToTop elementId="playlistTabContent" arrowColor="#1DB954"/>
        </v-tab-item>
      </v-tabs-items>
    </div>
  </section>
</template>

<script>
  import {Component, Mutation, Vue} from 'nuxt-property-decorator';
  import {PLAYLISTS} from '~/utils/constants';
  import playlists from '~/api/playlists';
  import {setItemMetaData} from '~/utils/helpers';
  import {USER} from '~/store/constants';

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

    @Mutation('setUserPlaylists', {namespace: USER})
    setUserPlaylists;

    async beforeMount(){
      await this.getData();
      
      this.$nuxt.$root.$on('trackAddedToPlaylist', function({playlist}){
        const myPlaylists = this.content.filter(({type}) => type == 'byMe' || type == 'liked').map(({data}) => data);
        
        for(const myPlaylist of [...myPlaylists[0], ...myPlaylists[1]]){
          if(myPlaylist.id == playlist.id){
            myPlaylist.numberOfTracks = `${++myPlaylist.tracks.total} Tracks`;
            break;
          }
        }
      }.bind(this));
    }

    async getData(){
      try{
        const data = await playlists();
        
        this.content.forEach(playlistTab => {
          const playlist = data[playlistTab.type].filter(playlist => playlist);//spotify can send null playlists
          playlistTab.data = setItemMetaData(playlist);
        });
      }
      catch(error){
        console.error(error);
      }
    }

    getTabContent(){
      return this.content.filter(content => content.data.length);
    }

    async refreshData(){
      this.refreshingData = true;
      await this.getData();
      this.refreshingData = false;
    }

    spotifyLogoPressed(){
      window.open('https://open.spotify.com/collection/playlists', '_blank');
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('trackAddedToPlaylist');
    }
  }
</script>

<style lang="scss">
  .playlist-info {
    background-color: rgba(0, 0, 0, 0.8);
    color: $secondary-theme-color;
    background-size: auto;
    background-position-y: center;
    background-blend-mode: overlay;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: -webkit-fill-available;
    padding: 18px 20px; 

    @media(min-width: $device-size-threshold){
      padding: 48px 20px 16px;
      background-color: rgba(0, 0, 0, 0.9);
    }
  }

  .playlist-img {
    @media(min-width: $device-size-threshold){
      max-width: 50%;
    }
  }

  .playlist-hovered {
    @media(min-width: $device-size-threshold){
      background-image: none;
      background-color: $secondary-theme-color;;
      color: $primary-theme-color;
    }
  }

  .number-of-playlist-tracks {
    font-size: 20px;
    white-space: nowrap;
    align-self: flex-end;
  }

  .playlist-title {
    font-size: 16px;

    @media(min-width: $device-size-threshold){
      font-size: 26px;
    }
  }

  .playlist-description {
    font-size: 12px;
    margin-bottom: 12px;
    color: $spotify-green;
    word-break: break-word;

    @media(min-width: $device-size-threshold){
      font-size: 16px;
    }
  }

  .playlist-container {
    margin: 8px 0px 24px;
    flex-direction: column;
    display: flex;

    @media(min-width: $device-size-threshold){
      flex-direction: row;
    }
  }

  #playlistTabContent .v-window__container {
    background-color: $cream;
  }
</style>
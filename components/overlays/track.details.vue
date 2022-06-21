<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label">
        <OverlayArtists :artists="track.artists"/>
        <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        {{new Date(track.album ? track.album.release_date : track.release_date).getFullYear()}}
      </div>

      <div class="sub-padding-left no-wrap">
        <span v-show="duration">{{duration}}</span>
      </div>
    </div>

    <v-card class="clickable overlay-details-container" elevation="7" v-show="track.album && (track.album.total_tracks > 1)" @click="displayDetailsOverlay(track.album)">
      <div id="fromAlbumTitle">From <span class="from-title">{{track.album.name}}</span>
        <v-icon small>mdi-arrow-right</v-icon>
      </div>

      <div class="album-info">
        <v-img class="clickable track-album" :src="track.album.imgUrl"></v-img>

        <div class="album-data">
          <div><span class="font-weight-regular">by</span> {{track.album.secondaryLabel}}</div>
          <div class="font-weight-regular from-album-tracks">{{track.album.total_tracks}} {{track.album.total_tracks > 1 ? 'Tracks' : 'Track'}}</div>
        </div>
      </div>
    </v-card>

    <MoreFromArtist v-if="(!track.album || track.album.total_tracks === 1)" :parentItem="track" :artist="track.artists[0]"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration, setItemMetaData} from '~/utils/helpers';
  import {UI} from '~/store/constants';

  @Component
  export default class TrackDetails extends Vue {
    duration = 0;

    @Prop({required: true})
    track;
    
    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;

    beforeMount(){
      if(this.track.album){
        setItemMetaData([this.track.album]);
      }
      
      if(this.track.singleTrack){
        setItemMetaData(this.track.details.artistAlbums);
        setItemMetaData(this.track.details.artistTopTracks);
        setItemMetaData(this.track.details.relatedArtists);
      }

      this.duration = msToDuration(this.track.duration_ms);
    }
  }
</script>

<style lang="scss">
  .from-title {
    font-weight: 600;
    text-decoration: underline;
  }

  .album-info {
    display: flex;
    align-items: center;

    .track-album {
      max-width: 55%;
      margin-top: 8px;
    }

    .album-data {
      display: flex;
      flex-direction: column;
      margin-left: 18px;
      font-weight: 600;
      font-size: 14px;

      @media(min-width: 600px){
        font-size: 16px;
      }
    }
  }
</style>
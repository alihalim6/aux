<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label">
        <ArtistList :artists="track.artists"/>
        
        <div v-if="!multiTrackAlbum">
          <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
          {{new Date(track.album ? track.album.release_date : track.release_date).getFullYear()}}
        </div>
      </div>

      <div class="sub-padding-left no-wrap">
        <span v-if="duration">{{duration}}</span>
      </div>
    </div>

    <div class="clickable from-album-container" v-if="multiTrackAlbum">
      <div class="font-weight-bold font-italic mb-1">FROM:</div>
      
      <div class="from-album-info">
        <div class="d-flex justify-space-between mb-3">
          <span>{{track.album.name}}</span>

          <div class="d-flex no-wrap align-center">
            <PlaybackIcon :item="fromAlbum" icon-class="action-icon"/>
            <ThreeDotIcon :item="fromAlbum" icon-class="dot-icon"/>
          </div>
        </div>

        <div class="bottom-info">
          <div class="d-flex align-center mr-2">
            <div v-if="trackAlbumArtistsLengthsDiffer" class="d-flex align-center">
              <ArtistList :artists="track.album.artists"/>
              <v-icon class="white-circle-separator">mdi-checkbox-blank-circle</v-icon>
            </div>

            <span :class="{'ml-1': trackAlbumArtistsLengthsDiffer}">{{new Date(track.album.release_date).getFullYear()}}</span>
          </div>

          <div class="sub-padding-left no-wrap">
            <span v-if="track.album.numberOfTracks">{{track.album.numberOfTracks}}</span>
            <v-icon v-if="track.album.numberOfTracks && albumDuration" class="white-circle-separator">mdi-checkbox-blank-circle</v-icon>
            <span v-if="albumDuration">{{albumDuration}}</span>
          </div>
        </div>
      </div>

      <TrackList :tracks="overlayTrack.details.albumTracks" :parentId="track.id"/>
    </div>

    <MoreFromArtist v-if="(!track.album || track.album.total_tracks === 1)" :parentItem="overlayTrack" :artist="track.artists[0]"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Mutation} from 'nuxt-property-decorator';
  import {msToDuration, setItemMetaData} from '~/utils/helpers';
  import {UI} from '~/store/constants';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class TrackDetails extends Vue {
    duration = 0;
    overlayTrack;
    multiTrackAlbum = false;
    trackAlbumArtistsLengthsDiffer = false;
    fromAlbum;

    @Prop({required: true})
    track;

    @Mutation('updateOverlayItem', {namespace: UI})
    updateOverlayItem;
    
    @Action('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;

    beforeMount(){
      this.overlayTrack = cloneDeep(this.track);
      const trackDetails = this.overlayTrack.details;

      if(this.track.album){
        setItemMetaData([this.overlayTrack.album]);
        this.albumDuration = msToDuration(trackDetails.albumTracks.reduce((total, track) => total + track.duration_ms, 0));
      }
      
      if(this.track.singleTrack){
        setItemMetaData(trackDetails.artistAlbums);
        setItemMetaData(trackDetails.artistTopTracks);
        setItemMetaData(trackDetails.relatedArtists);
      }

      this.updateOverlayItem(this.overlayTrack);
      this.duration = msToDuration(this.track.duration_ms);
      
      this.multiTrackAlbum = this.track.album && (this.track.album.total_tracks > 1);

      if(this.multiTrackAlbum){
        setItemMetaData(trackDetails.albumTracks);
        trackDetails.albumTracks.forEach(track => track.imgUrl = this.overlayTrack.imgUrl);
        trackDetails.albumTracks.forEach(track => track.fromCollection = [this.overlayTrack.album.uri]);

        this.fromAlbum = {
          ...this.overlayTrack.album,
          details: {
            albumTracks: trackDetails.albumTracks
          }
        };
      }

      this.trackAlbumArtistsLengthsDiffer = this.track.album.artists.length != this.track.artists.length;
    }
  }
</script>

<style lang="scss">
  .from-album-container {
    margin-top: 24px;
    padding: 0px $base-padding;
    font-size: 20px;

    .from-album-info {
      font-size: 26px;
      width: 100%;
      padding: 6px 10px;
      font-weight: 600;
      background-color: $primary-theme-color;
      color: $secondary-theme-color;

      .action-icon {
        color: white !important;
        font-size: 28px !important;
      }

      .dot-icon {
        @extend .action-icon;
        font-size: 20px !important;
      }

      .bottom-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
      }
    }

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
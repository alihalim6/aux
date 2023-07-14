<template>
  <section class="track-details">
    <div class="sub-title-container">
      <div class="secondary-label align-center">
        <ArtistList :artists="track.artists"/>
      </div>

      <div class="sub-padding-left no-wrap">
        <span v-if="!multiTrackAlbum" class="white-space-no-wrap">{{new Date(track.album ? track.album.release_date : track.release_date).getFullYear()}}</span>
        <v-icon v-if="!multiTrackAlbum && duration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        <span v-if="duration">{{duration}}</span>
      </div>
    </div>

    <div class="from-album-container" v-if="multiTrackAlbum">
      <div class="logo-style">FROM:</div>
      
      <div class="d-flex align-start justify-space-between">
        <div v-if="$vuetify.breakpoint.smAndUp" class="from-album-img" :style="`background-image: url(${track.imgUrl.medium || track.imgUrl.large})`" aria-hidden="true"></div>

        <div class="from-album-info">        
          <div class="d-flex justify-space-between mb-3">
            <span>{{track.album.name}}</span>

            <div class="d-flex no-wrap align-center">
              <PlaybackIcon :item="fromAlbum" icon-class="action-icon"/>
              <ThreeDotIcon :item="fromAlbum" icon-class="dot-icon"/>
            </div>
          </div>

          <div class="bottom-info">
            <div v-if="trackAlbumArtistsLengthsDiffer" class="d-flex align-center mr-2">
              <ArtistList :artists="track.album.artists"/>
            </div>

            <div class="sub-padding-left no-wrap ml-auto">
              <span>{{new Date(track.album.release_date).getFullYear()}}</span>
              <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
              <span v-if="track.album.numberOfTracks">{{track.album.numberOfTracks}}</span>
              <v-icon v-if="track.album.numberOfTracks && albumDuration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
              <span v-if="albumDuration">{{albumDuration}}</span>
            </div>
          </div>
        </div>
      </div>

      <TrackList :tracks="track.details.albumTracks" :parentId="track.id"/>
    </div>

    <MoreFromArtist v-if="(!track.album || track.album.total_tracks === 1)" :parentItem="track" :artist="track.artists[0]"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {msToDuration, setItemMetaData} from '~/utils/helpers';

  @Component
  export default class TrackDetails extends Vue {
    duration = 0;
    multiTrackAlbum = false;
    trackAlbumArtistsLengthsDiffer = false;
    fromAlbum;

    @Prop({required: true})
    track;

    beforeMount(){
      const trackDetails = this.track.details;

      if(this.track.album){
        setItemMetaData([this.track.album]);
        this.albumDuration = msToDuration(trackDetails.albumTracks.reduce((total, track) => total + track.duration_ms, 0));
      }
      
      if(this.track.singleTrack){
        setItemMetaData(trackDetails.artistAlbums);
        setItemMetaData(trackDetails.artistTopTracks);
        setItemMetaData(trackDetails.relatedArtists);
      }

      this.duration = msToDuration(this.track.duration_ms);
      this.multiTrackAlbum = this.track.album && (this.track.album.total_tracks > 1);

      if(this.multiTrackAlbum){
        setItemMetaData(trackDetails.albumTracks);

        trackDetails.albumTracks.forEach(track => {
          track.imgUrl = this.track.imgUrl;
          track.fromCollection = [this.track.album.uri];
          track.album = this.track.album;
        });

        this.fromAlbum = {
          ...this.track.album,
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
    margin-top: 36px;
    padding: 0px $base-padding;
    font-size: 20px;

    .from-album-img {
      $size: 81.4px;

      background-size: contain;
      background-position: center;
      max-width: $size;
      height: $size;
      object-fit: cover;
      flex: 1;
      margin-right: 12px;
    }

    .from-album-info {
      flex: 3;
      font-size: 26px;
      width: 100%;
      padding: 6px 10px;
      font-weight: 600;
      background-color: $cream;
      color: $primary-theme-color;
      background-size: cover;
      background-position-y: center;
      background-blend-mode: overlay;

      .action-icon {
        color: $primary-theme-color !important;
        font-size: 28px !important;
      }

      .dot-icon {
        @extend .action-icon;
        font-size: 20px !important;
        margin-left: 6px;
      }

      .bottom-info {
        display: flex;
        align-items: flex-start;
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
<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label align-center">
        <ArtistList :artists="track.artists"/>
        
        <div v-if="!multiTrackAlbum" class="white-space-no-wrap">
          <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
          {{new Date(track.album ? track.album.release_date : track.release_date).getFullYear()}}
        </div>
      </div>

      <div class="sub-padding-left no-wrap">
        <span v-if="duration">{{duration}}</span>
      </div>
    </div>

    <div class="from-album-container" v-if="multiTrackAlbum">
      <div class="font-weight-bold font-italic mb-1">FROM:</div>
      
      <div class="from-album-info" :id="`fromAlbumInfo${track.uuid}`">
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

    mounted(){
      if(this.multiTrackAlbum){
        document.getElementById(`fromAlbumInfo${this.track.uuid}`).style.backgroundImage = `url(${this.track.imgUrl.large})`;
      }
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
      background-color: $cream;
      color: $primary-theme-color;
      background-size: cover;
      background-position-y: center;
      background-blend-mode: overlay;

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
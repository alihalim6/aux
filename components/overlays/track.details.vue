<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label">
        <ArtistList :artists="track.artists"/>
        <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        {{new Date(track.album ? track.album.release_date : track.release_date).getFullYear()}}
      </div>

      <div class="sub-padding-left no-wrap">
        <span v-if="duration">{{duration}}</span>
      </div>
    </div>

    <v-card class="clickable overlay-details-container" elevation="7" v-if="track.album && (track.album.total_tracks > 1)" @click="displayDetailOverlays(overlayTrack.album)">
      <div id="fromAlbumTitle">From <span class="from-title">{{track.album.name}}</span>
        <v-icon small>mdi-arrow-right</v-icon>
      </div>

      <div class="d-flex align-center">
        <v-img class="clickable track-album" :src="overlayTrack.album.imgUrl.medium"></v-img>

        <div class="album-data">
          <div><span class="font-weight-regular">by</span> {{overlayTrack.album.secondaryLabel}}</div>
          <div class="font-weight-regular from-album-tracks">{{track.album.total_tracks}} {{track.album.total_tracks > 1 ? 'Tracks' : 'Track'}}</div>
        </div>
      </div>
    </v-card>

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
      }
      
      if(this.track.singleTrack){
        setItemMetaData(trackDetails.artistAlbums);
        setItemMetaData(trackDetails.artistTopTracks);
        setItemMetaData(trackDetails.relatedArtists);
      }

      this.updateOverlayItem(this.overlayTrack);
      this.duration = msToDuration(this.track.duration_ms);
    }
  }
</script>

<style lang="scss">
  .from-title {
    font-weight: 600;
    text-decoration: underline;
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
</style>
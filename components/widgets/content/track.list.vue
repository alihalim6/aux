<template>
  <section class="track-list-container" :class="{'mixed-track-list': tracksFromDifferentAlbums, 'disable-tracks': disableTracks}">
      <div v-for="(track, index) in tracks.filter(track => track.uuid)" :key="track.uuid">
        <div v-show="parentId !== track.id" class="d-flex justify-space-between align-start pt-3 pb-2 dashed-separator" :class="{'no-bottom-border': (index === tracks.length - 1)}">
          <div class="left-container">
            <v-img v-if="tracksFromDifferentAlbums && track.imgUrl" class="clickable track-album-img" @click="trackImgPressed(track)" :src="track.imgUrl.small"></v-img>
            <div v-else class="track-number">{{track.track_number}}.</div>

            <div class="track-info" :class="{'smaller-track-names': tracksFromDifferentAlbums}">
              <v-hover v-slot="{hover}">
                <div class="d-flex align-start">
                  <span class="clickable track-name" :class="{'lighter-black-color': hover, 'spotify-green-color': trackIsPlaying(track)}" @click.stop="trackNamePressed(track, index)">{{track.name}}</span>  
                  <v-img v-if="newAndRecommended && track.isNew" :src="require('~/assets/new.png')" class="new-icon"></v-img>
                </div>
              </v-hover>

              <div class="track-artists">
                <ArtistList :artists="track.artists"/>
              </div>             
              
              <div class="track-duration">{{track.duration}}</div>

              <div v-if="tracksFromDifferentAlbums && (track.album && track.album.total_tracks > 1) && !hideAlbums" class="track-from-album-container">
                <span class="font-italic">From</span> <div @click.stop="fromAlbumPressed(track.album)" class="clickable font-weight-bold text-decoration-underline track-from-album">
                  {{track.album.name}}</div>
                  <v-icon small class="clickable">mdi-arrow-right</v-icon>
              </div>
            </div>
          </div>

          <ThreeDotIcon :item="track"/>
        </div>
      </div>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Watch, Getter} from 'nuxt-property-decorator';
  import {setDuration, setItemMetaData, isSameTrack} from '~/utils/helpers';
  import {SPOTIFY} from '~/store/constants';

  @Component
  export default class TrackList extends Vue {    
    trackList = [];

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Prop({required: true})
    tracks;

    @Prop()
    parentId;

    @Prop()
    tracksFromDifferentAlbums;
    
    @Prop()
    hideAlbums;

    @Prop()
    newAndRecommended;

    @Prop()
    disableTracks;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Watch('tracks', {
      //needed to ensure all prop tracks get processed (e.g. additional (while loop) tracks in playlist.details don't come thru here otherwise)
      immediate: true
    })
    async tracksChanged(){
      for(const track of this.tracks){
        await setDuration(track);
      }

      //seems to be needed in order to show durations after adding the async call above
      this.$forceUpdate();
    }

    trackImgPressed(track){
      if(this.tracksFromDifferentAlbums){
        this.$nuxt.$root.$emit('displayDetailOverlay', track);
      }
    }

    fromAlbumPressed(album){
      album = setItemMetaData([album])[0];
      this.$nuxt.$root.$emit('displayDetailOverlay', album);
    }

    trackNamePressed(track, index){
      this.togglePlayback({item: {...track, queueIndex: index}, itemSet: this.tracks});
    }

    trackIsPlaying(track){
      return isSameTrack(track, this.currentlyPlayingItem);
    }
  }
</script>

<style lang="scss">
  .track-list-container {
    margin: 18px auto 0px;
    padding: 0px 8px;

    .left-container {
      $track-number-size: 25px;
      $track-img-size: 40px;
      display: flex;

      .track-number {
        min-width: $track-number-size;
        height: $track-number-size;
        color: #aaaaaa;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        padding: 0px 4px;
        margin-right: 10px;
      }

      .track-album-img {
        width: $track-img-size;
        height: $track-img-size;
        margin-right: 10px;
        top: 5px;
      }

      .track-info {
        font-size: 16px;
        color: #333333;
        display: flex;
        flex-direction: column;
        font-weight: bold;
        margin-top: 1px;

        .track-name {
          font-weight: 600;
          word-break: break-word;
        }

        .track-artists {
          font-size: 12px;
          color: #666666;
          font-weight: bold;
        }

        .track-duration {
          color: #999999;
          font-size: 12px;
          margin-top: 4px;
        }

        .track-from-album-container {
          display: flex;
          font-size: 12px;

          .track-from-album {
            padding: 0px 4px;
          }
        }
      }

      .smaller-track-names {
        font-size: 14px;
      }
    }
  }

  .disable-tracks {
    pointer-events: none;
    opacity: 0.5;
  }

  .mixed-track-list {
    margin-top: 0px;
    padding: 0px $base-padding;
  }
</style>
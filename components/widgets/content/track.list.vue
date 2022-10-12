<template>
  <section class="track-list-container" :class="{'mt-0': tracksFromDifferentAlbums}">
<!--     <div v-for="(track, index) in trackList" :key="track.uuid"> -->
    <div v-for="(track, index) in tracks" :key="track.uuid">
      <div v-show="parentId !== track.id" class="d-flex justify-space-between align-start py-2 dashed-separator" :class="{'no-bottom-border': (index === tracks.length - 1)}">
          <div class="left-container">
            <v-img v-if="tracksFromDifferentAlbums" class="clickable track-album-img" @click="trackPressed(track)" :src="track.imgUrl.small"></v-img>
            <div v-else class="track-number">{{track.track_number}}</div>

            <div class="track-info" :class="{'smaller-track-names': tracksFromDifferentAlbums, 'font-weight-bold': displayArtists}">
              <span class="track-name" :class="{'clickable': tracksFromDifferentAlbums}" @click="trackPressed(track)">{{track.name}}</span>  
              <div class="track-artists" v-if="displayArtists">{{track.secondaryLabel}}</div>             
              <div class="track-duration">{{track.duration}}</div>

              <div v-if="tracksFromDifferentAlbums && (track.album && track.album.total_tracks > 1) && !hideAlbums" class="track-from-album-container">
                From <div @click.stop="fromAlbumPressed(track.album)" class="clickable font-weight-bold text-decoration-underline track-from-album">
                  {{track.album.name}}</div>
                  <v-icon small class="clickable">mdi-arrow-right</v-icon>
              </div>
            </div>
          </div>

          <div class="right-container">
            <div class="item-icon-container">
              <PlaybackIcon :item="track" :itemSet="tracks"/>
              <ThreeDotIcon :item="track"/>
            </div>
         </div>
        </div>
      </div>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Watch} from 'nuxt-property-decorator';
  import {msToDuration, setItemMetaData, getItemDuration} from '~/utils/helpers';
  import {UI} from '~/store/constants';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class TrackList extends Vue {    
    trackList = [];

    @Prop({required: true})
    tracks;

    @Prop({required: false})
    parentId;

    @Prop({default: false})
    tracksFromDifferentAlbums;

    @Prop({default: false})
    displayArtists;

    @Prop({default: false})
    hideAlbums;

    @Prop({default: false})
    metaDataSet;

    @Action('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;

    @Watch('tracks', {
      //needed to ensure all prop tracks get processed (e.g. additional (while loop) tracks in playlist.details don't come thru here otherwise)
      immediate: true
    })
    async tracksChanged(){
      //this.trackList = cloneDeep(this.tracks);

      for(const track of this.tracks){
       /*  if(!this.metaDataSet){
          setItemMetaData([track]);

          if(track.album){
            setItemMetaData([track.album]);
          }
        } */

        track.duration_ms = await getItemDuration(track);
        track.duration = msToDuration(track.duration_ms);
      }

      //seems to be needed in order to show durations after adding the async call above
      this.$forceUpdate();
    }

    trackPressed(track){
      if(this.tracksFromDifferentAlbums){
        this.displayDetailOverlays(track);
      }
    }

    fromAlbumPressed(album){
      album = setItemMetaData([album])[0];
      this.displayDetailOverlays(album);
    }
  }
</script>

<style lang="scss">
  .track-list-container {
    margin: 18px auto 0px;
    padding: 0px $base-padding;

    .left-container {
      $track-number-size: 25px;
      $track-img-size: 40px;
      display: flex;

      .track-number {
        border: 2px solid $primary-theme-color;
        min-width: $track-number-size;
        height: $track-number-size;
        color: $primary-theme-color;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        padding: 2px 4px;
        margin-right: 10px;
      }

      .track-album-img {
        width: $track-img-size;
        height: $track-img-size;
        margin-right: 10px;
        top: 6px;
      }

      .track-info {
        font-size: 16px;
        color: #333333;
        display: flex;
        flex-direction: column;

        .track-artists {
          font-weight: normal;
          font-size: 12px;
        }

        .track-duration {
          color: #888888;
          font-size: 12px;
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

    .right-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      min-width: 48px;
    }
  }
</style>
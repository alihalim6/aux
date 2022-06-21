<template>
  <section class="track-list-container" :class="{'mt-0': tracksFromDifferentAlbums}">
    <div v-for="(track, index) in tracks" :key="track.id">
      <div v-if="parentId !== track.id" class="track-container dashed-separator" :class="{'no-bottom-border': (index === tracks.length - 1)}">
          <div class="left-container">
            <div v-if="!tracksFromDifferentAlbums" class="track-number">{{track.track_number}}</div>
            <v-img v-if="tracksFromDifferentAlbums" class="clickable track-album-img" @click="trackPressed(track)" :src="track.imgUrl"></v-img>

            <div class="track-info" :class="{'smaller-track-names': tracksFromDifferentAlbums, 'font-weight-bold': displayArtists}">
              <span class="track-name" :class="{'clickable': tracksFromDifferentAlbums}" @click="trackPressed(track)">{{track.name}}</span>  
              <div class="track-artists" v-if="displayArtists">{{track.secondaryLabel}}</div>             
              <div class="track-duration">{{track.duration}}</div>

              <div v-if="tracksFromDifferentAlbums && (track.album && track.album.total_tracks > 1) && !hideAlbums" class="track-from-album-container">
                From <div @click.stop="displayDetailsOverlay(track.album)" class="clickable font-weight-bold text-decoration-underline track-from-album">
                  {{track.album.name}}</div>
                  <v-icon small class="clickable">mdi-arrow-right</v-icon>
              </div>
            </div>
          </div>

          <div class="right-container">
            <PlaybackIcon :item="track" class="track-list-playback"/>
            <v-icon v-if="!hideLikeability" small class="clickable">mdi-heart-plus-outline</v-icon>
          </div>
        </div>
      </div>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration, setItemMetaData} from '~/utils/helpers';
  import {UI} from '~/store/constants';

  @Component
  export default class TrackList extends Vue {
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
    hideLikeability;

    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;

    trackPressed(track){
      if(this.tracksFromDifferentAlbums){
        this.displayDetailsOverlay(track);
      }
    }

    beforeMount(){
      this.tracks.forEach(track => {
        setItemMetaData([track]);
        track.duration = msToDuration(track.duration_ms);

        if(track.album){
          setItemMetaData([track.album]);
        }
      });
    }
  }
</script>

<style lang="scss">
  .track-list-container {
    margin: 18px auto 0px;
    padding: 0px $base-padding;

    .track-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0px;

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
        min-width: 48px;

        .track-list-playback {
          font-size: 26px;
        }
      }
    }
  }
</style>
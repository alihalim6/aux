<template>
    <section>
      <div class="content-carousel" :class="{'more-from-artist-carosuel': moreFromArtist}">
        <div v-for="(item, index) in data" :key="item.id">
          <v-hover v-slot="{hover}">
            <v-card max-width="175" elevation="10" class="clickable" :class="{'content-hover': hover, 'spaced-content': moreFromArtist}">
              <v-img class="content-img" :src="item.imgUrl" @click="displayDetailsOverlay(item)"></v-img>
              
              <PlaybackIcon 
                :item="item" 
                icon-class="playback-button" 
                :conditional-icon-class="{'last-item-playback-button': (index === data.length - 1) || moreFromArtist}"/>
            </v-card>
          </v-hover>
          
          <div v-if="!moreFromArtist" class="secondary-label" :class="{'artist-secondary-label': item.isArtist}">{{item.secondaryLabel}}</div>
          <div class="primary-label" :class="{'artist-primary-label': item.isArtist, 'more-from-padding': moreFromArtist}">{{item.primaryLabel}}</div>
          <div class="secondary-label bottom-label"><v-icon v-show="item.tracksLabel" class="record-icon" small>mdi-music-circle</v-icon>{{item.tracksLabel}}</div>
        </div>
      </div>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Getter} from 'nuxt-property-decorator';
  import {SPOTIFY, UI} from '~/store/constants';
  
  @Component
  export default class ContentCarousel extends Vue {
    @Prop({required: true})
    data;
  
    @Prop({default: false})
    moreFromArtist;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;

    @Getter('currentlyPlayingItemUri', {namespace: SPOTIFY})
    currentlyPlayingItemUri;

    @Getter('spotifyPlayer', {namespace: SPOTIFY})
    spotifyPlayer;
  }
</script>

<style lang="scss">
  $content-img-size: 275px;

  .content-carousel {
    display: flex;
    overflow: scroll;
    margin-top: 20px;
    $label-left-padding: 6px;

    .content-hover {
      border: 2px solid;
    }

    .spaced-content {
      margin-right: 103px;
    }

    .content-img {
      min-width: $content-img-size;
      min-height: $content-img-size;
      max-height: $content-img-size;
    }

    .playback-button {
      position: absolute !important;
      bottom: -31px;
      right: 8px;
    }

    .last-item-playback-button {
      left: $content-img-size - 40px;
    }    

    $secondary-label-font-size: 12px;
    $primary-label-font-size: 14px;

    .secondary-label {
      font-size: $secondary-label-font-size;
      color: rgba(0,0,0,0.8);
      padding: 10px 8px 4px $label-left-padding;
      width: 150px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    .artist-secondary-label {
      text-overflow: unset;
      white-space: unset;
      overflow: auto;
      font-weight: 600;
      font-size: $primary-label-font-size;
    }

    .primary-label {
      font-size: $primary-label-font-size;
      font-weight: 600;
      padding: 0px $label-left-padding;
    }

    .artist-primary-label {
      @extend .primary-label;
      @extend .artist-secondary-label;
      font-weight: normal;
      font-size: $secondary-label-font-size;
    }

    .more-from-padding {
      padding: 6px 38px 0px 0px;
    }

    .bottom-label {
      padding-top: 6px;
      display: flex;
      align-items: center;

      .record-icon {
        padding-right: 4px;
      }
    }
  }

  .more-from-artist-carosuel {
      margin-top: 6px;
      padding: 0px $base-padding;
  }

  .record-icon {
    color: #ed0000 !important;
  }

  .content-hover {
    z-index: 10;
    margin-top: 2px;
  }
</style>
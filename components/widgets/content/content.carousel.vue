<template>
    <section>
      <div class="content-carousel" :class="{'more-from-artist-carosuel': moreFromArtist, 'vertical-carousel': vertical}" v-scroll.self="scrolled">
        <div v-for="(item, index) in data.filter(item => item.uuid)" :key="item.uuid">
          <section :class="{'d-flex align-center': lastNewAndRecoCarouselItem(index)}">
            <v-hover v-slot="{hover}">
              <div :class="{'d-flex flex-column align-center': item.isArtist}">
                <div v-if="addToPlaylist" class="add-to-playlist-title">{{ item.primaryLabel }}</div>

                <v-img 
                  v-if="item.isArtist" 
                  class="clickable animate content-img artist-img" 
                  :class="{'content-hover': hover && !noHover(index), 'auto-size': vertical, 'min-size': $vuetify.breakpoint.smAndUp}" 
                  :src="carouselImgSrc(item)" 
                  @click="contentImgPressed(item)"
                  @keydown.enter="contentImgPressed(item)"
                  tabindex="0"
                  :alt="`open modal with details about ${item.primaryLabel}`"
                  :transition="false"
                >
                  <template v-slot:placeholder>
                    <span class="content-placeholder">{{item.primaryLabel.substring(0, 1)}}</span>
                  </template>
                </v-img>

                <v-card 
                  v-else
                  elevation="8" 
                  class="clickable animate" 
                  :class="{
                    'content-hover': hover && !vertical && !addToPlaylist && !noHover(index), 
                    'spaced-content': moreFromArtist || addToPlaylist, 
                    'no-max-width': vertical, 
                    'last-item': !vertical && !addToPlaylist && data.length > 1 && (index == data.length - 1),
                    'cursor-auto': addToPlaylist
                  }"
                >
                  <v-img 
                    class="content-img" 
                    :class="{'auto-size': vertical, 'min-size': $vuetify.breakpoint.smAndUp}"
                    :src="carouselImgSrc(item)" 
                    @click="contentImgPressed(item)"
                    @keydown.enter="contentImgPressed(item)"
                    tabindex="0"
                    :alt="`open modal with details about ${item.primaryLabel}`"
                    :transition="false"
                  >
                    <template v-slot:placeholder>
                      <span class="content-placeholder">{{item.primaryLabel.substring(0, 1)}}</span>
                    </template>
                  </v-img>
                </v-card>

                <div v-if="addToPlaylist" class="clickable add-button">
                  <v-icon color="white" large @click="addTrackToPlaylist(item)" aria-label="add track to playlist">mdi-plus</v-icon>
                </div>

                <div :class="{'pb-10 pr-2': vertical, 'd-flex flex-column align-center': item.isArtist}" v-if="!addToPlaylist">
                  <div class="primary-container" 
                    :class="{
                      'hovered-primary-container': hover && !vertical && !item.isArtist && !noHover(index), 
                      'more-from-primary': moreFromArtist
                    }">
                    <div class="d-flex align-start">
                      <button 
                        class="clickable primary-label text-left" 
                        @click.stop="primaryLabelPressed(item)" 
                        :aria-label="`${playable(item) ? 'play' : 'open modal with details about'} ${item.primaryLabel} by ${item.secondaryLabel}`"
                        :class="{
                          'artist-secondary-label': item.isArtist, 
                          'more-from-padding': moreFromArtist, 
                          'lighter-black-color': hover, 
                          'spotify-green-color': itemIsPlaying(item)}"
                        >
                          {{item.primaryLabel}}
                          <span v-if="moreFromArtist && item.explicit" class="explicit">E</span>
                      </button>

                      <v-img v-if="newAndRecommended && item.isNew" :src="require('~/assets/new.png')" class="new-icon" alt=""></v-img>
                    </div>

                    <ThreeDotMenu v-if="!item.isPlaylist" :item="item" :bookmark="bookmarks"/>
                  </div>

                  <span v-if="!moreFromArtist && !noSecondaryLabel" class="secondary-label" :class="{'artist-genres': item.isArtist}" aria-hidden="true">{{item.secondaryLabel}}</span>

                  <div class="secondary-label bottom-label">
                    <v-icon v-if="item.numberOfTracks" class="record-icon" small>mdi-music-circle</v-icon>
                    <span>{{item.numberOfTracks}}</span>
                  </div>
                </div>
              </div>
            </v-hover>
            
            <div v-if="lastNewAndRecoCarouselItem(index)" class="see-all-container">
              <span class="dots">...</span>
              <button class="clickable see-all" @click="$nuxt.$emit('showAllNewAndReco')" aria-label="open modal with all new and recommended tracks, albums and artists">SEE ALL</button>
            </div>
          </section>
        </div>
      </div>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action, Getter} from 'nuxt-property-decorator';
  import {SPOTIFY} from '~/store/constants';
  import {isSameTrack} from '~/utils/helpers';

  @Component
  export default class ContentCarousel extends Vue {
    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Prop({required: true})
    data;
  
    @Prop()
    moreFromArtist;

    @Prop()
    addToPlaylist;

    @Prop()
    vertical;

    @Prop()
    newAndRecommended;

    @Prop()
    noSecondaryLabel;

    @Prop()
    bookmarks;

    @Prop({default: () => null})
    handleScroll;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    playable(item){
      return item.singleTrack || item.isTrack;
    }

    primaryLabelPressed(item){
      if(this.playable(item)){
        this.togglePlayback({item, itemSet: this.data});
      }
      else{
        this.$nuxt.$root.$emit('displayDetailOverlay', item);
      }
    }

    itemIsPlaying(item){
      return isSameTrack(item, this.currentlyPlayingItem);
    }

    carouselImgSrc(item) {
      if(this.addToPlaylist) {
        return item.imgUrl.medium || item.imgUrl.large;
      }

      return item.imgUrl.large;
    }

    addTrackToPlaylist(playlist) {
      this.$nuxt.$emit('addTrackToPlaylist', playlist);
    } 

    contentImgPressed(item){
      if(!this.addToPlaylist){
        this.$nuxt.$root.$emit('displayDetailOverlay', item);
      }
    }

    lastNewAndRecoCarouselItem(index){
      return !this.vertical && this.newAndRecommended && index == this.data.length - 1;
    }

    noHover(){
      return this.bookmarks;
    }

    //can't bind v-scroll directly to prop fn
    scrolled(){
      if(this.handleScroll) this.handleScroll();
    }
  }
</script>

<style lang="scss">
  @import './styles';
  
  $content-img-size: 375px;
  $label-left-padding: 6px;
  $secondary-label-font-size: 12px;
  $primary-label-font-size: 14px;
  $content-img-partial-size: auto;

  .content-carousel {
    display: flex;
    overflow: scroll;
    margin-top: 12px;

    .spaced-content {
      margin-right: 18px;
    }

    .last-item {
      max-width: $content-img-size !important;
    }
 
    .content-img {
      width: $content-img-size;
      height: $content-img-size;
    }

    .secondary-label {
      font-size: $secondary-label-font-size;
      color: #888888;
      font-weight: bold;
      padding: 0px 8px 4px $label-left-padding;
    }

    .artist-secondary-label {
      text-overflow: unset;
      white-space: unset;
      overflow: auto;
      font-weight: 600;
      font-size: $primary-label-font-size;
    }

    .primary-container {
      display: flex;
      align-items: flex-start;
      padding: 18px 0px 4px $label-left-padding;
      justify-content: space-between;

      .primary-label {
        font-size: $primary-label-font-size;
        font-weight: 600;
        padding-top: 2px;
        padding-right: 2px;
      }
    }

    .hovered-primary-container {
      margin-top: 4px;
      width: $content-img-partial-size;
    }

    .more-from-primary {
      max-width: calc(#{$content-img-size} + 4px);
      padding-left: 0;
    }

    .artist-genres {
      @extend .primary-label;
      @extend .artist-secondary-label;
      padding-top: 0px;
      color: #888888;
      font-size: $secondary-label-font-size;
      text-align: center;
    }

    .more-from-padding {
      padding: 6px 52px 0px 0px;
    }

    .bottom-label {
      display: flex;
      align-items: center;
    }
  }

  .more-from-artist-carosuel {
    margin-top: 6px;
    padding: 0px $base-padding;

    .bottom-label {
      padding-left: 0px;
    }
  }

  .vertical-carousel {
    flex-direction: column;
  }
  
  .content-hover {
    z-index: 10;
    transform: scale(1.1) translateY(-8px) translateZ(0);
  }

  .add-to-playlist-title {
    font-size: 16px;
    color: $primary-theme-color;
    font-style: italic;
    text-align: center;
    max-width: $content-img-size;
    padding: 8px;
    font-weight: bold;
    margin-bottom: 12px;
  }

  .add-button {
    background-color: $primary-theme-color;
    border-radius: 100%;
    width: fit-content;
    margin: 18px auto 32px;
  }

  .artist-img {
    border-radius: 100% !important;

    .v-image__image--cover {
      background-size: cover;
    }
  }

  .see-all-container {
    display: flex;
    align-items: center;
    margin: -48px 48px 0px 20px;
  }

  .dots {
    font-size: 28px;
    letter-spacing: 5px;
    color: $primary-theme-color;
    margin-right: 12px;
    position: relative;
    top: -6px;
  }
  
  .see-all {
    border-left: 2px solid $primary-theme-color;
    font-size: 18px;
    color: $secondary-theme-color;
    background-color: $primary-theme-color;
    font-weight: bold;
    border-radius: 20px;
    padding: 8px;
    white-space: nowrap;
  }

  .see-all:hover {
    color: $cream !important;
    background-color: $rose-red !important;
    border-left: 1px solid $rose-red !important;
  }

  .auto-size {
    width: auto !important;
    height: auto !important;
  }

  .min-size {
    min-width: $content-img-size;
    min-height: $content-img-size;
  }

  .animate {
    transition: transform 0.05s;
  }
</style>
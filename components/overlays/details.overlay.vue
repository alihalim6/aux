<template>
  <section>
    <v-dialog :value="detailsOverlay.display" fullscreen transition="fade-transition" persistent>
      <v-carousel hide-delimiters :show-arrows="false" height="100%" :value="detailsOverlay.currentIndex">
          <v-carousel-item v-for="(item, index) in detailsOverlay.items" :key="item.id" transition="fade-transition">                    
            <!-- v-show img so that timing of img then content stays consistent as carousel nav happens -->
            <v-img class="clickable item-image" :src="item.imgUrl" v-show="detailsOverlay.currentIndex === index">
              <div class="full-item-image-cta-outer" @click="displayFullItemImage(item.imgUrl)">
                <v-icon color="white" class="eye">mdi-eye</v-icon>
              </div>

              <div class="content-container overlay-content" @click.stop>
                <div class="inner-container">
                  <div class="inner-image-cta-container">
                    <div class="clickable full-item-image-cta-inner" @click="displayFullItemImage(item.imgUrl)">
                      {{item.isArtist ? 'Photo' : (item.albumType || 'Track') + ' Artwork'}}
                    </div>
                  </div>

                  <div class="overlay-header">
                    <v-icon :class="{'no-visiblity': (index === 0)}" class="back-button" large @click="goBackDetailsOverlay()">mdi-arrow-left</v-icon>
                    <v-icon class="close-button" large @click="closeDetailsOverlay()">mdi-close</v-icon>
                  </div>

                  <div class="section-title overlay-section-title">
                    {{item.name}}
                    <div class="controls-container" :class="{'justify-end': item.isArtist}">
                      <PlaybackIcon :item="item" class="details-overlay-playback-button"/>
                      <!-- TODO -->
                      <v-icon medium class="clickable">mdi-heart-plus-outline</v-icon>
                    </div>
                  </div>

                  <TrackDetails v-if="item.isTrack" :track="item"/>
                  <AlbumDetails v-if="item.isAlbum" :album="item"/>
                  <ArtistDetails v-if="item.isArtist" :artist="item"/>
                </div>
              </div>
            </v-img>
          </v-carousel-item>
        </v-carousel>
    </v-dialog>

    <v-dialog :value="fullItemImage" max-width="824" transition="slide-y-transition" @click:outside="closeFullItemImage()">
      <v-img class="full-item-image" :src="fullItemImage" @click="closeFullItemImage()"></v-img>
    </v-dialog>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Mutation} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

  @Component
  export default class DetailsOverlay extends Vue {
  @Getter('detailsOverlay', {namespace: UI})
  detailsOverlay;
  
  @Getter('fullItemImage', {namespace: UI})
  fullItemImage;
  
  @Mutation('closeDetailsOverlay', {namespace: UI})
  closeDetailsOverlay;
  
  @Mutation('goBackDetailsOverlay', {namespace: UI})
  goBackDetailsOverlay;
  
  @Mutation('displayFullItemImage', {namespace: UI})
  displayFullItemImage;
  
  @Mutation('closeFullItemImage', {namespace: UI})
    closeFullItemImage;
  }
</script>

<style lang="scss">
  $full-image-cta-breakpoint: 850px;

  .item-image {
    max-width: $max-inner-width !important;
    height: 88vh;
    padding: 6px;
    margin: 0 auto;
    border-radius: 4px;
    overflow: visible !important;

    .full-item-image-cta-outer {
      position: absolute;
      height: 60px;
      width: 25px;
      background-color: $primary-theme-color;
      right: -16px;
      top: 53px;
      border-radius: 0px 4px 4px 0px;
      display: flex;
      justify-content: center;
      border: 2px solid $primary-theme-color;

      .eye {
        transform: rotate(90deg);
      }

      @media (max-width: $full-image-cta-breakpoint) {
        display: none;
      }
    }

    .overlay-content {
      cursor: auto;
      opacity: 0;
      border: unset;
      position: relative;
      width: fill-available;
      height: 100%;
      background-color: white;
      max-width: unset;
      border: 2px solid $secondary-theme-color;
      border-radius: 4px;
      animation-name: fade-in;
      animation-duration: 675ms;
      animation-timing-function: ease;
      animation-delay: 560ms;
      animation-fill-mode: forwards;
      overflow: scroll;

      @keyframes fade-in {
        to {opacity: 1;}
      }

      .inner-container {
        max-width: $max-inner-width;
        padding: $base-padding;
        margin: 0 auto;
        width: fill-available;

        .inner-image-cta-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: fit-content;
          margin: 0 auto;

          .full-item-image-cta-inner {
            @extend .full-item-image-cta-outer;

            position: unset;
            display: none;
            background-color: $secondary-theme-color;
            color: $primary-theme-color;
            padding: 8px;
            border-radius: 4px;
            right: 30px;
            top: 12px;
            font-weight: 600;
            font-size: 12px;
            width: max-content;
            height: auto;
            
            @media (max-width: $full-image-cta-breakpoint) {
              display: unset;
            }
          }
        }

        .overlay-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0px 8px;

          @media (max-width: $full-image-cta-breakpoint) {
            padding-top: 8px;
          }

          .overlay-button {
            color: $primary-theme-color !important;
          }

          .back-button {
            @extend .overlay-button;
          }

          .close-button {
            @extend .overlay-button;
          }
        }

        .overlay-section-title {
          padding: 16px $base-padding 8px;
          font-size: 26px;
          display: flex;
          justify-content: space-between;
          font-weight: 600;

          .controls-container {
            min-width: 80px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 6px;

            .details-overlay-playback-button {
              font-size: 40px;
            }
          }
        }
      }
    }
  }

  .full-item-image {
    width: fit-content;
    margin: 0 auto;
  }
</style>
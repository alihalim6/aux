<template>
  <section>
    <v-dialog :value="display" fullscreen transition="fade-transition" persistent :no-click-animation="true">
      <v-carousel hide-delimiters :show-arrows="false" height="100%" :value="currentIndex" :touchless="true">
          <v-carousel-item v-for="(item, index) in items" :key="item.overlayId">        
            <!-- v-show so that timing of img then content stays consistent as carousel nav happens -->
            <v-img class="clickable item-image" :src="item.imgUrl.large" v-show="(item.simpleOverlay || item.imgUrl) && currentIndex === index">
              <div v-if="!item.details" class="loading-container">
                <div class="blurred loading"></div>
              </div>            

              <div class="full-item-image-cta-outer" @click="() => fullItemImage = item.imgUrl.large" v-if="item.imgUrl.large && item.details && !item.simpleOverlay">
                <v-icon color="white" class="eye">mdi-eye</v-icon>
              </div>

              <div class="overlay-content fill-available" :id="`overlayContent${index}`" :class="{'simple-overlay': item.simpleOverlay, 'content-loaded': item.details}" @click.stop>
                <div class="inner-container" v-if="item.details">
                  <div v-if="scrolledDown" class="scrolled-down-top-bar blurred">
                    <v-icon :class="{'no-visibility': (index === 0)}" aria-label="back to previous page" class="back-button" large @click="goBack()">mdi-arrow-left</v-icon>
                    <v-icon class="close-button" large @click="closeOverlays()" aria-label="close page">mdi-close</v-icon>
                  </div>

                  <div class="inner-image-cta-container" v-if="item.imgUrl.large && !item.simpleOverlay">
                    <div class="clickable full-item-image-cta-inner" @click="() => fullItemImage = item.imgUrl.large">
                      {{item.isArtist ? 'PHOTO' : (item.albumType || 'TRACK') + ' ARTWORK'}}
                    </div>
                  </div>

                  <div class="d-flex justify-space-between align-center py-2">
                    <v-icon :class="{'no-visibility': (index === 0)}" aria-label="back to previous page" class="back-button" large @click="goBack()">mdi-arrow-left</v-icon>
                    <v-icon class="close-button" large @click="closeOverlays()" aria-label="close page">mdi-close</v-icon>
                  </div>

                  <div class="section-title overlay-section-title" :class="{'simple-overlay-title': item.simpleOverlay}">
                    {{item.name}}
                    
                    <div class="controls-container" :class="{'justify-end': item.isArtist}" v-if="!item.simpleOverlay">
                      <div class="item-icon-container">
                        <PlaybackIcon :item="item" icon-class="details-overlay-playback-button"/>
                        <ThreeDotIcon :item="item" icon-class="details-overlay-dots-button"/>
                      </div>
                    </div>
                  </div>

                  <LazyAllNewAndRecommended v-if="item.allNewAndRecommended" :data="item.data"/>
                  <LazyNewReleases v-if="item.newReleases" :data="item.data"/>
                  <LazyTrackDetails v-if="item.isTrack" :track="item"/>
                  <LazyAlbumDetails v-if="item.isAlbum" :album="item"/>
                  <LazyArtistDetails v-if="item.isArtist" :artist="item"/>
                  <LazyPlaylistDetails v-if="item.isPlaylist" :playlist="item"/>
                </div>
              </div>
            </v-img>

            <BackToTop v-if="item.details" :elementId="`overlayContent${index}`"/>
          </v-carousel-item>
        </v-carousel>
    </v-dialog>

    <v-dialog :value="fullItemImage" max-width="824" transition="slide-y-transition" @click:outside="fullItemImageClose()">
      <v-img class="full-item-image fill-available" :src="fullItemImage" @click.stop="fullItemImageClose()"></v-img>
    </v-dialog>
  </section>
</template>

<script>
  import {Component, Vue, Mutation} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';
  import artist from '~/api/artist';
  import details from '~/api/details';
  import {setItemMetaData, setDuration} from '~/utils/helpers';
  import {v4 as uuid} from 'uuid';

  @Component
  export default class DetailOverlays extends Vue {
    scrolledDown = false;
    items = [];
    display = false;
    currentIndex = -1;
    fullItemImage = '';
    processing = false;
    
    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    beforeMount(){
      this.$nuxt.$root.$on('scrolledDown', scrolledDown => this.scrolledDown = scrolledDown);
      this.$nuxt.$root.$on('displayDetailOverlays', this.displayDetailOverlays);
      this.$nuxt.$root.$on('closeOverlays', this.closeOverlays);
      
      this.$nuxt.$root.$on('displayArtistDetails', async ({id}) => {
        const artistDetails = await artist(id);
    
        const artistToDisplay = {
          ...artistDetails,
          images: artistDetails.images,
          genres: artistDetails.genres
        };
        
        this.displayDetailOverlays(setItemMetaData([artistToDisplay])[0]);
      });
    }

    async displayDetailOverlays(item){
      if(!this.processing){//TODO: multiple event hits
        this.processing = true;

        let detailsResponse = {};
        await setDuration(item);

        this.items = [...this.items, {...item, overlayId: uuid()}];//needs to be 'overlayId' since child at least one child component (playlists) uses 'id' internally
        this.currentIndex++;
        this.display = true;

        if(!item.data){
          const itemId = (item.isTrack ? item.album.id : item.id);
          detailsResponse = await details(item, itemId);
        }

        this.items[this.items.length - 1].details = detailsResponse || item.data;
        this.$forceUpdate();
        this.closeFeed();
        this.scrolledDown = false;
        this.processing = false;
      }
    }

    fullItemImageClose(){
      this.fullItemImage = '';

      //prevent background scroll from being enabled on close of full item image
      document.documentElement.style.overflowY = 'hidden';
    }

    goBack(){
      this.items.splice(this.currentIndex, 1);
      this.currentIndex--;
      this.scrolledDown = false;
    }


    closeOverlays(){
      this.items = [];
      this.display = false;
      this.currentIndex = -1;

      //re-enable scroll
      document.documentElement.style.overflowY = '';
    }
  }
</script>

<style lang="scss">
  @import '~/styles/simple-styles.scss';
  
  $full-image-cta-breakpoint: 850px;

  .item-image {
    max-width: $max-inner-width !important;
    height: 100%;
    padding: $overlay-border-size;
    margin: 0 auto;
    border-radius: 4px;
    overflow: visible !important;

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      height: 100%;
      
      .loading {
        animation-name: oscillate-loading;
        animation-duration: 1s;
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        width: 50%;
        height: 23px;
      }

      @keyframes oscillate-loading {
        0% {transform: translateX(0);}
        50% {transform: translateX(100%);} 
        100% {transform: translateX(0);} 
      }
    }

    .full-item-image-cta-outer {
      position: absolute;
      height: 60px;
      width: 25px;
      background-color: $primary-theme-color;
      right: -21px;
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
      height: 100%;
      background-color: transparent;
      max-width: unset;
      border: 2px solid $secondary-theme-color;
      border-radius: 4px;
      overflow: scroll;

      .inner-container {
        max-width: $max-inner-width;
        padding: $base-padding;
        margin: 0 auto;
        width: stretch;

        .scrolled-down-top-bar {
          max-width: $max-inner-width;
          position: sticky;
          padding: 4px 0px;
          width: 100%;
          z-index: 30;
          top: 0;
          left: 0;
          display: flex;
          justify-content: space-between;
        }
        
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
            background-color: $primary-theme-color;
            color: $secondary-theme-color;
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
        
        .overlay-section-title {
          padding: 16px $base-padding 8px;
          font-size: 26px;
          display: flex;
          justify-content: space-between;
          font-weight: 600;

          .controls-container {
            $playback-size: 40px;
            $dots-size: 28px;

            min-width: 80px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 6px;

            .action-button {
              right: -$base-padding;
            }

            .details-overlay-playback-button {
              @extend .action-button;
              font-size: $playback-size;
            }

            .details-overlay-playback-button:hover {
              font-size: $playback-size + 2px;
            }

            .details-overlay-dots-button {
              @extend .action-button;
              font-size: $dots-size !important;
              padding-top: 6px;
            }

            .details-overlay-dots-button:hover {
              font-size: $dots-size + 2px !important;
            }
          }
        }
      }
    }

    .content-loaded {
      background-color: white;
      animation-name: fade-in;
      animation-duration: 655ms;
      animation-timing-function: ease;
      animation-delay: 350ms;
      animation-fill-mode: forwards;
    }

    @keyframes fade-in {
      to {opacity: 1;}
    }

    .simple-overlay {
      @extend .no-animation;
      opacity: 1;
    }
  }

  .full-item-image {
    margin: 0 auto;
  }
</style>
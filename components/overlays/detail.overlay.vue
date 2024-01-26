<template>
  <section>
    <v-dialog :value="display" fullscreen transition="fade-transition" persistent :no-click-animation="true" content-class="detail-overlay">
      <v-carousel hide-delimiters :show-arrows="false" height="100%" :value="currentIndex" :touchless="true">
          <v-carousel-item v-for="(item, index) in items" :key="item.overlayId">        
            <!-- v-show so that timing of img then content stays consistent as carousel nav happens -->
            <v-img class="clickable item-image" :src="item.imgUrl.large" v-show="currentIndex === index" alt="">
              <div v-show="!item.details" class="oscillating-loading-container">
                <div class="blurred loading"></div>
              </div>            

              <div v-if="item.imgUrl.large && item.details && !item.simpleOverlay" class="full-item-image-cta-outer" @click="() => fullItemImage = item.imgUrl.large">
                <v-icon color="white" small class="eye">mdi-eye</v-icon>
              </div>

              <div 
                class="overlay-content fill-available" 
                :id="`overlayContent${index}`" 
                :class="{'simple-overlay': item.simpleOverlay, 'content-loaded': item.details}" 
                @click.stop
                v-scroll.self="overlayScrolled"
              >
                <div class="inner-container" v-if="item.details" :class="{'extra-padding-bottom': item.isPlaylist || item.allNewAndRecommended}">
                  <div v-if="scrolledDown" class="scrolled-down-top-bar blurred">
                    <v-icon 
                      :class="{'no-visibility': hideBackButton(index)}" 
                      aria-label="back to previous overlay" 
                      :aria-hidden="hideBackButton(index)"
                      class="back-button" 
                      large 
                      @click="goBack()"
                    >
                      mdi-arrow-left
                    </v-icon>

                    <v-icon class="close-button" large @click="closeOverlay()" aria-label="close overlay">mdi-close</v-icon>
                  </div>

                  <div class="inner-image-cta-container" v-if="item.imgUrl.large && !item.simpleOverlay && item.isTrack">
                    <div class="clickable full-item-image-cta-inner" @click="() => fullItemImage = item.imgUrl.large">
                      {{(item.albumType || 'TRACK') + ' ARTWORK'}}
                    </div>
                  </div>

                  <div class="d-flex justify-space-between align-center py-2">
                    <v-icon 
                      :class="{'no-visibility': hideBackButton(index)}" 
                      aria-label="back to previous overlay"
                      :aria-hidden="hideBackButton(index)"
                      class="back-button overlay-button" 
                      large 
                      @click="goBack()"
                    >
                      mdi-arrow-left
                    </v-icon>

                    <div class="spotify-logo">
                      <v-img 
                        @click="spotifyLogoPressed(item)" 
                        @keydown.enter="spotifyLogoPressed(item)" 
                        :class="{'spotify-icon': $vuetify.breakpoint.xs, 'spotify-full': $vuetify.breakpoint.smAndUp, 'clickable': !item.simpleOverlay}" 
                        :src="require(`~/assets/Spotify_Logo_${$vuetify.breakpoint.smAndUp ? 'Full' : 'Icon'}.png`)"
                        :alt="`open ${item.name} on Spotify`"
                        tabindex="0"
                      >
                      </v-img>
                    </div>

                    <v-icon class="close-button overlay-button" large @click="closeOverlay()" aria-label="close modal">mdi-close</v-icon>
                  </div>

                  <div class="section-title overlay-section-title" :class="{'simple-overlay-title': item.simpleOverlay}">
                    <div @click="() => fullItemImage = item.imgUrl.large" class="album-img" v-if="showArtworkInTitle(item)" :style="`background-image: url(${item.imgUrl.medium ?? item.imgUrl.large})`" aria-hidden="true"></div>
                    <span :class="{'logo-style album-title': showArtworkInTitle(item)}">{{item.name}}</span>
                    
                    <div class="controls-container" :class="{'justify-end': item.isArtist}" v-if="!item.simpleOverlay">
                      <div class="d-flex justify-space-between align-start">
                        <PlaybackIcon :item="item" icon-class="detail-overlay-playback-button"/>
                        <ThreeDotMenu :item="item" icon-class="detail-overlay-dots-button" :detail-overlay="true" :disable-shuffle="disableShuffle"/>
                      </div>
                    </div>
                  </div>

                  <LazyAllNewAndRecommended v-if="item.allNewAndRecommended" :data="item.data"/>
                  <LazyNewReleases v-if="item.newReleases"/>
                  <LazyTrackDetails v-if="item.isTrack" :track="item"/>
                  <LazyAlbumDetails v-if="item.isAlbum" :album="item"/>
                  <LazyArtistDetails v-if="item.isArtist" :artist="item" :toggle-full-image="() => fullItemImage = item.imgUrl.large"/>
                  <LazyPlaylistDetails v-if="item.isPlaylist" :playlist="item"/>
                </div>
              </div>
            </v-img>

            <BackToTop v-if="item.details" :elementId="`overlayContent${index}`"/>
          </v-carousel-item>
        </v-carousel>
    </v-dialog>

    <v-dialog content-class="pa-0" :value="fullItemImage" max-width="824" transition="slide-y-transition" @click:outside="fullItemImageClose()" aria-hidden="true">
      <v-img class="full-item-image fill-available" :src="fullItemImage" @click.stop="fullItemImageClose()"></v-img>
    </v-dialog>
  </section>
</template>

<script>
  import {Component, Vue, Mutation, Action} from 'nuxt-property-decorator';
  import {UI, SPOTIFY} from '~/store/constants';
  import artist from '~/api/artist';
  import details from '~/api/details';
  import {setItemMetaData, setDuration, handleItemCollection, getMoreTracksForQueue} from '~/utils/helpers';
  import {v4 as uuid} from 'uuid';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class DetailOverlay extends Vue {
    scrolledDown = false;
    items = [];
    display = false;
    currentIndex = -1;
    fullItemImage = '';
    processing = false;
    isAndroid = false;
    upNextDisplaying = false;
    disableShuffle = false;
    
    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    @Action('openItemInSpotify', {namespace: SPOTIFY})
    openItemInSpotify;

    beforeMount(){
      this.$nuxt.$root.$on('scrolledDown', scrolledDown => this.scrolledDown = scrolledDown);
      this.$nuxt.$root.$on('displayDetailOverlay', this.displayDetailOverlay);
      this.$nuxt.$root.$on('closeOverlay', this.closeOverlay);
      
      this.$nuxt.$root.$on('displayArtistDetails', async ({id}) => {
        const artistDetails = await artist(id);
    
        const artistToDisplay = {
          ...artistDetails,
          images: artistDetails.images,
          genres: artistDetails.genres
        };
        
        this.displayDetailOverlay(setItemMetaData([artistToDisplay])[0]);
      });

      var ua = navigator.userAgent.toLowerCase();
      this.isAndroid = ua.indexOf('android') > -1;

      this.$nuxt.$root.$on('upNextDisplaying', displaying => this.upNextDisplaying = displaying);

      window.addEventListener('popstate', () => {
        if(!this.upNextDisplaying && this.display){
          if(this.items.length > 1){
            this.goBack();
          }
          else{
            this.closeOverlay();
          }
        }
      });
    }

    async displayDetailOverlay(itemToDisplay){
      this.fullItemImageClose();

      if(!this.processing){
        this.processing = true;
        const item = cloneDeep(itemToDisplay);

        let detailsResponse = {};
        const itemDetails = item.data || item.details;
        await setDuration(item);

        this.items = [...this.items, {...item, overlayId: uuid()}];//needs to be 'overlayId' since child at least one child component (playlists) uses 'id' internally
        this.currentIndex++;
        this.display = true;

        if(!itemDetails){
          const itemId = (item.isTrack && item.album ? item.album.id : item.id);
          detailsResponse = await details(item, itemId);
        }

        this.items[this.items.length - 1].details = itemDetails || detailsResponse;
        this.$forceUpdate();
        this.closeFeed();
        this.scrolledDown = false;
        this.processing = false;

        history.pushState({}, '');
        const overlayDetails = this.items[this.items.length - 1].details;
        const incompletePlaylist = item.isPlaylist && overlayDetails.collectionTrackLimit < overlayDetails.totalPlaylistTracks;
        this.disableShuffle = incompletePlaylist;

        if(incompletePlaylist){
          getMoreTracksForQueue({
            totalTracks: overlayDetails.totalPlaylistTracks, 
            url: `/playlists/${item.id}`, 
            itemOffset: overlayDetails.collectionTrackLimit
          }).then(({tracks, allTracksFetched}) => {
            tracks.forEach(track => handleItemCollection(track, item.uri));
            
            if(allTracksFetched){
              overlayDetails.playlistTracks.push.apply(overlayDetails.playlistTracks, tracks);
              overlayDetails.preShuffledTracks = [...overlayDetails.playlistTracks];
              overlayDetails.allTracksFetched = true;
            }
            else{
              overlayDetails.preShuffledTracks = tracks;
            }

            //console.log(tracks);
            this.disableShuffle = false;
          });
        }

        this.$nuxt.$emit('activatePlayer');
      }
    }

    fullItemImageClose(){
      this.fullItemImage = '';

      //prevent background scroll from being enabled on close of full item image
      document.documentElement.style.overflowY = 'hidden';
    }

    goBack(){
      this.fullItemImageClose();
      this.items.splice(this.currentIndex, 1);
      this.currentIndex--;
      this.scrolledDown = false;
    }


    closeOverlay(){
      this.fullItemImageClose();
      this.items = [];
      this.display = false;
      this.currentIndex = -1;

      //re-enable scroll
      document.documentElement.style.overflowY = '';
    }

    spotifyLogoPressed(item){
      if(!item.simpleOverlay){
        this.openItemInSpotify(item);
      }
    }

    hideBackButton(index){
      return (index === 0) || this.isAndroid;
    }

    overlayScrolled(e){
      this.$nuxt.$root.$emit('overlayScrolled', e);
    }

    showArtworkInTitle(item) {
      console.log(item)
      return item.isCollection || (item.album && item.album.total_tracks === 1);
    }

    beforeDestroy(){
      this.$nuxt.$root.$off('scrolledDown');
      this.$nuxt.$root.$off('displayDetailOverlay');
      this.$nuxt.$root.$off('closeOverlay');
      this.$nuxt.$root.$off('displayArtistDetails');
    }
  }
</script>

<style lang="scss">
  @import './styles';
  @import '~/components/styles';
  @import '~/styles/globals';

  $full-image-cta-breakpoint: 850px;
  $overlay-width: calc(#{$max-inner-width} - 175px);

  .item-image {
    max-width: $overlay-width !important;
    height: 100%;
    margin: 0 auto;
    border-radius: 4px;
    overflow: visible !important;

    .v-image__image--cover {
      background-size: contain;
    }

    .full-item-image-cta-outer {
      position: absolute;
      height: 48px;
      width: 25px;
      background-color: $primary-theme-color;
      right: -25px;
      top: 78px;
      border-radius: 0px 4px 4px 0px;
      display: flex;
      justify-content: center;
      border: 2px solid $primary-theme-color;

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
      overflow: scroll;
      border-radius: 8px;

      .inner-container {
        max-width: $overlay-width;
        padding: 0px $base-padding $base-padding;
        margin: 0 auto;
        width: -webkit-fill-available;

        .scrolled-down-top-bar {
          max-width: $overlay-width;
          position: sticky;
          padding: 4px 0;
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
            border-radius: 3px;
            right: 25px;
            top: 12px;
            font-weight: 600;
            font-size: 12px;
            width: max-content;
            height: auto;
            margin-bottom: 12px;
            
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

        .overlay-button:focus-visible {
          @extend .focused;
        }

        .album-img {
          $size: 81.4px;

          background-size: contain;
          background-position: center;
          max-width: $size;
          min-width: $size;
          height: $size;
          object-fit: cover;
          flex: 1;
          margin-right: 28px;
        }
              
        .overlay-section-title {
          padding: 16px $base-padding 8px;
          font-size: 26px;
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          margin-bottom: 6px;

          .controls-container {
            $playback-size: 40px;
            $dots-size: 28px;

            min-width: 80px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 6px;
            align-self: flex-start;

            .action-button {
              right: -$base-padding;
            }

            .detail-overlay-playback-button {
              @extend .action-button;
              font-size: $playback-size;
            }

            .detail-overlay-playback-button:hover {
              font-size: $playback-size + 2px;
            }

            .detail-overlay-dots-button {
              @extend .action-button;
              font-size: $dots-size !important;
              padding-top: 6px;
              margin-left: 6px;
            }

            .detail-overlay-dots-button:hover {
              font-size: $dots-size + 2px !important;
            }
          }
        }
      }

      .secondary-label {
        max-width: 300px;
      }
    }

    .content-loaded {
      @extend .fade-in-animation;
      background-color: white;
    }

    .simple-overlay {
      animation: none !important;
      opacity: 1;
    }
  }

  .full-item-image {
    margin: 0 auto;
  }

  .spotify-logo {
    padding: $base-padding;
  }

  .spotify-logo:focus-visible {
    @extend .focused;
  }

  .extra-padding-bottom {
    padding-bottom: 104px !important;
  }

  .album-title {
    max-width: 320px;
    flex: auto;
    text-align: center;
    height: fit-content;
    transform: none !important;

    @media (max-width: $device-size-threshold) {
      font-size: 18px;
    }
  }
</style>
<template>
  <section id="searchContainer" :class="{'searching': showSearchResults}" v-click-outside="blurred" @keydown.esc="blurred()">
    <!-- LARGER SCREENS -->
    <div class="hidden block-display" id="largeInputLabel">search Spotify content</div>
    
    <v-text-field 
      dense 
      hide-details="auto" 
      class="search-input search-field" 
      color="black"
      v-model="query"
      clearable
      :maxlength="maxLength"
      @focus="focused()"
      @keydown.tab="tabToSearchResults()"
      @click:clear="results = []"
      aria-labelledby="largeInputLabel"
    >
    <!--  -->
      
      <template v-slot:prepend>
        <div class="hidden block-display" id="smallInputLabel">search Spotify content</div>

        <!-- SMALLER SCREENS -->
        <v-text-field 
          dense 
          hide-details="auto" 
          class="device-search-input search-field" 
          color="white"
          v-model="query"
          clearable
          :maxlength="maxLength"
          @focus="focused()"
          dark
          @click:clear="results = []"
          aria-labelledby="smallInputLabel"
        >
        </v-text-field>
        <!--  -->

        <div class="d-flex align-center justify-space-between width-100" @keydown.esc="blurred()">
          <button 
            v-for="(filter, index) in filters" 
            :key="filter.label" 
            tabindex="0"
            :aria-label="`set search category to: ${filter.label}`"
            @click.stop="filterPressed(filter)"
            @keydown.enter="filterPressed(filter)"
            class="clickable filter" 
            :class="{'selected-filter': filterType == filter.type, 'first-filter': index == 0}"
          >
            {{filter.label}}
          </button>
        </div>

        <div v-if="validQuery() && !loadingResults && !results.length" class="result-message">Couldn't find anything for that search. Do try again, ya hear?</div>
        <div v-if="!loadingResults && !validQuery()" class="result-message"><div>Ready when you are.</div><div>3 character minumum.</div></div>

        <div v-if="loadingResults" class="oscillating-loading-container">
          <div class="white-background loading mt-12 mb-8"></div>
        </div>      

        <div class="d-flex justify-space-between my-8" v-for="item in results" :key="item.id" :class="{'track-playing': isTrackPlaying(item)}">
          <div class="d-flex" :class="{'align-center': !item.isMultitrackAlbum, 'align-start': item.isMultitrackAlbum}">
            <v-img 
              class="clickable result-img" 
              v-if="itemImg(item)" :src="itemImg(item)" 
              @click.stop="displaySearchResultDetails(item)" 
              @keydown.stop.enter="displaySearchResultDetails(item)" 
              tabindex="0"
              :alt="`open modal with details about ${item.primaryLabel}`"
            >
              <template v-slot:placeholder>
                <span class="small-content-placeholder">{{item.name.substring(0, 1)}}</span>
              </template>
            </v-img>

            <div class="d-flex flex-column">
              <button 
                class="clickable result-name" 
                @click.stop="primaryLabelPressed(item)" 
                @keydown.stop.enter="primaryLabelPressed(item)" 
                tabindex="0"
                :aria-label="`${item.isCollection ? 'view details for' : 'play'} ${item.primaryLabel} by ${item.secondaryLabel}`"
              >
                {{item.primaryLabel}}<span class="track-artists" v-if="secondaryLabel(item)"> / {{secondaryLabel(item)}}</span><span v-if="item.explicit" class="explicit">E</span>
              </button>

              <div v-if="item.isMultitrackAlbum" class="mt-2">
                <v-icon class="number-of-tracks-icon" small>mdi-music-circle</v-icon>
                <span class="number-of-tracks">{{item.numberOfTracks}}</span>
              </div>
            </div>
          </div>

          <ThreeDotIcon v-if="!item.isPlaylist" :item="item" iconColor="white"/>
        </div>

        <BackToTop v-if="searchResultsId" :elementId="searchResultsId" arrowColor="white"/>
      </template>

      <template v-slot:append>
        <v-icon v-show="!query" color="#191414">mdi-magnify</v-icon>
      </template>
    </v-text-field>

    <v-icon class="clickable search-icon" @click="searchIconPressed()" aria-label="search Spotify content">mdi-magnify</v-icon>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Action, Watch, Mutation} from 'nuxt-property-decorator';
  import debounce from 'lodash.debounce';
  import search from '~/api/search';
  import {handleApiError} from '~/api/_utils';
  import {setItemMetaData, isSameTrack} from '~/utils/helpers';
  import {SPOTIFY, UI, PLAYBACK_QUEUE} from '~/store/constants';
  import spotify from '~/api/spotify';

  @Component
  export default class Search extends Vue {
    query = '';
    showSearchResults = false;
    loadingResults = false;
    results = [];
    filterType = 'track';
    filters = [{label: 'tracks', type: 'track'}, {label: 'albums', type: 'album'}, {label: 'playlists', type: 'playlist'}, {label: 'artists', type: 'artist'}];
    searchResultsId = '';
    maxLength = 30;

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Action('togglePlayback', {namespace: SPOTIFY})
    togglePlayback;

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;

    @Watch('filterType')
    queryChanged;

    @Watch('query')
    queryChanged(){
      if(this.query && this.query.trim()){
        this.loadingResults = true;
        this.callSearchApi();
      }
    }

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    created(){
      this.callSearchApi = debounce(async () => {
        if(this.validQuery()){
          try{
            const data = await search(this.query, this.filterType);
            const {tracks, albums} = data;
            const tracksOrAlbums = this.filterType == 'track' || this.filterType == 'album';

            if(tracksOrAlbums){
              this.results = setItemMetaData([...tracks.items, ...albums.items]).filter(item => {
                return this.filterType == 'track' ? (item.singleTrack || item.trackFromAlbum) : item.isCollection;
              });
            }
            else {
              const currentFilter = this.filters.find(filter => filter.type == this.filterType);
              this.results = setItemMetaData(data[currentFilter.label].items);
            }

            this.loadingResults = false;

            if(tracksOrAlbums) {
              this.results = await Promise.all(this.results.map(async searchResult => {
                if(searchResult.isCollection) {
                  try{
                    const {items} = await spotify({url: `/albums/${searchResult.id}/tracks`});
                    searchResult.explicit = !!items.find(item => item.explicit);
                  }
                  catch(error){
                    //console.error(`failed to get tracks for searched albums to mark appropriate ones as explicit: ${error}`);
                  }
                }

                return searchResult;
              }));
            }
          }
          catch(error){
            handleApiError('Ran into an issue while searching lorem ipsum...');
            this.loadingResults = false;
          }
        }
        else{
          this.results = [];
          this.loadingResults = false;
        }
      }, 250);
    }

    mounted(){
      const resultsElement = document.querySelector('.v-input__prepend-outer');
      this.searchResultsId = 'searchResults';
      resultsElement.setAttribute('id', this.searchResultsId);
    }

    validQuery(){
      return this.query && !!this.query && this.query.trim().length >= 3;
    }

    isTrackPlaying(item){
      return isSameTrack(item, this.currentlyPlayingItem);
    }

    secondaryLabel(item){
      return item.isPlaylist ? item.numberOfTracks : item.secondaryLabel;
    }

    blurred(){
      this.showSearchResults = false;
    }

    focused(){
      this.closeFeed();
      this.showSearchResults = true;
    }

    async searchIconPressed(){
      this.closeFeed();
      this.showSearchResults = !this.showSearchResults;
      await this.$nextTick();

      if(this.showSearchResults){
        this.focus();
      }
    }

    filterPressed(filter){
      this.filterType = filter.type;
      this.focus();
    }

    focus(){
      const inputContainer = document.querySelector('.device-search-input');
      const inputField = inputContainer.querySelector('input');

      if(inputField){
        inputField.focus();
      }
    }

    primaryLabelPressed(item){
      if(item.isCollection || item.isArtist){
        this.$nuxt.$root.$emit('displayDetailOverlay', item);
      }
      else{
        this.playTrackNow(item);
      }
    }

    itemImg(item){
      return item.imgUrl.small || item.imgUrl.large;
    }

    //has issue (doesn't tab to tracks after first time)
    async tabToSearchResults(){
      if(this.showSearchResults){
        const filters = document.getElementsByClassName('first-filter');

        if(filters.length){
          await this.$nextTick();
          filters[0].focus();
        }
      }
    }

    displaySearchResultDetails(item){
      this.$nuxt.$root.$emit('displayDetailOverlay', item);
    }
  }
</script>

<style lang="scss">    
  #searchContainer {
    margin-top: 12px;
    max-width: 78px;

    @media(min-width: $device-size-threshold){
      margin-top: 16px;
      position: relative;
    }

    .v-input__prepend-outer {
      display: none;
      opacity: 0;
    }

    .search-field {
      input {
        font-weight: bold;
        font-size: 14px;
        color: black;
      }

      .v-input__control > .v-input__slot:before {
        border-width: 1px;
        border-color: $primary-theme-color;
      }
    }
  }

  #searchContainer.searching {  
    .v-input__prepend-outer, .search-results {
      @extend .fade-in-animation;
      animation-duration: 150ms;
      animation-delay: 0s;
      display: block;
      background-color: $primary-theme-color;
      color: $secondary-theme-color;
      font-weight: bold;
      border-radius: 4px;
      font-size: 14px;
      padding: $base-padding;
      left: 0px;
      top: 60px;
      max-height: 500px;
      width: 100%;
      overflow: scroll;
      position: absolute;
      box-shadow: 0px 4px 5px -2px rgb(0 0 0 / 20%), 0px 7px 10px 1px rgb(0 0 0 / 14%), 0px 2px 16px 1px rgb(0 0 0 / 12%);
      z-index: 400;

      @media(min-width: $device-size-threshold){
        max-height: 400px;
        top: 42px;
        height: auto;
        width: 320px;
      }
    }
  }

  .search-input {
    .v-input__control {
      display: none;

      @media(min-width: $device-size-threshold){
        display: inherit;
        background-color: $cream;
        min-width: 162px;
        padding: 6px 20px 12px;
        border-radius: 22px;
      }
    }
    
    .v-text-field > .v-input__control > .v-input__slot:before {
      border-width: 1px;
    }
  }

  .device-search-input {
    margin-bottom: 18px;

    input {
      color: white !important;
    }

    .v-input__control {
      display: inherit !important;
    }
    
    @media(min-width: $device-size-threshold){
      display: none;
    }
  }

  .search-icon {
    color: black !important;
    border-bottom: 2px solid $primary-theme-color;
    margin-left: 12px;

    @media(min-width: $device-size-threshold){
      display: none !important;
    }
  }

  .filter {
    background-color: $primary-theme-color;
    color: $secondary-theme-color;
    padding: 4px 8px;
    border: 2px solid $secondary-theme-color;
    border-radius: 8px;
    font-size: 12px;
  }

  .selected-filter {
    background-color: $secondary-theme-color;
    color: $primary-theme-color;
  }

  .result-message {
    font-size: 24px;
    margin: 38px 0px 16px;
  }

  .result-img {
    $size: 34px;

    max-width: $size;
    height: $size;
    margin-right: 12px;
  }

  .result-type-title {
    text-transform: uppercase;
    text-decoration: underline;
  }

  .track-artists {
    font-weight: normal;
    font-size: 12px;
  }

  .number-of-tracks-icon {
    color: white !important;
  }

  .number-of-tracks {
    color: $secondary-theme-color;
    font-size: 12px;
  }

  .result-name {
    line-height: 1.3;
    text-align: left;
  }
</style>
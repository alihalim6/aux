<template>
  <section id="searchContainer" :class="{'searching': showSearchResults}" v-click-outside="blurred">
    <!-- LARGER SCREENS -->
    <v-text-field 
      dense 
      :placeholder="placeholder" 
      hide-details="auto" 
      class="search-input" 
      color="black"
      v-model="query"
      clearable
      :maxlength="maxLength"
      @focus="focused()"
    >
    <!--  -->
      
      <template v-slot:prepend>

        <!-- SMALLER SCREENS -->
        <v-text-field 
          dense 
          :placeholder="placeholder" 
          hide-details="auto" 
          class="device-search-input" 
          color="black"
          v-model="query"
          clearable
          :maxlength="maxLength"
          @focus="focused()"
        >
        </v-text-field>
        <!--  -->

        <div class="d-flex align-center justify-space-between width-100">
          <div v-for="(filter, index) in filters" :key="filter.label" @click.stop="filterPressed(filter)"  class="clickable filter" :class="{'selected-filter': filterType == filter.type}">{{filter.label}}</div>
        </div>

        <div v-if="validQuery() && !loadingResults && !results.length" class="result-message">Couldn't find anything for that search. Do try again you hear?</div>
        <div v-if="!loadingResults && !validQuery()" class="result-message"><div>Ready when you are.</div><div>3 character minumum.</div></div>

        <div v-if="loadingResults" class="oscillating-loading-container">
          <div class="black-background loading mt-12 mb-8"></div>
        </div>      

        <div class="d-flex justify-space-between my-8" v-for="item in results" :key="item.id" :class="{'track-playing': isTrackPlaying(item)}">
          <div class="d-flex" :class="{'align-center': !item.isMultitrackAlbum, 'align-start': item.isMultitrackAlbum}">
            <v-img class="clickable result-img" v-if="itemImg(item)" :src="itemImg(item)" @click.stop="$nuxt.$root.$emit('displayDetailOverlay', item)">
              <template v-slot:placeholder>
                <span class="small-content-placeholder">{{item.name.substring(0, 1)}}</span>
              </template>
            </v-img>

            <div class="d-flex flex-column">
              <span class="clickable" @click.stop="primaryLabelPressed(item)">{{item.primaryLabel}}<span class="track-artists" v-if="secondaryLabel(item)"> / {{secondaryLabel(item)}}</span></span>

              <div v-if="item.isMultitrackAlbum" class="mt-2">
                <v-icon color="black" small>mdi-music-circle</v-icon>
                <span class="number-of-tracks">{{item.numberOfTracks}}</span>
              </div>
            </div>
          </div>

          <ThreeDotIcon v-if="!item.isCollection" :item="item"/>
        </div>

        <BackToTop v-if="searchResultsId" :elementId="searchResultsId"/>
      </template>
    </v-text-field>

    <v-icon class="clickable search-icon" @click="searchIconPressed()">mdi-magnify</v-icon>
  </section>
</template>

<script>
  import {Component, Vue, Getter, Action, Watch, Mutation} from 'nuxt-property-decorator';
  import debounce from 'lodash.debounce';
  import search from '~/api/search';
  import {handleApiError} from '~/api/_utils';
  import {setItemMetaData, isSameTrack} from '~/utils/helpers';
  import {SPOTIFY, UI, PLAYBACK_QUEUE} from '~/store/constants';

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
    placeholder = 'SEARCH...';

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
      this.loadingResults = true;
      this.callSearchApi();
    }

    @Mutation('closeFeed', {namespace: UI})
    closeFeed;

    created(){
      this.callSearchApi = debounce(async () => {
        if(this.validQuery()){
          try{
            const data = await search(this.query, this.filterType);
            const {tracks, albums} = data;

            if(this.filterType == 'track' || this.filterType == 'album'){
              this.results = setItemMetaData([...tracks.items, ...albums.items]).filter(item => this.filterType == 'track' ? item.singleTrack : item.isCollection);
            }
            else {
              const currentFilter = this.filters.find(filter => filter.type == this.filterType);
              this.results = setItemMetaData(data[currentFilter.label].items);
            }

            this.loadingResults = false;
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

    collectionWithTracks(item){
      return item.isCollection && item.numberOfTracks;
    }

    blurred(){
      this.showSearchResults = false;
    }

    focused(){
      this.closeFeed();
      this.showSearchResults = true;
    }

    searchIconPressed(){
      this.closeFeed();
      this.showSearchResults = !this.showSearchResults;
    }

    filterPressed(filter){
      this.filterType = filter.type;
    }

    primaryLabelPressed(item){
      if(item.singleTrack){
        this.playTrackNow(item);
      }
      else{
        this.$nuxt.$root.$emit('displayDetailOverlay', item);
      }
    }

    itemImg(item){
      return item.imgUrl.small || item.imgUrl.large;
    }
  }
</script>

<style lang="scss">
  @import '~/styles/main.scss';
  
  #searchContainer {
    margin-top: 5px;

    @media(min-width: $device-size-threshold){
      margin-top: 8px;
      position: relative;
    }

    .v-input__prepend-outer {
      display: none;
    }
  }

  #searchContainer.searching {  
    .v-input__prepend-outer, .search-results {
      @extend .scroll-shadow;
      display: block;
      background-color: $secondary-theme-color;
      color: $primary-theme-color;
      font-weight: bold;
      border-radius: 4px;
      font-size: 14px;
      padding: $base-padding;
      left: 0px;
      top: 60px;
      max-height: 400px;
      width: 100%;
      overflow: scroll;
      position: absolute;
      box-shadow: 0px 4px 5px -2px rgb(0 0 0 / 20%), 0px 7px 10px 1px rgb(0 0 0 / 14%), 0px 2px 16px 1px rgb(0 0 0 / 12%);
      z-index: 400;

      @media(min-width: $device-size-threshold){
        top: 42px;
        height: auto;
        width: 320px;
      }
    }
  }

  .input-style {
    font-weight: bold;
    font-size: 14px;
    color: black !important;
  }

  .search-input {
    .v-input__control {
      display: none;

      @media(min-width: $device-size-threshold){
        display: inherit;
      }
    }

    input {
      @extend .input-style;
    }
  }

  .device-search-input {
    margin-bottom: 18px;

    .v-input__control {
      display: inherit !important;
    }

    input {
      @extend .input-style;
    }

    @media(min-width: $device-size-threshold){
      display: none;
    }
  }

  .search-icon {
    color: black !important;
    border-bottom: 2px solid $primary-theme-color;

    @media(min-width: $device-size-threshold){
      display: none !important;
    }
  }

  .filter {
    background-color: $secondary-theme-color;
    color: $primary-theme-color;
    padding: 4px 8px;
    border: 2px solid $primary-theme-color;
    border-radius: 8px;
    font-size: 12px;
  }

  .selected-filter {
    background-color: $primary-theme-color;
    color: $secondary-theme-color;
  }

  .result-message {
    font-size: 24px;
    margin-top: 32px;
  }

  .result-img {
    $size: 28px;

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

  .number-of-tracks {
    color: #888888;
    font-size: 12px;
  }
</style>
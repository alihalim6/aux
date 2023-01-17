<template>
  <section>
    <div v-if="!parentItem.isArtist" class="more-from-label">More from <span class="font-weight-bold">{{artist.name}}</span>:</div>

    <!-- TOP TRACKS -->  
    <v-card class="more-from-artist-container" elevation="7" v-if="parentItem.details.artistTopTracks.length">
      <div class="more-from-artist">
        <div class="more-from-artist-title mb-0 font-weight-bold">Top Tracks</div>
        <TrackList :tracks="parentItem.details.artistTopTracks" :tracksFromDifferentAlbums="true" :parentId="parentItem.id"/>
      </div>
    </v-card>

    <!-- TOP ALBUMS -->  
    <v-card class="more-from-artist-container sub-padding-right" elevation="7" v-if="parentItem.details.artistAlbums.length">
      <div class="more-from-artist">
        <div class="more-from-artist-title font-weight-bold">Top Albums</div>
        <ContentCarousel :data="parentItem.details.artistAlbums" :moreFromArtist="true"/>
      </div>
    </v-card>

    <!-- RELATED ARTISTS -->  
    <v-card class="more-from-artist-container sub-padding-right" elevation="7" v-if="parentItem.details.relatedArtists.length">
      <div class="more-from-artist">
        <div class="more-from-artist-title mb-2 font-weight-bold">Similar Artists</div>
        
        <div class="related-artists-container">
          <div 
            v-for="(artist, index) in parentItem.details.relatedArtists" 
            :key="artist.id"
            :class="{'no-bottom-border': (index === parentItem.details.relatedArtists.length - 1)}"
            @click="$nuxt.$root.$emit('displayArtistDetails', artist)">
              <v-hover v-slot="{hover}">
                <section class="clickable artist-container dashed-separator" >
                  <v-img class="artist-image" :src="artist.imgUrl.medium"></v-img>

                  <div class="artist-info">
                    <div class="font-weight-bold" :class="{'lighter-black-color': hover}">{{artist.name}}</div>
                    <div class="artist-genres">{{artist.secondaryLabel}}</div>
                  </div>

                  <v-icon class="clickable ml-auto">mdi-arrow-right</v-icon>
                </section>
              </v-hover>
          </div>
        </div>
      </div>
    </v-card>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';

  @Component
  export default class MoreFromArtist extends Vue {
    @Prop({required: true})
    parentItem;

    @Prop({required: true})
    artist;
  }
</script>

<style lang="scss">
  @import '~/styles/main.scss';
  
  .more-from-label {
    font-size: 20px;
    padding: 20px $base-padding 0px;
  }

  .more-from-artist-container {
    @extend .overlay-margin;
    padding: 10px 2px 14px;
    font-size: 16px;

    .more-from-artist-title {
      margin: 0px 0px 16px $base-padding;
      text-decoration: underline;
    }
  }

  .related-artists-container {
    overflow-y: scroll;
    overflow-x: hidden;

    .artist-container {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: $base-padding;
      border-radius: 2px;
      border-bottom: 1px dashed #eeeeee;

      .artist-image {
        max-width: 45%;
        border-radius: 4px;
        margin: 8px 10px 8px 0px;
        box-shadow: 0px 4px 5px -2px rgb(0 0 0 / 20%), 0px 7px 10px 1px rgb(0 0 0 / 14%), 0px 2px 16px 1px rgb(0 0 0 / 12%);
      }

      .artist-genres {
        font-size: 12px;
        color: #888888;
        font-weight: bold;
      }
    }
  }
</style>
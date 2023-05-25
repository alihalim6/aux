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

    <!-- ALBUMS -->  
    <v-card class="more-from-artist-container sub-padding-right" elevation="7" v-if="artistAlbums.length">
      <div class="more-from-artist">
        <div class="more-from-artist-title font-weight-bold">Albums</div>
        <ContentCarousel :data="artistAlbums" :moreFromArtist="true"/>
      </div>
    </v-card>

    <!-- RELATED ARTISTS -->  
    <v-card class="more-from-artist-container" elevation="7" v-if="parentItem.details.relatedArtists.length">
      <div class="more-from-artist">
        <div class="more-from-artist-title mb-2 font-weight-bold">Related Artists</div>
        
        <div class="related-artists-container">
          <button 
            v-for="artist in parentItem.details.relatedArtists" 
            :key="artist.id"
            @click="$nuxt.$root.$emit('displayArtistDetails', artist)"
            @keydown.enter="$nuxt.$root.$emit('displayArtistDetails', artist)"
            tabindex="0"
          >
            <v-hover v-slot="{hover}">
              <section class="clickable artist-container">

                <v-img class="artist-image" :src="artist.imgUrl.medium" :alt="`photo for ${artist.name}`">
                  <template v-slot:placeholder>
                    <span class="content-placeholder">{{artist.name.substring(0, 1)}}</span>
                  </template>
                </v-img>

                <div class="mr-2">
                  <div class="font-weight-bold" :class="{'lighter-black-color': hover}">{{artist.name}}</div>
                  <div class="artist-genres">{{artist.secondaryLabel}}</div>
                </div>
              </section>
            </v-hover>
          </button>
        </div>
      </div>
    </v-card>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import spotify from '~/api/spotify';

  @Component
  export default class MoreFromArtist extends Vue {
    artistAlbums = [];

    @Prop({required: true})
    parentItem;

    @Prop({required: true})
    artist;

    beforeMount(){
      this.artistAlbums = this.parentItem.details.artistAlbums;
    }

    async mounted(){
      //reassignment to get object value updates to feed down thru to content carousel
      this.artistAlbums = await Promise.all(this.artistAlbums.map(async album => {
        try{
          const {items} = await spotify({url: `/albums/${album.id}/tracks`});
          album.explicit = !!items.find(item => item.explicit);
          return album;
        }
        catch(error){
          console.error(`failed to get tracks for artists\' album to mark appropriate ones as explicit: ${error}`);
        }
      }));
    }
  }
</script>

<style lang="scss">  
  .more-from-label {
    font-size: 20px;
    padding: 20px $base-padding 0px;
  }

  .more-from-artist-container {
    @extend .overlay-margin;
    padding: 10px 2px $base-padding;
    font-size: 16px;

    .more-from-artist-title {
      margin: 0px 0px 16px $base-padding;
      text-decoration: underline;
    }
  }

  .related-artists-container {
    overflow-y: scroll;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;

    .artist-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 24px 0px;

      .artist-image {
        $size: 310px;
        width: $size;
        height: $size;
        border-radius: 100%;
        margin-bottom: 12px;

        .v-image__image--cover {
          background-size: cover;
        }
      }

      .artist-genres {
        font-size: 12px;
        color: #888888;
        font-weight: bold;
      }
    }
  }
</style>
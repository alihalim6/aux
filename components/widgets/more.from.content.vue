<template>
     <section>
        <div class="more-from-artist">More from <span class="font-weight-bold">{{artist.name}}</span>:</div>

        <v-card class="overlay-details-container more-from-details-container" elevation="7">
            <div class="more-from-details">
                <span class="more-from-details-title font-weight-bold">Top Tracks</span>
                <TrackList :tracks="item.details.artistTopTracks" :mixOfTracks="true" :mainId="item.id"/>
            </div>
        </v-card>

        <v-card class="overlay-details-container more-from-details-container sub-padding-right" elevation="7">
            <div class="more-from-details">
                <span class="more-from-details-title font-weight-bold">Top Albums</span>
                <ContentCarousel :data="item.details.artistAlbums" :moreFromContent="true"/>
            </div>
        </v-card>

        <v-card class="overlay-details-container more-from-details-container sub-padding-right" elevation="7">
            <div class="more-from-details">
                <span class="more-from-details-title font-weight-bold">Related Artists</span>
                
                <div class="related-artists-container">
                    <div 
                        v-for="(artist, index) in item.details.relatedArtists" 
                        :key="index" class="clickable artist-container dashed-separator" 
                        :class="{'no-bottom-border': (index === item.details.relatedArtists.length - 1)}"
                        @click="displayArtistDetail(artist)">

                        <v-img class="artist-image" :src="artist.imgUrl"></v-img>

                        <div class="artist-info">
                            <div class="font-weight-bold">{{artist.name}}</div>
                            <div class="font-weight-regular artist-genres">{{artist.primaryLabel}}</div>
                        </div>

                        <v-icon class="artist-arrow">mdi-arrow-right</v-icon>
                    </div>
                </div>
            </div>
        </v-card>
    </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';

  @Component
  export default class MoreFromContent extends Vue {
      duration = 0;

      @Prop({required: true})
      item;

      @Prop({required: true})
      artist;
  }
</script>

<style lang="scss">
    .more-from-details-container {
        padding: 10px 2px 14px;
    }

    .more-from-artist {
        font-size: 20px;
        padding: 20px $sub-padding 0px;
    }

    .more-from-details {
        font-size: 16px;
        
        .more-from-details-title {
            margin-bottom: 6px;
            padding: 6px 0px 10px $sub-padding;
            text-decoration: underline;
        }

        .related-artists-container {
            overflow-y: scroll;
            overflow-x: hidden;

            .artist-container {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                padding-left: $sub-padding;
                border-radius: 2px;
                border-bottom: 1px dashed #eeeeee;

                .artist-image {
                    max-width: 45%;
                    border-radius: 4px;
                    margin: 8px 10px 8px 0px;
                    box-shadow: 0px 4px 5px -2px rgb(0 0 0 / 20%), 0px 7px 10px 1px rgb(0 0 0 / 14%), 0px 2px 16px 1px rgb(0 0 0 / 12%);
                }

                .artist-info {
                    .artist-genres {
                        font-size: 12px;
                        color: #333333;
                    }
                }

                .artist-arrow {
                    margin-left: auto;
                }
            }
        }
    }
</style>
<template>
    <section>
        <div class="sub-title-container">
            <div class="sub-text">
                <span v-for="(artist, index) in track.artists" :key="artist.id">
                    <span class="clickable text-decoration-underline inline-display" @click="displayArtistDetail(artist)">{{artist.name}}</span><span v-show="(index < track.artists.length - 1)">, </span>
                </span>
                <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
                {{new Date(track.album ? track.album.release_date : track.release_date).getFullYear()}}
            </div>

            <div class="sub-padding-left no-wrap">
                <span v-show="duration">{{duration}}</span>
            </div>
        </div>

        <v-card class="clickable overlay-details-container" elevation="7" v-show="track.album && (track.album.total_tracks > 1)" @click="displayDetailOverlay(track.album)">
            <div>From <span class="from-title">{{track.album.name}}</span>
                <v-icon small>mdi-arrow-right</v-icon>
            </div>

            <div class="album-info">
                <v-img class="clickable track-album" :src="track.album.imgUrl"></v-img>

                <div class="album-data">
                    <div><span class="font-weight-regular">by</span> {{track.album.subLabel}}</div>
                    <div class="font-weight-regular">{{track.album.total_tracks}} {{track.album.total_tracks > 1 ? 'Tracks' : 'Track'}}</div>
                </div>
            </div>
        </v-card>

        <MoreFromContent v-if="(!track.album || track.album.total_tracks === 1)" :item="track" :artist="track.artists[0]"/>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration, setItemDisplayData, setDetailsDisplayData} from '~/utils/helpers';

  @Component
  export default class TrackDetail extends Vue {
      duration = 0;

      @Prop({required: true})
      track;

      @Action('displayArtistDetail', {namespace: 'ui'})
      displayArtistDetail;
      
      @Action('displayDetailOverlay', {namespace: 'ui'})
      displayDetailOverlay;

      beforeMount(){
        if(this.track.album){
            setItemDisplayData(this.track.album);
        }
        
        if(this.track.singleTrack){
            setDetailsDisplayData(this.track.details.artistAlbums);
            setDetailsDisplayData(this.track.details.artistTopTracks);
            setDetailsDisplayData(this.track.details.relatedArtists);
        }

        this.duration = msToDuration(this.track.duration_ms);
      }
  }
  </script>

  <<style lang="scss">
    .from-title {
        font-weight: 600;
        text-decoration: underline;
    }

    .album-info {
        display: flex;
        align-items: center;

        .track-album {
            max-width: 55%;
            margin-top: 8px;
        }

        .album-data {
            display: flex;
            flex-direction: column;
            margin-left: 18px;
            font-weight: 600;
            font-size: 14px;

            @media(min-width: 600px){
                font-size: 16px;
            }
        }
    }
  </style>
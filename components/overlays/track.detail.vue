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

            <div class="sub-pad-left no-wrap">
                <span v-show="duration">{{duration}}</span>
            </div>
        </div>

        <div class="clickable album-info-container" v-show="track.album && (track.album.total_tracks > 1)" @click="displayDetailOverlay(track.album)">
            <div>From <span class="from-title">{{track.album.name}}</span>
                <v-icon small>mdi-arrow-right</v-icon>
            </div>

            <div class="album-info">
                <v-img class="clickable track-album" :src="track.album.imgUrl"></v-img>

                <div class="album-data">
                    <div>{{track.album.subLabel}}</div>
                    <div class="font-weight-normal">{{track.album.total_tracks}} {{track.album.total_tracks > 1 ? 'Tracks' : 'Track'}}</div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration, setItemDisplayData} from '~/utils/helpers';

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

        this.duration = msToDuration(this.track.duration_ms);
      }
  }
  </script>

  <<style lang="scss">
    .album-info-container {
        margin-top: 22px;
        border: 2px dotted black;
        padding: 10px 11px 14px;
        border-radius: 4px;

        .from-title {
            font-weight: 600;
            text-decoration: underline;
        }

        .album-info {
            display: flex;

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
                padding-top: 4px;
            }
        }
    }
  </style>
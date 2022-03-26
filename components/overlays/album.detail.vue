<template>
    <section>
        <div class="sub-title-container">
            <div class="sub-text">
                <span v-for="(artist, index) in album.artists" :key="artist.id">
                    <span class="clickable text-decoration-underline inline-display" @click="displayArtistDetail(artist)">{{artist.name}}</span><span v-show="(index < album.artists.length - 1)">, </span>
                </span>
                <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
                {{new Date(album.release_date).getFullYear()}}
            </div>

            <div class="no-wrap">
                <span v-show="album.bottomLabel">{{album.bottomLabel}}</span>
                <v-icon v-show="album.bottomLabel && duration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
                <span v-show="duration">{{duration}}</span>
            </div>
        </div>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration} from '~/utils/helpers';

  @Component
  export default class AlbumDetail extends Vue {
      duration = 0;

      @Prop({required: true})
      album;

      @Action('displayArtistDetail', {namespace: 'ui'})
      displayArtistDetail;

      beforeMount(){
        if(this.album.total_tracks === 1){
            this.duration = msToDuration(this.album.details.albumTracks.reduce((total, track) => total + track.duration_ms, 0));
        }
      }
  }
  </script>
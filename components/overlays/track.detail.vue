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
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration} from '~/utils/helpers';

  @Component
  export default class TrackDetail extends Vue {
      duration = 0;

      @Prop({required: true})
      track;

      @Action('displayArtistDetail', {namespace: 'ui'})
      displayArtistDetail;

      beforeMount(){
        this.duration = msToDuration(this.track.duration_ms);
      }
  }
  </script>
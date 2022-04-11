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

            <div class="sub-padding-left no-wrap">
                <span v-show="album.bottomLabel">{{album.bottomLabel}}</span>
                <v-icon v-show="album.bottomLabel && duration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
                <span v-show="duration">{{duration}}</span>
            </div>
        </div>

        <div v-if="album.total_tracks > 1">
            <TrackList :tracks="album.details.albumTracks" :mainId="album.id"/>
        </div>

        <MoreFromContent v-if="album.singleTrack" :item="album" :artist="album.artists[0]"/>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration, setDetailsDisplayData} from '~/utils/helpers';

  @Component
  export default class AlbumDetail extends Vue {
      duration = 0;

      @Prop({required: true})
      album;

      @Action('displayDetailOverlay', {namespace: 'ui'})
      displayDetailOverlay;

      @Action('displayArtistDetail', {namespace: 'ui'})
      displayArtistDetail;

      beforeMount(){
        if(this.album.singleTrack){
            this.duration = msToDuration(this.album.details.albumTracks.reduce((total, track) => total + track.duration_ms, 0));

            setDetailsDisplayData(this.album.details.artistAlbums);
            setDetailsDisplayData(this.album.details.artistTopTracks);
            setDetailsDisplayData(this.album.details.relatedArtists);
        }
        else{
            setDetailsDisplayData(this.album.details.albumTracks);
        }
      }
  }
  </script>
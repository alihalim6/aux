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

            <div class="sub-pad-left no-wrap">
                <span v-show="album.bottomLabel">{{album.bottomLabel}}</span>
                <v-icon v-show="album.bottomLabel && duration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
                <span v-show="duration">{{duration}}</span>
            </div>
        </div>

        <!-- TODO COMPONENTIZE TO USE FOR PLAYLISTS OVERLAY -->
        <div class="track-list-container" v-show="album.total_tracks > 1">
            <div v-for="(track, index) in album.details.albumTracks" :key="index" class="track-container" :class="{'no-bottom-border': (track.track_number === album.details.albumTracks.length)}">
                <div class="left-container">
                    <div class="track-number">{{track.track_number}}</div>
                    <div class="track-name">
                        <span>{{track.name}}</span>               
                        <div class="track-duration">{{track.duration}}</div>
                    </div>
                </div>

                <div class="right-container">
                    <PlaybackIcon :item="track" class="track-list-playback"/>
                    <v-icon small class="clickable">mdi-heart-plus-outline</v-icon>
                </div>
            </div>
        </div>

        <div class="artist-top-tracks-container" v-show="album.total_tracks === 1">
            
        </div>
    </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration, setItemDisplayData} from '~/utils/helpers';

  @Component
  export default class AlbumDetail extends Vue {
      duration = 0;

      @Prop({required: true})
      album;

      @Action('displayArtistDetail', {namespace: 'ui'})
      displayArtistDetail;

      beforeMount(){
        this.album.details.albumTracks.forEach(track => {
            setItemDisplayData(track);
            track.duration = msToDuration(track.duration_ms);
        });

        if(this.album.total_tracks === 1){
            this.duration = msToDuration(this.album.details.albumTracks.reduce((total, track) => total + track.duration_ms, 0));
        }
      }
  }
  </script>
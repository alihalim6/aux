<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label">
          <span v-for="(artist, index) in album.artists" :key="artist.id">
              <span class="clickable text-decoration-underline inline-display" @click="displayArtistDetails(artist)">{{artist.name}}</span><span v-show="(index < album.artists.length - 1)">, </span>
          </span>

          <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
          {{new Date(album.release_date).getFullYear()}}
      </div>

      <div class="sub-padding-left no-wrap">
          <span v-show="album.tracksLabel">{{album.tracksLabel}}</span>
          <v-icon v-show="album.tracksLabel && duration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
          <span v-show="duration">{{duration}}</span>
      </div>
    </div>

    <div v-if="album.total_tracks > 1">
      <TrackList :tracks="album.details.albumTracks" :mainId="album.id"/>
    </div>

    <MoreFromArtist v-if="album.singleTrack" :parentItem="album" :artist="album.artists[0]"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {msToDuration, setItemMetaData} from '~/utils/helpers';
  import {UI} from '~/store/constants';

  @Component
  export default class AlbumDetails extends Vue {
    duration = 0;

    @Prop({required: true})
    album;

    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;

    @Action('displayArtistDetails', {namespace: UI})
    displayArtistDetails;

    beforeMount(){
      if(this.album.singleTrack){
        this.duration = msToDuration(this.album.details.albumTracks.reduce((total, track) => total + track.duration_ms, 0));

        //set data for 'more from artist' content
        setItemMetaData(this.album.details.artistAlbums);
        setItemMetaData(this.album.details.artistTopTracks);
        setItemMetaData(this.album.details.relatedArtists);
      }
      else{
        setItemMetaData(this.album.details.albumTracks);
      }
    }
  }
  </script>
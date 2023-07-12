<template>
  <section class="album-details">
    <div class="sub-title-container">
      <div class="d-flex align-center">
        <ArtistList :artists="album.artists" />
      </div>

      <div class="sub-padding-left no-wrap">
        <span>{{new Date(album.release_date).getFullYear()}}</span>
        <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        <span v-if="album.numberOfTracks">{{album.numberOfTracks}}</span>
        <v-icon v-if="album.numberOfTracks && duration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        <span v-if="duration">{{duration}}</span>
      </div>
    </div>

    <div v-if="album.total_tracks > 1">
      <TrackList :tracks="tracks" :parentId="album.id"/>
    </div>

    <MoreFromArtist v-if="album.singleTrack" :parentItem="album" :artist="album.artists[0]"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {processAlbum} from '~/utils/helpers';

  @Component
  export default class AlbumDetails extends Vue {
    duration = 0;
    tracks = [];

    @Prop({required: true})
    album;

    async beforeMount(){
      const {duration, tracks} = await processAlbum(this.album);
      this.duration = duration;
      this.tracks = tracks;
    }
  }
</script>
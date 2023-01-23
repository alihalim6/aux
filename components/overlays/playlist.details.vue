<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label">{{playlist.secondaryLabel}}</div>
    </div>

    <v-card class="mt-3 pa-2" elevation="7" v-if="tracks.length">
      <TrackList :tracks="tracks" :tracksFromDifferentAlbums="true" :hideAlbums="true"/>
    </v-card>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import spotify from '~/api/spotify';

  @Component
  export default class PlaylistDetails extends Vue {
    tracks = [];
    allTracksRetrieved = false;

    @Prop({required: true})
    playlist;

    async beforeMount(){
      const { playlistTracks, totalPlaylistTracks, collectionTrackLimit } = this.playlist.details;
      this.tracks = playlistTracks.map(this.setTrackData).filter(track => track.id);

      while(!this.allTracksRetrieved){
        if(this.tracks.length < totalPlaylistTracks){
          const data = await spotify({url: `/playlists/${this.playlist.id}/tracks?limit=${collectionTrackLimit}&offset=${this.tracks.length}`});
          this.tracks = [...this.tracks, ...data.items.map(this.setTrackData)];
        }
        else{
          this.allTracksRetrieved = true;
          this.tracks.forEach(track => track.fromCollection = [this.playlist.uri]);
          this.tracks = this.tracks.filter(track => track.id);
          
          //needed for collection logic for 'play entire playlist' toggle on overlay
          this.playlist.details.playlistTracks = this.tracks;
        }
      }
    }

    setTrackData(item){
      //ignore playlist tracks that come back from API sometimes with no data
      if(!item.id && !item.track){
        return {};
      }

      return setItemMetaData([item.track])[0];
    }
  }
</script>
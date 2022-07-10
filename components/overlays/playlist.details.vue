<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label">{{playlist.secondaryLabel}}</div>
    </div>

    <v-card class="mt-3 pa-2" elevation="7" v-if="tracks.length">
      <TrackList :tracks="tracks" :tracksFromDifferentAlbums="true" :hideAlbums="true" :displayArtists="true"/>
    </v-card>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import {httpClient} from '~/utils/api';

  @Component
  export default class PlaylistDetails extends Vue {
    tracks = [];
    allTracksRetrieved = false;

    @Prop({required: true})
    playlist;

    async beforeMount(){
      const { tracks, totalTracks, limit } = this.playlist.details.playlists;
      this.tracks = tracks.map(this.setTrackData);

      while(!this.allTracksRetrieved){
        if(this.tracks.length < totalTracks){
          const { data } = await httpClient.post('/passthru', {
            url: `/playlists/${this.playlist.id}/tracks?limit=${limit}&offset=${this.tracks.length}`,
            method: 'GET'
          });

          this.tracks = [...this.tracks, ...data.items.map(this.setTrackData)];
        }
        else{
          this.allTracksRetrieved = true;
          this.tracks = this.tracks.filter(track => track.id);
        }
      }
    }

    setTrackData(item){
      if(!item.track){
        return {};
      }

      return setItemMetaData([item.track])[0];
    }
  }
</script>
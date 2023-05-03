<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label">{{playlist.secondaryLabel}}</div>
    </div>

    <v-card class="mt-3 pa-2" elevation="7" v-if="tracks.length">
      <TrackList :tracks="tracks" :tracksFromDifferentAlbums="true" :hideAlbums="true" :playlist-id="userOwned() ? playlist.id : null"/>
    </v-card>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Getter} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import spotify from '~/api/spotify';
  import {USER} from '~/store/constants';

  @Component
  export default class PlaylistDetails extends Vue {
    tracks = [];
    allTracksRetrieved = false;

    @Prop({required: true})
    playlist;

    @Getter('profile', {namespace: USER})
    profile;

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

      this.$nuxt.$root.$on('trackAddedToPlaylist', function({track}){
        this.tracks.push(track);
      }.bind(this));

      this.$nuxt.$root.$on('trackRemovedFromPlaylist', async function({track, playlistId}){
        await spotify({
          method: 'DELETE', 
          url: `/playlists/${playlistId}/tracks`, 
          body: {
            tracks: [{uri: track.uri}]
          }
        });

        this.tracks.splice(this.tracks.findIndex(playlistTrack => playlistTrack.uuid == track.uuid), 1);
        this.$nuxt.$root.$emit('updateHomePlaylists');
      }.bind(this));
    }

    setTrackData(item){
      //ignore playlist tracks that come back from API sometimes with no data
      if(!item.id && !item.track){
        return {};
      }

      return setItemMetaData([item.track])[0];
    }

    userOwned(){
      return this.playlist.owner.id == this.profile.id;
    }

    beforeDestroy() {
      this.$nuxt.$root.$off('trackAddedToPlaylist');
      this.$nuxt.$root.$off('trackRemovedFromPlaylist');
    }
  }
</script>
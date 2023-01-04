<template>
  <section>
    <div class="sub-title-container">
      <div>
        <ArtistList :artists="album.artists"/>
        <v-icon class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        {{new Date(album.release_date).getFullYear()}}
      </div>

      <div class="sub-padding-left no-wrap">
        <span v-if="album.numberOfTracks">{{album.numberOfTracks}}</span>
        <v-icon v-if="album.numberOfTracks && duration" class="circle-separator">mdi-checkbox-blank-circle</v-icon>
        <span v-if="duration">{{duration}}</span>
      </div>
    </div>

    <div v-if="album.total_tracks > 1">
      <TrackList :tracks="album.details.albumTracks" :parentId="album.id"/>
    </div>

    <MoreFromArtist v-if="album.singleTrack" :parentItem="album" :artist="album.artists[0]"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {msToDuration, setItemMetaData, handleItemCollection} from '~/utils/helpers';

  @Component
  export default class AlbumDetails extends Vue {
    duration = 0;

    @Prop({required: true})
    album;

    beforeMount(){
      const albumDetails = this.album.details;

      if(this.album.singleTrack){
        this.duration = msToDuration(albumDetails.albumTracks[0].duration_ms);

        //set data for 'more from artist' content
        setItemMetaData(albumDetails.artistAlbums);
        setItemMetaData(albumDetails.artistTopTracks);
        setItemMetaData(albumDetails.relatedArtists);
      }
      else{
        this.duration = msToDuration(albumDetails.albumTracks.reduce((total, track) => total + track.duration_ms, 0));
        setItemMetaData(albumDetails.albumTracks);

        //set image for all tracks on album
        albumDetails.albumTracks.forEach(track => track.imgUrl = this.album.imgUrl);
      }

      //mark all album tracks as part of this album (collection)
      for(const track of albumDetails.albumTracks){
        handleItemCollection(track, this.album.uri);

        //needed to display track detail when clicking album track on currently playing widget;
        //can't set whole album as that causes circular JSON error
        track.album = {...this.album};
        delete track.album.details;
      }
    }
  }
  </script>
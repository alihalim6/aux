<template>
  <section>
    <div class="sub-title-container">
      <div>{{artist.secondaryLabel}}</div>
    </div>

    <MoreFromArtist :parentItem="artist" :artist="artist"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';

  @Component
  export default class ArtistDetails extends Vue {
    @Prop({required: true})
    artist;

    beforeMount(){
      const artistDetails = this.artist.details;
      setItemMetaData(artistDetails.artistAlbums);
      setItemMetaData(artistDetails.artistTopTracks);
      setItemMetaData(artistDetails.relatedArtists);
    }
  }
  </script>
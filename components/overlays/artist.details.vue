<template>
  <section>
    <div class="sub-title-container">
      <div class="secondary-label">{{artist.secondaryLabel}}</div>
    </div>

    <MoreFromArtist :parentItem="overlayArtist" :artist="artist"/>
  </section>
</template>

<script>
  import {Component, Vue, Prop, Mutation} from 'nuxt-property-decorator';
  import {setItemMetaData} from '~/utils/helpers';
  import {UI} from '~/store/constants';
  import cloneDeep from 'lodash.clonedeep';

  @Component
  export default class ArtistDetails extends Vue {
    overlayArtist;

    @Prop({required: true})
    artist;

    @Mutation('updateOverlayItem', {namespace: UI})
    updateOverlayItem;

    beforeMount(){
      this.overlayArtist = cloneDeep(this.artist);
      const artistDetails = this.overlayArtist.details;

      setItemMetaData(artistDetails.artistAlbums);
      setItemMetaData(artistDetails.artistTopTracks);
      setItemMetaData(artistDetails.relatedArtists);
      
      this.updateOverlayItem(this.overlayArtist);
    }
  }
  </script>
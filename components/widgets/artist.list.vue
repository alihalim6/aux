<template>
  <span>
    <span v-for="(artist, index) in artists" :key="artist.id">
      <span :id="`trackArtist${index}`" class="clickable inline-display" @click.stop="displayArtistDetails(artist)"  :class="{'text-decoration-underline': underline}">{{artist.name}}</span><span v-if="(index < artists.length - 1)">, </span>
    </span>
  </span>
</template>

<script>
  import {Component, Vue, Prop, Action} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

  @Component
  export default class ArtistList extends Vue {
    @Prop({required: true})
    artists;

    @Prop({default: true})
    underline;

    @Action('displayArtistDetails', {namespace: UI})
    displayArtistDetails;
  }
</script>
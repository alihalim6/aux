<template>
  <span>
    <span v-for="(artist, index) in artists" :key="artist.id">
      <span :id="`trackArtist${index}`" class="clickable text-decoration-underline inline-display" @click="displayArtistDetails(artist)">{{artist.name}}</span>
      <span v-show="(index < artists.length - 1)">, </span>
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

    @Action('displayArtistDetails', {namespace: UI})
    displayArtistDetails;
  }
</script>
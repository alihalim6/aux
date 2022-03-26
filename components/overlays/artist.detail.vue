<template>
    <section>
        <div class="sub-title-container">
            <div class="sub-text">{{artist.primaryLabel}}</div>
        </div>
    </section>
</template>

<script>
  import {Component, Vue, Prop} from 'nuxt-property-decorator';

  @Component
  export default class ArtistDetail extends Vue {
      @Prop({required: true})
      artist;
  }
  </script>
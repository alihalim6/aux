<template>
  <section>
    <div class="title-container mt-8">
      <div class="section-title">
        {{user.displayName || 'My Vibe'}}

        <div class="action-container">
          <div class="clickable action-label">Recently Played</div>
          <span class="action-divider">/</span>
          <div class="clickable action-label">Liked Items</div>
          <span class="action-divider">/</span>
          <div class="clickable action-label">My Top Items</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';
  
  @Component
  export default class MyAux extends Vue {
    user = {displayName: ''};
  }
</script>
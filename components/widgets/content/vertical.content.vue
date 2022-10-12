<template>
  <section>
    <div v-if="data.length" class="vertical-content">
      <v-card v-for="(item, index) in data" :key="item.uuid" class="pb-2 mb-4" :class="{'dashed-separator': index < (data.length - 1)}" elevation="3" @click="displayDetailOverlays(item)">        
        <div class="item-container" :class="{'flex-column': playlists}">  
          <v-card v-if="!playlists" max-width="40%" elevation="7">
            <v-img :src="item.imgUrl.large"></v-img>
          </v-card>

          <div v-if="playlists" class="d-flex justify-space-between align-start fill-available mb-4">
            <v-card max-width="75%" elevation="7">
              <v-img :src="item.imgUrl.large"></v-img>
            </v-card>

            <v-icon v-if="alternateFormat" class="ml-auto" large color="black">mdi-arrow-right</v-icon>
          </div>

          <v-icon v-if="!playlists" class="divider" :class="{'smaller-divider': alternateFormat}">mdi-slash-forward</v-icon>

          <div class="d-flex flex-column">
            <span class="item-title" :class="{'smaller-title': alternateFormat}">{{item.primaryLabel}}</span>
            <span v-if="!alternateFormat" class="item-detail" :class="{'smaller-detail': alternateFormat}">{{item.secondaryLabel}}</span>
            <div class="item-detail" :class="{'smaller-detail': alternateFormat}"><v-icon v-if="item.numberOfTracks" class="record-icon" small>mdi-music-circle</v-icon>{{item.numberOfTracks}}</div>
          </div>

          <v-icon v-if="!alternateFormat" class="ml-auto" color="black">mdi-arrow-right</v-icon>
        </div>

        <div class="bottom-container" :class="{'alternate-bottom-container': alternateFormat}">
          <span v-if="alternateFormat" class="item-detail" :class="{'smaller-detail': alternateFormat}">{{item.secondaryLabel}}</span>
          <timeago v-if="item.timeAgo" class="time-ago" :datetime="item.timeAgo"></timeago>

          <div class="item-icon-container">
            <PlaybackIcon v-if="!item.isCollection" :item="item" :itemSet="data"/>
            <ThreeDotIcon v-if="!item.isCollection" :item="item"/>
          </div>
        </div>
      </v-card>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

  @Component
  export default class VerticalContent extends Vue {
    @Prop({required: true})
    data;

    @Prop()
    alternateFormat;

    @Prop()
    playlists;

    @Action('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;
  }
</script>

<style lang="scss">
  .vertical-content {
    display: flex;
    flex-direction: column;

    .item-container {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      padding: $base-padding $base-padding 8px;

      .divider {
        font-size: 32px;
        color: $primary-theme-color;
        margin-left: 8px;
      }

      .smaller-divider {
        font-size: 20px;
      }

      .item-title {
        font-size: 22px;
        line-height: 1.3;
        padding-bottom: 2px;
        font-weight: bold;
        word-break: break-word;
      }

      .smaller-title {
        font-size: 16px;
      }
    }

    .bottom-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 41%;

      .time-ago {
        font-size: 14px;
        padding-left: $base-padding;
        font-weight: bold;
        color: #888888;
      }
    }

    .alternate-bottom-container {
      max-width: unset;
      padding: $base-padding;
    }

    .item-detail {
      font-size: 14px;
      padding-bottom: 2px;
      display: flex;
      align-items: center;
    }

    .smaller-detail {
      font-size: 12px;
      align-items: flex-start;

      .v-icon {
        padding-top: 1px;
      }
    }
  }
</style>
<template>
  <section>
    <div v-if="data.length" class="vertical-content">
      <v-card v-for="(item, index) in data" :key="item.id" class="pb-2 mb-4" :class="{'dashed-separator': index < (data.length - 1)}" elevation="7">        
        <div class="item-container">  
          <v-card max-width="40%" elevation="7" class="clickable">
            <v-img class="item-img" :src="item.imgUrl" @click="displayDetailsOverlay(item)"></v-img>
          </v-card>

          <v-icon class="divider" :class="{'smaller-divider': alternateFormat}">mdi-slash-forward</v-icon>

          <div class="info-container">
            <span class="clickable item-title font-weight-bold" :class="{'smaller-title': alternateFormat}" @click="displayDetailsOverlay(item)">{{item.primaryLabel}}</span>
            <span v-if="!alternateFormat" class="item-detail" :class="{'smaller-detail': alternateFormat}">{{item.secondaryLabel}}</span>
            <div class="item-detail d-flex" :class="{'smaller-detail': alternateFormat}"><v-icon v-if="item.numberOfTracks" class="record-icon" small>mdi-music-circle</v-icon>{{item.numberOfTracks}}</div>
          </div>

          <v-icon v-if="!alternateFormat" class="clickable ml-auto" color="black" @click="displayDetailsOverlay(item)">mdi-arrow-right</v-icon>
        </div>

        <div class="bottom-container" :class="{'alternate-bottom-container': alternateFormat}">
          <span v-if="alternateFormat" class="item-detail" :class="{'smaller-detail': alternateFormat}">{{item.secondaryLabel}}</span>
          <span :class="{'no-visibility': !item.timeAgo}" class="time-ago">{{item.timeAgo}}</span>
          <PlaybackIcon :item="item"/>
        </div>
      </v-card>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

  @Component
  export default class NewReleases extends Vue {
    @Prop({required: true})
    data;

    @Prop()
    alternateFormat;

    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;
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

      .item-img {
        max-height: 100%;
      }
      
      .divider {
        font-size: 32px;
        color: $primary-theme-color;
        margin-left: 8px;
      }

      .smaller-divider {
        font-size: 20px;
      }

      .info-container {
        display: flex;
        flex-direction: column;

        .item-title {
          font-size: 22px;
          line-height: 1.3;
          padding-bottom: 2px;
        }

        .smaller-title {
          font-size: 16px;
        }
      }
    }

    .bottom-container {
      display: flex;
      justify-content: space-between;
      max-width: 40%;

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
    }

    .smaller-detail {
      font-size: 12px;
    }
  }
</style>
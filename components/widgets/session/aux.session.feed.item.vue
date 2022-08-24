<template>    
  <section class="feed-item-container">
    <v-img class="clickable track-img" :src="item.track.imgUrl"></v-img>

    <div class="feed-item">
      <div class=" clickable item-info-container" :class="{'live-item': item.wentLive}">
        <div class="item-info">
          <span v-if="item.wentLive"><span v-if="item.wentLive" class="font-weight-bold">You</span> went live with&nbsp;</span>

          <div class="d-flex align-center">
            <span class="font-weight-bold">{{item.track.primaryLabel}} /<span class="track-artists"> {{item.track.secondaryLabel}}</span></span>
          </div>
        </div>

        <div class="d-flex align-center align-self-end">
          <div class="clickable reaction" v-for="reaction in reactions" :key="reaction.name">{{reaction.icon}} <span class="count">{{reaction.count}}</span></div>
        </div>
      </div>

      <div class="activity-info-container">
        <div class="clickable d-flex justify-start align-center">
          <!-- TODO followability (if not you)-->
          <v-img v-if="item.user.img" :src="item.user.img" class="added-by-icon"></v-img>
          <div v-else class="added-by-letter">{{`${item.user.name.substring(0, 1).toUpperCase()}`}}</div>
          <span class="ml-1">{{item.user.name}}</span>
        </div>

        <Timeago :datetime="item.timestamp" :auto-update="60" class="font-weight-regular"></Timeago>
      </div>
    </div>

    <div class="d-flex align-center mt-1 ml-1">
      <PlaybackIcon :item="item"/>
      <!-- TODO -->
      <v-icon small class="clickable px-3">mdi-heart-plus-outline</v-icon>
      <v-icon small class="clickable">mdi-dots-vertical</v-icon>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue} from 'nuxt-property-decorator';

  @Component
  export default class AuxSessionFeedItem extends Vue {
    reactions = [
      {
        icon: String.fromCodePoint(0x1F525),
        name: 'fire',
        count: 0
      },
      {
        icon: String.fromCodePoint(0x1F642),
        name: 'nice',
        count: 0
      },
      {
        icon: String.fromCodePoint(0x1F616),
        name: 'nah',
        count: 0
      }
    ];

    @Prop()
    item;
  }
   
</script>

<style lang="scss">
  .feed-item-container {
    display: flex;
    align-items: flex-start;
    margin-top: 30px;

    .track-img {
      $track-img-size: 34px;

      max-width: $track-img-size;
      height: $track-img-size;
      margin-right: 12px;
      align-self: baseline;
      margin-top: 2px;
    }

    .feed-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-right: 12px;
      max-width: 67%;
      width: -webkit-fill-available;

      @media(min-width: 630px){
        max-width: 80%;
      }

      .item-info-container {
        font-weight: normal;
        font-size: 14px;
        margin-bottom: 8px;
        padding: 8px 10px;
        width: 100%;
        border: 2px solid #eeeeee;
        border-radius: 4px;
        display: flex;
        flex-direction: column;

        .item-info {
          display: -webkit-inline-box;
          flex-wrap: wrap;

          .track-artists {
            font-weight: normal;
            font-size: 12px;
          }
        }

        .reaction {
          font-size: 14px;
          margin: 8px;

          .count {
            font-weight: bold;
            font-size: 10px;
            color: #bbbbbb;
          }
        }
      }

      .live-item {
        border-color: $spotify-green;
      }

      .activity-info-container {
        font-size: 12px;
        color: #aaaaaa;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        width: 100%;

        .added-by-icon {
          $added-by-icon-size: 18px;

          border-radius: 100%;
          height: $added-by-icon-size;
          max-width: $added-by-icon-size;
          color: $primary-theme-color;
          background-color: white;
        }

        .added-by-letter {
          @extend .added-by-icon;
          border: 1px solid $primary-theme-color;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }
      }
    }
  }
</style>
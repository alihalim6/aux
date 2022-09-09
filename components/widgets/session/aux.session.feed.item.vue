<template>    
  <section class="feed-item-container">
    <v-img class="clickable track-img" :src="item.track.imgUrl" @click="displayDetailsOverlay(item.track)"></v-img>

    <div class="feed-item">
      <div class=" clickable item-info-container">
        <div class="item-info" :class="{'live-item': item.wentLive}">
          <span v-if="item.wentLive"><span v-if="item.wentLive" class="font-weight-bold">You</span> went live with&nbsp;</span>

          <div class="d-flex align-center">
            <span class="font-weight-bold">{{item.track.primaryLabel}} /<span class="track-artists"> {{item.track.secondaryLabel}}</span></span>
          </div>
        </div>

        <div class="d-flex align-start justify-space-between">
          <div class="activity-info-container">
            <div class="clickable added-by">
              <!-- TODO followability (if not you)-->
              <v-img v-if="item.user.img" :src="item.user.img" class="added-by-icon"></v-img>
              <div v-else class="added-by-letter">{{`${item.user.name.substring(0, 1).toUpperCase()}`}}</div>
              <span class="username">{{item.addedByCurrentUser ? 'You' : item.user.name}}</span>
            </div>

            <Timeago :datetime="item.timestamp" :auto-update="60" class="font-weight-regular"></Timeago>
          </div>

          <div class="d-flex align-center">
            <div class="clickable reaction" v-for="reaction in reactions" :key="reaction.name">{{reaction.icon}} <span class="count">{{reaction.count}}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex align-center mt-1 ml-1">       
       <div class="item-icon-container">
          <PlaybackIcon :item="item.track" :itemSet="itemSet"/>
          <ThreeDotIcon :item="item.track"/>
        </div>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action} from 'nuxt-property-decorator';
  import {UI} from '~/store/constants';

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

    @Prop()
    itemSet;

    @Action('displayDetailsOverlay', {namespace: UI})
    displayDetailsOverlay;
  }
</script>

<style lang="scss">
  .feed-item-container {
    display: flex;
    align-items: flex-start;
    margin-top: 22px;

    .track-img {
      $track-img-size: 34px;

      max-width: $track-img-size;
      height: $track-img-size;
      margin-right: 12px;
      align-self: baseline;
      margin-top: 3px;
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
        width: 100%;
        display: flex;
        flex-direction: column;

        .item-info {
          display: -webkit-inline-box;
          flex-wrap: wrap;
          border: 2px solid #eeeeee;
          border-radius: 4px;
          padding: 8px 10px;
          margin-bottom: 8px;

          .track-artists {
            font-weight: normal;
            font-size: 12px;
          }
        }

        .live-item {
          border-color: $spotify-green;
        }

        .reaction {
          font-size: 16px;
          margin: 0px 6px;
          display: flex;
          align-items: center;

          .count {
            font-weight: bold;
            font-size: 10px;
            color: #888888;
            padding: 2px 0px 0px 2px;
          }
        }
      }

      .activity-info-container {
        font-size: 12px;
        color: #aaaaaa;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        width: 100%;
        font-weight: bold;

        .added-by {
          display: flex;
          align-items: center;
          color: #888888;
          margin-bottom: 2px;

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

          .username {
            color: $spotify-green;
            margin-left: 4px;
          }
        }
      }
    }
  }
</style>
<template>    
  <section class="feed-item-container">
    <v-img class="clickable track-img" :src="item.track.imgUrl.small" @click="displayDetailOverlays(item.track)"></v-img>

    <div class="feed-item fill-available">
      <div class="item-info-container">
        <div class="item-info">
          <div class="d-flex align-center">
            <span class="font-weight-bold">{{item.track.primaryLabel}} /<span class="track-artists"> {{item.track.secondaryLabel}}</span></span>
          </div>
        </div>

        <div class="activity-info-container">
          <div class="clickable added-by">
            <!-- TODO followability (if not you)-->
            <v-img v-if="item.user.img" :src="item.user.img" class="round-img-icon"></v-img>
            <div v-else class="round-profile-letter">{{`${item.user.name.substring(0, 1).toUpperCase()}`}}</div>
            <span class="username" :class="{'other-user': !item.addedByCurrentUser}">{{item.addedByCurrentUser ? 'You' : item.user.name}}</span>
          </div>

          <timeago :datetime="item.timestamp" :auto-update="true" class="font-weight-regular"></timeago>
        </div>

        <div class="d-flex flex-column">
          <div class="reaction-activity-container scroll-shadow">
            <span v-for="reaction in item.reactions" :key="reaction.id">
              <span class="font-weight-bold mr-1">{{reaction.author}}</span>
              <span class="mr-1">{{reaction.message}}</span>
              <timeago :datetime="reaction.timestamp" :auto-update="true" :converter="reactionTimestamp" class="reaction-timestamp"></timeago>
            </span>
          </div>

          <v-text-field 
            dense 
            outlined 
            placeholder="Track feelings..." 
            class="activity-chat-input" 
            :hide-details="true" 
            color="black" 
            clearable 
            width="85%"
            @keyup.enter="chatMessageSubmitted"
            v-model="chatMessage"
          >
            <template v-slot:append-outer>
              <v-icon color="black" class="clickable mr-1" @click.stop="chatMessageSubmitted()">mdi-arrow-up-circle</v-icon>
              
              <div class="reaction-container">
                <div class="clickable reaction" v-for="reaction in reactions" :key="reaction.name" @click.stop="emojiReactionPressed(reaction.code)">{{String.fromCodePoint(reaction.code)}}</div>
              </div>
            </template>
          </v-text-field>
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
  import {Component, Prop, Vue, Action, Watch} from 'nuxt-property-decorator';
  import {UI, FEED} from '~/store/constants';
  import {differenceInMinutes, differenceInHours} from 'date-fns';

  @Component
  export default class ActivityItem extends Vue {
    item;
    chatMessage = '';

    reactions = [
      {
        code: 0x1F525,
        name: 'fire'
      },
      {
        code: 0x1F612,
        name: 'nah'
      }
    ];

    @Prop()
    activity;

    @Prop()
    itemSet;

    @Action('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;

    @Action('addReactionToActivity', {namespace: FEED})
    addReactionToActivity;

    beforeMount(){
      this.item = this.activity;
    }

    @Watch('activity', {deep: true})
    getItem(newVal){
      this.item = newVal;
      this.$forceUpdate();
    }

    chatMessageSubmitted(){
      if(this.chatMessage.trim()){
        this.addReactionToActivity({activity: this.item, message: this.chatMessage});
        this.chatMessage = '';
      }
    }

    emojiReactionPressed(code){
      this.addReactionToActivity({activity: this.item, message: String.fromCodePoint(code)});
      this.chatMessage = '';
      this.$forceUpdate();
    }

    reactionTimestamp(date){
      const hourOrMoreAgo = differenceInHours(new Date(), date);

      if(hourOrMoreAgo){
        return `${hourOrMoreAgo}h`;
      }

      const minutesAgo = differenceInMinutes(new Date(), date);
      return `${minutesAgo < 1 ? 'just now' : `${minutesAgo}m`}`;
    }
  }
</script>

<style lang="scss">
  @import '~/styles/main.scss';

  .feed-item-container {
    display: flex;
    align-items: flex-start;
    margin-top: 28px;
    padding-left: $base-padding;

    .track-img {
      $track-img-size: 28px;

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
      padding-top: 6px;

      @media(min-width: 630px){
        max-width: 80%;
      }

      .item-info-container {
        $chat-font-size: 12px;

        font-weight: normal;
        font-size: 16px;
        margin-bottom: 6px;
        width: 100%;
        display: flex;
        flex-direction: column;

        .item-info {
          display: -webkit-inline-box;
          flex-wrap: wrap;
          padding-bottom: 6px;
          margin-bottom: 6px;

          .track-artists {
            font-weight: normal;
            font-size: 14px;
          }
        }

        .reaction-activity-container {
          overflow: scroll;
          display: flex;
          flex-direction: column;
          max-height: 50px;
          margin-top: 18px;
          font-size: $chat-font-size;
          color: #444444;

          .reaction-timestamp {
            font-weight: bold;
            color: #aaaaaa;
          }
        }

        .activity-chat-input {
          font-size: $chat-font-size;
          margin: 12px 0px 6px;
          align-items: center;

          .v-input__append-outer, .v-input__append-inner {
            margin-top: 4px !important;
          }

          .mdi-close {
            font-size: 20px;
            color: black;
          }

          .reaction-container {
            display: flex;
            align-items: center;
            padding-left: 1px;

            .reaction {
              font-size: 18px;
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
        }
      }

      .activity-info-container {
        font-size: 12px;
        color: #444444;
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

          .username {
            color: $primary-theme-color;
            margin-left: 4px;
          }

          .other-user {
            color: $spotify-green;
          }
        }
      }
    }
  }
</style>
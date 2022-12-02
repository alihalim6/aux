<template>    
  <section class="feed-item-container">
    <v-img class="clickable track-img" :src="item.track.imgUrl.small" @click.stop="trackImgPressed(item)"></v-img>

    <div class="feed-item fill-available">
      <div class="item-info-container">
        <div class="item-info">
          <div class="d-flex align-center" @click="itemInfoPressed(item.track)">
            <span class="clickable font-weight-bold" :class="{'transparent-bg-green-color': trackIsPlaying(item.track)}">{{item.track.primaryLabel}} /<span class="track-artists"> {{item.track.secondaryLabel}}</span></span>
          </div>
        </div>

        <div class="activity-info-container">
          <div class="clickable added-by">
            <!-- TODO followability (if not you)-->
            <v-img v-if="item.user.img" :src="item.user.img" class="round-img-icon"></v-img>
            <span :class="{'username-margin': item.user.img}">{{item.addedByCurrentUser ? 'You' : item.user.name}}</span>
          </div>

          <timeago :datetime="item.timestamp" :auto-update="true" class="font-weight-regular"></timeago>
        </div>

        <div class="d-flex flex-column">
          <div class="reaction-activity-container" :class="{'vertically-hidden': !showReactions, 'scroll-shadow-on-white': item.reactions && item.reactions.length >= 5}">
            <span v-for="reaction in item.reactions" :key="reaction.id">
              <span class="font-weight-bold mr-1">{{reaction.author}}</span>
              <span class="mr-1">{{reaction.message}}</span>
              <timeago :datetime="reaction.timestamp" :auto-update="true" :converter="reactionTimestamp" class="reaction-timestamp"></timeago>
            </span>
          </div>

          <v-text-field 
            dense 
            outlined 
            placeholder="Track talk..." 
            class="activity-chat-input" 
            :class="{'vertically-hidden': !showReactions}"
            :hide-details="true" 
            color="white" 
            width="85%"
            @keyup.enter="chatMessageSubmitted"
            v-model="chatMessage"
          >
            <template v-slot:append-outer>
              <v-icon color="white" class="clickable mr-2" @click.stop="chatMessageSubmitted()">mdi-arrow-up-circle</v-icon>
              
              <div class="reaction-container">
                <div class="clickable reaction" :class="{'pt-1': index == 1}" v-for="(reaction, index) in reactions" :key="reaction.name" @click.stop="emojiReactionPressed(reaction.code)">{{String.fromCodePoint(reaction.code)}}</div>
              </div>
            </template>
          </v-text-field>
        </div>
      </div>
    </div>

    <div class="d-flex flex-column align-end">
      <ThreeDotIcon :item="item.track" icon-class="activity-item-three-dot"/>

      <div class="clickable reaction-toggle-container">
        <v-icon color="white" small @click.stop="() => showReactions = !showReactions">mdi-chat-outline</v-icon>
        <span v-if="item.reactions && item.reactions.length" class="reaction-count">{{item.reactions.length}}</span>
      </div>
    </div>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action, Watch, Getter} from 'nuxt-property-decorator';
  import {UI, FEED, PLAYBACK_QUEUE, SPOTIFY} from '~/store/constants';
  import {differenceInMinutes, differenceInHours} from 'date-fns';
  import {isSameTrack} from '~/utils/helpers';

  @Component
  export default class ActivityItem extends Vue {
    item;
    chatMessage = '';
    showReactions = false;

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

    @Getter('currentlyPlayingItem', {namespace: SPOTIFY})
    currentlyPlayingItem;

    @Action('displayDetailOverlays', {namespace: UI})
    displayDetailOverlays;

    @Action('addReactionToActivity', {namespace: FEED})
    addReactionToActivity;

    @Action('playTrackNow', {namespace: PLAYBACK_QUEUE})
    playTrackNow;

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

    trackImgPressed(item){
      this.closeFeed();
      this.displayDetailOverlays(item.track);
    }

    itemInfoPressed(track){
      this.playTrackNow(track);
    }

    trackIsPlaying(track){
      return isSameTrack(track, this.currentlyPlayingItem);
    }
  }
</script>

<style lang="scss">
  @import '~/styles/main.scss';

  .feed-item-container {
    display: flex;
    align-items: flex-start;
    margin-bottom: 24px;

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
        font-size: 14px;
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
            font-size: 12px;
          }
        }

        .reaction-activity-container {
          overflow: scroll;
          display: flex;
          flex-direction: column;
          max-height: 83px;
          margin-top: 18px;
          font-size: $chat-font-size;
          color: white;

          .reaction-timestamp {
            font-weight: bold;
            color: white;
            font-size: 10px;
          }
        }

        .activity-chat-input {
          font-size: $chat-font-size;
          margin: 12px 0px 6px;
          align-items: center;

          fieldset {
            border-color: white;
          }

          input {
            color: white;
          }

          .v-input__append-outer, .v-input__append-inner {
            margin-top: 4px !important;
          }

          ::placeholder {
            color: rgba(255, 255, 255, 0.8);
          }
        
          .mdi-close {
            font-size: 20px;
            color: black;
          }

          .reaction-container {
            display: flex;
            align-items: center;

            .reaction {
              font-size: 18px;
              margin: 0px 4px;
            }
          }
        }
      }

      .activity-info-container {
        font-size: 12px;
        color: white;
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
          color: white;
          margin-bottom: 2px;

          .username-margin {
            margin-left: 4px;
          }
        }
      }
    }

    $reaction-toggle-margin: 14px;

    .reaction-toggle-container {
      display: flex;
      align-items: center;
      margin-right: $reaction-toggle-margin;
      margin-top: 12px;
    }

    .activity-item-play {
      color: white !important;
    }

    .activity-item-three-dot {
      color: white !important;
      padding: 0px 0px 0px 8px;
      margin: 4px calc(#{$reaction-toggle-margin} - 6px) 0px 12px;
    }

    .reaction-count {
      font-size: 12px;
      margin-left: 4px;
      padding-bottom: 2px;
    }
  }
</style>
<template>    
  <section class="mt-3 mb-2" v-if="activity && activity.track">
    <div class="hidden block-display" :id="`chat-${activity.queueId}`">add a comment/reaction for {{activity.track.primaryLabel}}</div>
    
    <v-text-field 
      dense 
      outlined 
      placeholder="Track talk..." 
      :hide-details="true" 
      class="feed-chat-input" 
      :class="{'chat-input-on-white': chatOnFeedAlert}"
      :color="color"
      width="85%"
      @keydown.enter="chatMessageSubmitted"
      v-model="chatMessage"
      clearable
      :maxlength="100"
      enterkeyhint="send"
      :aria-labelledby="`chat-${activity.queueId}`"
    >
      <template v-slot:append-outer>
        <v-icon 
          :color="submitIconColor" 
          class="clickable mr-2 submit-reaction" 
          @click.stop="chatMessageSubmitted()" 
          @keydown.enter="chatMessageSubmitted()" 
          tabindex="0" 
          :aria-label="`submit comment/reaction for ${activity.track.primaryLabel}`">mdi-arrow-up-circle
        </v-icon>
        
        <div class="reaction-container" v-if="!chatOnFeedAlert">
          <button 
            class="clickable reaction" 
            :class="{'fire': reaction.name == 'fire'}"
            v-for="reaction in reactions" 
            :key="reaction.name"
            tabindex="0"
            :aria-label="`submit ${String.fromCodePoint(reaction.code)} reaction for track`"
            @click.stop="emojiReactionPressed(reaction.code)"
            @keydown.enter="emojiReactionPressed(reaction.code)" 
          >
            {{String.fromCodePoint(reaction.code)}}
          </button>
        </div>
      </template>
    </v-text-field>
  </section>
</template>

<script>
  import {Component, Prop, Vue, Action} from 'nuxt-property-decorator';
  import {FEED} from '~/store/constants';
  import {SPLASH} from '~/utils/constants';

  @Component
  export default class FeedChatInput extends Vue {
    chatMessage = '';

    reactions = [
      {
        code: 0x1F525,
        name: 'fire'
      },
      {
        code: 0x1F44D,
        name: 'like'
      }
    ];

    @Prop()
    activity;

    @Prop({default: 'white'})
    color;

    @Prop()
    chatOnFeedAlert;

    @Prop({default: 'white'})
    submitIconColor;

    @Action('addReactionToActivity', {namespace: FEED})
    addReactionToActivity;

    chatMessageSubmitted(){
      if(this.chatMessage && this.chatMessage.trim()){
        this.addReactionToActivity({activity: this.activity, message: this.chatMessage, splash: this.isSplashPage()});
        this.handleFeedAlert();
        this.chatMessage = '';
        this.scrollReactionsDown();
      }
    }

    emojiReactionPressed(code){
      const message = String.fromCodePoint(code);
      this.addReactionToActivity({activity: this.activity, message, splash: this.isSplashPage()});
      this.handleFeedAlert(message);
      this.chatMessage = '';
      this.$forceUpdate();
      this.scrollReactionsDown();
    }

    async scrollReactionsDown(){
      await this.$nextTick();
      const reactionsContainer = document.getElementById(`${this.activity.queueId}-reactions`);

      if(reactionsContainer){
        reactionsContainer.scrollTo(0, 99999);
      }
    }

    isSplashPage(){
      return this.$route.path == `/${SPLASH}`;
    }

    handleFeedAlert(message){
      if(this.chatOnFeedAlert){
        this.$nuxt.$root.$emit('feedAlertChatSubmitted', message || this.chatMessage);
      }
    }
  }
</script>

<style lang="scss">
  @import '~/components/styles';
  @import '~/styles/globals';

  .feed-chat-input {    
    font-size: $chat-font-size;
    align-items: center;
    margin-bottom: 24px !important;
    min-width: 230px;

    fieldset {
      border-color: white;
    }

    ::placeholder {
      color: white !important;
    }

    input {
      font-weight: bold;
      color: white !important;
    }

    .v-input__append-outer, .v-input__append-inner {
      margin-top: 4px !important;
    }

    .reaction-container {
      display: flex;
      align-items: center;
      height: 30px;
      position: relative;
      top: 2px;

      .reaction {
        font-size: 18px;
        margin: 0px $reaction-emoji-margin;
        height: -webkit-fill-available;
      }

      .fire {
        padding-bottom: 1px;
      }
    }
  }

  .chat-input-on-white {
    fieldset {
      border-color: black;
    }

    input {
      color: black !important;
    }

    ::placeholder {
      color: rgba(0, 0, 0, 0.8) !important;
    }
  }

  .submit-reaction:focus-visible {
    @extend .focused;
  }
</style>
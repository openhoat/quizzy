<template>
  <div>
    <account></account>
    <div v-if="session">
      <p v-html="$t('sessionDetails', {id: session.id})"></p>
      <div class="container-fluid">
        <form class="form-horizontal">
          <div class="form-group">
            <label for="created" class="col-sm-2 control-label">{{ $t('creationDateField') }}</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" id="created"
                     :value="new Date(session.created).toLocaleString()" readonly>
            </div>
          </div>
          <div class="form-group">
            <label for="email" class="col-sm-2 control-label">{{ $t('userField') }}</label>
            <div class="col-sm-10">
              <div class="input-group">
                <div class="input-group-addon">{{ $t('emailField') }}</div>
                <input type="email" class="form-control" id="email" :value="session.user.email" readonly>
                <div class="input-group-addon">{{ $t('usernameField') }}</div>
                <input type="text" class="form-control" id="username" :value="session.user.name" readonly>
                <div class="input-group-addon">{{ $t('userProviderField') }}</div>
                <input type="text" class="form-control" id="userProvider" :value="session.user.provider" readonly>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="quiz" class="col-sm-2 control-label">{{ $t('quizField') }}</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" id="quiz" :value="session.quizId" readonly>
            </div>
          </div>
          <div class="form-group">
            <label for="score" class="col-sm-2 control-label">{{ $t('scoreField') }}</label>
            <div class="col-sm-10">
              <div class="input-group">
                <input type="number" class="form-control" id="score" :value="session.score" readonly>
                <div class="input-group-addon">/ {{ session.max }}</div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="result" class="col-sm-2 control-label">{{ $t('resultField') }}</label>
            <div class="col-sm-10">
              <div class="form-control" id="result" v-html="session.result"></div>
            </div>
          </div>
          <div class="form-group">
            <label for="duration" class="col-sm-2 control-label">{{ $t('durationField') }}</label>
            <div class="col-sm-10">
              <div class="input-group">
                <input type="number" class="form-control" id="duration" :value="session.duration" readonly>
                <div class="input-group-addon">{{ $t('secondsField') }}</div>
              </div>
            </div>
          </div>
          <div class="form-group" v-for="(answer,index) in session.answers">
            <label for="questionTitle" class="col-sm-2 control-label">
              {{ $t('questionField', {index: index + 1}) }}
            </label>
            <div class="col-sm-10">
              <label type="text" class="form-control" id="questionTitle" v-html="answer.question.title"></label>
              <div class="form-group container-fluid" v-if="answer.question.info">
                <div class="input-group-addon">{{ $t('infoField') }}</div>
                <p class="question-extra-info" id="questionInfo" v-html="answer.question.info"></p>
              </div>
              <div class="input-group">
                <div class="input-group-addon">{{ $t('scoreField') }}</div>
                <input type="number" class="form-control" id="questionScore" :value="answer.score" readonly>
                <div class="input-group-addon">{{ $t('durationField') }}</div>
                <input type="number" class="form-control" id="questionDuration" :value="answer.duration" readonly>
                <div class="input-group-addon">{{ $t('secondsField') }}</div>
              </div>
              <ul class="list-group">
                <li :class="`list-group-item ${index === answer.choice - 1 ? 'active' : ''}`"
                    v-for="(choice, index) in answer.question.choices">
                  <span v-html="choice.value"></span>
                  <span :class="`label-as-badge label ${choice.score > 0 ? 'label-success' : 'label-danger'}`">
                    {{ choice.score || 0 }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
    <loading v-else></loading>
  </div>
</template>

<script type="text/ecmascript-6">
  import $ from 'jquery'
  import hljs from 'highlightjs/highlight.pack'
  import store from '../../store'
  import helper from '../../helper'
  export default {
    data() {
      return {
        session: null,
      }
    },
    created() {
      if (!store.state.user || !store.state.user.admin) {
        return this.$router.replace('/')
      }
      const quizId = this.$route.params.id
      const email = this.$route.params.email
      helper.fetchQuizSession(quizId, email)
          .then(session => {
            this.session = session
          })
    },
    updated() {
      $(this.$el).find('pre > code').each(function() {
        const html = $(this).html()
        $(this).html(html.trim())
        hljs.highlightBlock(this)
      })
    },
  }
</script>

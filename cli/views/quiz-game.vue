<template>
  <div>
    <account></account>
    <div v-if="quiz">
      <h2>{{ $t('quiz') }} : {{ quiz.title }}</h2>
      <p v-if="quiz.description" v-html="quiz.description"></p>
      <div v-if="alert" class="alert alert-danger" role="alert">{{ alert }}</div>
      <div class="quizQuestion">
        <div v-if="questionIndex">
          <h3 v-html="$t('question', {index: questionIndex, size: quiz.questions.length})"></h3>
          <br>
          <h4 v-html="quiz.questions[questionIndex - 1].title"></h4>
          <p v-if="quiz.questions[questionIndex - 1].info" v-html="quiz.questions[questionIndex - 1].info">
          </p>
          <h3 focus>{{ $t('makeYourChoice') }}</h3>
          <div class="list-group" :key="questionIndex">
            <button type="button" class="list-group-item list-group-item-action quiz-choice"
                    v-html="quiz.questions[questionIndex - 1].choices[0].value"
                    v-on:click="choose(1)"></button>
            <button type="button" class="list-group-item list-group-item-action quiz-choice"
                    v-for="(choice, index) in quiz.questions[questionIndex - 1].choices.slice(1)"
                    v-html="choice.value"
                    v-on:click="choose(index + 2)"></button>
          </div>
          <p><em v-html="$t('elapsedTime', {duration})"></em></p>
        </div>
        <loading v-else></loading>
        <div v-if="typeof questionResult === 'boolean'" class="btn-group btn-group-justified">
          <div class="btn-group">
            <button v-on:click="next" :title="$t('gotoNextQuestion')"
                    v-on:keyup.enter="next"
                    :class="`pull-left btn btn-${questionResult ? 'success' : 'danger'} btn-lg`">
              {{ questionResult ? $t('correct') : $t('notCorrect') }} : {{ $t('gotoNextQuestion') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <loading v-else></loading>
  </div>
</template>

<script type="text/ecmascript-6">
  import $ from 'jquery'
  import hljs from 'highlightjs/highlight.pack'
  import helper from '../helper'
  import store from '../store'
  export default {
    data() {
      return {
        duration: 0,
        questionIndex: null,
        questionResult: null,
        alert: null,
      }
    },
    computed: {
      quiz: () => store.state.quiz,
    },
    methods: {
      choose(index) {
        if (this.timer) {
          clearInterval(this.timer)
          this.timer = null
        }
        const quiz = store.state.quiz
        helper.setQuizAnswer(quiz.id, this.questionIndex, index, this.duration)
        if (!helper.getContainerData('showCorrectMessage')) {
          return this.next()
        }
        $('.quiz-choice').addClass('disabled')
        $(`.quiz-choice:nth-child(${index})`).addClass('active')
        const question = quiz.questions[this.questionIndex - 1]
        const bestChoiceIndex = Object.keys(question.choices)
            .reduce((prev, cur) => (question.choices[cur].score || 0) > (question.choices[prev].score || 0) ? cur : prev)
        this.questionResult = bestChoiceIndex == index - 1
      },
      complete() {
        const quiz = store.state.quiz
        const answers = helper.getQuizAnswers(quiz)
        this.questionIndex = null
        return helper.postQuizAnswers(quiz.id, answers)
            .then(session => {
              store.commit('addSession', session)
              helper.clearQuizAnswer(quiz.id)
              return this.$router.replace(`/quizzes/${quiz.id}/result`)
            }, (jqXHR, textStatus, errorThrown) => {
              this.alert = `Error : ${jqXHR.statusText}`
            })
      },
      keyHandler(e) {
        if (e.code === 'Enter') {
          e.preventDefault()
          this.next()
        }
      },
      next() {
        $('.quiz-choice').removeClass('disabled').removeClass('active')
        const quiz = store.state.quiz
        this.questionResult = null
        const completed = helper.isQuizCompleted(quiz)
        if (completed) {
          return this.complete()
        }
        const answers = helper.getQuizAnswers(quiz)
        this.questionIndex = answers.length + 1
        this.duration = 0
        this.timer = setInterval(() => {
          this.duration++
        }, 1000)
      }
    },
    created() {
      window.addEventListener('keypress', this.keyHandler, false)
      if (!store.state.user) {
        return
      }
      const quizId = this.$route.params.id
      helper.fetchQuiz(quizId)
          .then(quiz => {
            if (!quiz) {
              return this.$router.replace('/')
            }
            store.commit('setQuiz', quiz)
            this.next()
          })
    },
    updated() {
      $(this.$el).find('pre > code').each(function() {
        hljs.highlightBlock(this)
      })
    },
    beforeDestroy() {
      window.removeEventListener('keypress', this.keyHandler)
    },
  }
</script>

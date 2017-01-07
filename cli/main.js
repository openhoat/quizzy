// 3rd party deps
import 'expose?$!expose?jQuery!jquery'
import 'bootstrap/dist/js/bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-social/bootstrap-social.css'
import 'font-awesome/css/font-awesome.css'
import $ from 'jquery'
import 'highlightjs/styles/default.css'
import Cookies from 'js-cookie'

// Vue deps
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import Vuex from 'vuex'

Vue.use(VueRouter)
Vue.use(Vuex)
Vue.use(VueI18n)
Vue.config.lang = 'fr'
Object.keys(locales).forEach(lang => {
  Vue.locale(lang, locales[lang])
})
Vue.directive('focus', {
  inserted: el => {
    el.focus()
  }
})

// App deps
import './css/style.css'
import locales from 'json!yaml!./locales.yml'
import Breadcrumb from './components/breadcrumb.vue'
import Account from './components/account.vue'
import Loading from './components/loading.vue'
import routes from './routes.js'
import helper from './helper'
import store from './store'

Vue.component('account', Account)
Vue.component('loading', Loading)

store.commit('setUser', helper.getUser())

const template = `<div class="container-fluid">
<breadcrumb></breadcrumb>
<div class="quizzy-view"><router-view></router-view></div>
</div>
`

$(() => {

  const quizzyElt = '#quizzy'
  const router = (function buildRouter() {
    return new VueRouter({routes})
  })()
  router.beforeEach((to, from, next) => {
    const initialPath = Cookies.get('initialPath')
    if (initialPath && store.state.user) {
      Cookies.remove('initialPath')
      return next(initialPath)
    }
    if (!store.state.user && to.path !== '/') {
      Cookies.set('initialPath', to.path)
      return next('/')
    }
    next()
  })

  const quizId = helper.getContainerData('quizId')
  if (quizId) {
    store.commit('setQuizId', quizId)
  }

  new Vue({
    template,
    components: {Breadcrumb},
    store,
    router,
  }).$mount(quizzyElt)

})

import {computed, onMounted, reactive, ref} from 'vue'
import {createRouter, createWebHistory} from 'vue-router'
import Home from './components/home.vue'
import Explain from './components/explain.vue'
import Start from './components/start.vue'

const routes = [
    { path: '/home', component: Home },
    { path: '/explain', component: Explain },
    { path: '/', component: Start },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const current_path = ref(window.location.hash);
window.addEventListener('hashchange', () => {
    current_path.value = window.location.hash;
});

const current_view = computed(() => {
    return routes[current_path.value.slice(1) || '/'];
});

export default router
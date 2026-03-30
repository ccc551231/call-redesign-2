import { createRouter, createWebHashHistory } from 'vue-router';
import AgentChatView from '../views/AgentChatView.vue';
import CustomerChatView from '../views/CustomerChatView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/agent',
    },
    {
      path: '/agent',
      name: 'agent',
      component: AgentChatView,
    },
    {
      path: '/customer',
      name: 'customer',
      component: CustomerChatView,
    },
  ],
});

export default router;

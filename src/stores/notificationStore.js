import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    message: '',
    type: 'success',
    timeoutId: null,
  }),
  actions: {
    show(message, options = {}) {
      if (this.timeoutId) {
        window.clearTimeout(this.timeoutId);
      }

      this.message = message;
      this.type = options.type || 'success';
      this.timeoutId = window.setTimeout(() => {
        this.clear();
      }, options.duration || 2500);
    },
    clear() {
      this.message = '';
      this.type = 'success';
      this.timeoutId = null;
    },
  },
});

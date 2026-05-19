<template>
  <main class="blank-page" aria-hidden="true"></main>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import StatusUpdateService from '../services/StatusUpdateService';

const route = useRoute();

onMounted(async () => {
  try {
    await StatusUpdateService.refreshDueByGet({
      courier_slug: route.params.courierSlug,
      all: 1,
    });
  } finally {
    window.close();
  }
});
</script>

<style scoped>
.blank-page {
  min-height: 100vh;
  background: #fff;
}
</style>

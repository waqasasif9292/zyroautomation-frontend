<template>
  <AppLayout>
    <main class="page">
      <ProfitLossForm
        title="Create Product Profit/Loss calculation Report"
        subtitle="Create a saved product-wise report from actual delivered, returned, and pending orders."
        submitLabel="Save Report"
        :options="options"
        :loading="loading"
        :saving="saving"
        :errors="errors"
        @cancel="router.push('/profit-loss-calculations')"
        @submit="submit"
      />
    </main>
  </AppLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProfitLossForm from '../../components/profit-loss/ProfitLossForm.vue';
import { useProfitLossCalculationStore } from '../../stores/profitLossCalculationStore';

const router = useRouter();
const store = useProfitLossCalculationStore();
const { options } = storeToRefs(store);
const loading = ref(true);
const saving = ref(false);
const errors = reactive({});

const setErrors = (err) => {
  const data = err.response?.data;
  if (data?.errors) {
    Object.assign(errors, Object.fromEntries(Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])));
  } else {
    errors.name = data?.message || 'Failed to save product wise profit loss report.';
  }
};

onMounted(async () => {
  await store.fetchOptions();
  loading.value = false;
});

const submit = async (payload) => {
  Object.keys(errors).forEach(key => delete errors[key]);
  saving.value = true;
  try {
    await store.createCalculation(payload);
    router.push('/profit-loss-calculations?toast=created');
  } catch (err) {
    setErrors(err);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}
</style>

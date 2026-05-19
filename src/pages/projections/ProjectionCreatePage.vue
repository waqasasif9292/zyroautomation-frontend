<template>
  <AppLayout>
    <main class="projection-form-page">
      <ProjectionForm
        title="Add Projection"
        subtitle="Create a saved monthly profit forecast."
        submitLabel="Save Projection"
        :saving="saving"
        :errors="errors"
        @cancel="router.push('/projections')"
        @submit="submit"
      />
    </main>
  </AppLayout>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProjectionForm from '../../components/projections/ProjectionForm.vue';
import { useProjectionStore } from '../../stores/projectionStore';

const router = useRouter();
const projectionStore = useProjectionStore();
const saving = ref(false);
const errors = reactive({});

const setErrors = (err) => {
  const data = err.response?.data;
  if (data?.errors) {
    Object.assign(errors, Object.fromEntries(
      Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    ));
  } else {
    errors.product_name = data?.message ?? 'Failed to save projection.';
  }
};

const submit = async (payload) => {
  Object.keys(errors).forEach(key => delete errors[key]);
  saving.value = true;
  try {
    await projectionStore.createProjection(payload);
    router.push('/projections?toast=created');
  } catch (err) {
    setErrors(err);
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.projection-form-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}
</style>

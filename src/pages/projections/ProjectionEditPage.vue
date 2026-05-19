<template>
  <AppLayout>
    <main class="projection-form-page">
      <ProjectionForm
        title="Edit Projection"
        subtitle="Update inputs and review the recalculated forecast."
        submitLabel="Save Changes"
        :initialProjection="projection"
        :loading="pageLoading"
        :saving="saving"
        :errors="errors"
        @cancel="router.push('/projections')"
        @submit="submit"
      />
    </main>
  </AppLayout>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProjectionForm from '../../components/projections/ProjectionForm.vue';
import { useProjectionStore } from '../../stores/projectionStore';

const router = useRouter();
const route = useRoute();
const projectionStore = useProjectionStore();
const id = route.params.id;
const projection = ref(null);
const pageLoading = ref(true);
const saving = ref(false);
const errors = reactive({});

const setErrors = (err) => {
  const data = err.response?.data;
  if (data?.errors) {
    Object.assign(errors, Object.fromEntries(
      Object.entries(data.errors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    ));
  } else {
    errors.product_name = data?.message ?? 'Failed to update projection.';
  }
};

onMounted(async () => {
  try {
    projection.value = await projectionStore.fetchProjection(id);
  } catch {
    router.push('/projections');
  } finally {
    pageLoading.value = false;
  }
});

const submit = async (payload) => {
  Object.keys(errors).forEach(key => delete errors[key]);
  saving.value = true;
  try {
    await projectionStore.updateProjection(id, payload);
    router.push('/projections?toast=updated');
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

<template>
  <AppLayout>
    <main class="projection-detail-page">
      <div v-if="loading" class="loading-block"></div>
      <template v-else-if="projection">
        <section class="detail-panel">
          <div class="panel-header">
            <div>
              <h1>{{ projection.product_name }}</h1>
              <p>Saved projection details and monthly forecast.</p>
            </div>
            <div class="header-actions">
              <button class="btn-secondary" type="button" @click="router.push('/projections')">Back</button>
              <button class="btn-primary" type="button" @click="router.push(`/projections/${projection.id}/edit`)">Edit</button>
            </div>
          </div>

          <div class="detail-layout">
            <section class="inputs-panel">
              <img v-if="projection.product_image_url" class="projection-image" :src="projection.product_image_url" :alt="projection.product_name">
              <dl>
                <div v-for="item in inputItems" :key="item.label">
                  <dt>{{ item.label }}</dt>
                  <dd>{{ item.value }}</dd>
                </div>
              </dl>
            </section>

            <ProjectionResultsPanel :calculations="projection.calculations" />
          </div>
        </section>
      </template>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../../layouts/AppLayout.vue';
import ProjectionResultsPanel from '../../components/projections/ProjectionResultsPanel.vue';
import { useProjectionStore } from '../../stores/projectionStore';

const router = useRouter();
const route = useRoute();
const projectionStore = useProjectionStore();
const projection = ref(null);
const loading = ref(true);

const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;
const percent = (value) => `${Number(value || 0).toLocaleString()}%`;

const inputItems = computed(() => {
  if (!projection.value) return [];

  return [
    { label: 'Sale Price', value: money(projection.value.sale_price) },
    { label: 'Product Cost', value: money(projection.value.product_cost) },
    { label: 'Bulity Cost', value: money(projection.value.bulity_cost) },
    { label: 'Packing Cost', value: money(projection.value.packing_cost) },
    { label: 'Delivery Charges', value: money(projection.value.delivery_charges) },
    { label: 'Tax', value: percent(projection.value.tax_percentage) },
    { label: 'Ads Cost Per Day', value: money(projection.value.ads_cost_per_day) },
    { label: 'Ads Tax', value: percent(projection.value.ads_tax_percentage) },
    { label: 'CPC', value: money(projection.value.cpc) },
    { label: 'Cancel Rate', value: percent(projection.value.cancel_rate) },
    { label: 'Return Rate', value: percent(projection.value.return_rate) },
  ];
});

onMounted(async () => {
  try {
    projection.value = await projectionStore.fetchProjection(route.params.id);
  } catch {
    router.push('/projections');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.projection-detail-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
}

.detail-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h1 {
  margin: 0 0 4px;
  color: #1e293b;
  font-size: 20px;
  font-weight: 800;
}

.panel-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-secondary,
.btn-primary {
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.btn-secondary {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.btn-primary {
  border: 1px solid #1e293b;
  background: #1e293b;
  color: #fff;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(300px, 440px) minmax(0, 1fr);
  gap: 18px;
  padding: 24px 28px;
  background: #f8fafc;
}

.inputs-panel {
  align-self: start;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.projection-image {
  display: block;
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-bottom: 1px solid #e2e8f0;
}

dl {
  margin: 0;
  padding: 10px 16px;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid #f1f5f9;
}

dl div:last-child {
  border-bottom: 0;
}

dt {
  color: #64748b;
  font-size: 13px;
}

dd {
  margin: 0;
  color: #1e293b;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
}

.loading-block {
  height: 520px;
  border-radius: 12px;
  background: #e2e8f0;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
}

@media (max-width: 1050px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>

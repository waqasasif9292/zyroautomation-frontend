<template>
  <AppLayout>
    <main class="webhook-page">
      <section class="webhook-panel">
        <header class="webhook-header">
          <div>
            <h1>PostEx Webhooks</h1>
            <p>Incoming PostEx status payloads, newest first.</p>
          </div>
          <button class="refresh-btn" type="button" :disabled="loading" @click="fetchEvents">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M16 8h5V3" />
            </svg>
            Refresh
          </button>
        </header>

        <section class="url-section">
          <div v-for="webhook in webhookUrls" :key="webhook.id" class="url-row">
            <div>
              <span class="url-label">{{ webhook.name }}</span>
              <code>{{ webhook.url }}</code>
            </div>
            <button class="copy-btn" type="button" @click="copyUrl(webhook.url)">Copy</button>
          </div>
          <div v-if="!loading && webhookUrls.length === 0" class="empty-url">
            No PostEx integration found for this account.
          </div>
        </section>

        <div class="filters-bar">
          <div class="search-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              v-model="search"
              class="search-input"
              type="text"
              placeholder="Search tracking, reference, status, reason"
              @keydown.enter="applySearch"
            >
          </div>
          <span class="results-count">{{ pagination?.total || 0 }} events</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Received</th>
                <th>Status Time</th>
                <th>Tracking</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Return</th>
                <th>Reason</th>
                <th>Order</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="state-cell">Loading webhook events...</td>
              </tr>
              <tr v-else-if="events.length === 0">
                <td colspan="8" class="state-cell">No PostEx webhook events received yet.</td>
              </tr>
              <tr
                v-for="event in events"
                v-else
                :key="event.id"
                :class="{ selected: selectedEvent?.id === event.id }"
                @click="selectedEvent = event"
              >
                <td>{{ formatDateTime(event.received_at) }}</td>
                <td>{{ formatDateTime(event.status_updated_at) }}</td>
                <td class="mono-cell">{{ event.tracking_number || '-' }}</td>
                <td class="mono-cell">{{ event.order_reference_number || '-' }}</td>
                <td><span class="status-pill">{{ event.order_status || '-' }}</span></td>
                <td>{{ event.return_requested ? 'Yes' : 'No' }}</td>
                <td class="reason-cell">{{ event.last_attempt_reason || '-' }}</td>
                <td>
                  <button
                    v-if="event.matched_order_id"
                    class="order-link"
                    type="button"
                    @click.stop="openOrder(event.matched_order_id)"
                  >
                    Open
                  </button>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="pagination && pagination.total_pages > 1" class="pager">
          <button type="button" :disabled="!pagination.has_prev || loading" @click="changePage(pagination.current_page - 1)">Previous</button>
          <span>Page {{ pagination.current_page }} of {{ pagination.total_pages }}</span>
          <button type="button" :disabled="!pagination.has_next || loading" @click="changePage(pagination.current_page + 1)">Next</button>
        </footer>
      </section>

      <aside class="payload-panel">
        <header>
          <h2>Raw Content</h2>
          <span>{{ selectedEvent ? selectedEvent.tracking_number : 'Select an event' }}</span>
        </header>
        <pre>{{ selectedPayload }}</pre>
      </aside>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import PostexWebhookService from '../services/PostexWebhookService';

const router = useRouter();
const loading = ref(false);
const events = ref([]);
const webhookUrls = ref([]);
const pagination = ref(null);
const selectedEvent = ref(null);
const search = ref('');
const appliedSearch = ref('');
const page = ref(1);
let searchTimer = null;

const selectedPayload = computed(() => {
  if (!selectedEvent.value) {
    return 'No webhook event selected.';
  }

  return JSON.stringify(selectedEvent.value.payload || {}, null, 2);
});

watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applySearch, 450);
});

const fetchEvents = async () => {
  loading.value = true;
  try {
    const response = await PostexWebhookService.getEvents({
      page: page.value,
      per_page: 50,
      search: appliedSearch.value || undefined,
    });
    webhookUrls.value = response.data.data.webhook_urls || [];
    events.value = response.data.data.events || [];
    pagination.value = response.data.data.pagination || null;
    if (!selectedEvent.value || !events.value.some(event => event.id === selectedEvent.value.id)) {
      selectedEvent.value = events.value[0] || null;
    }
  } finally {
    loading.value = false;
  }
};

const applySearch = () => {
  appliedSearch.value = search.value.trim();
  page.value = 1;
  fetchEvents();
};

const changePage = (nextPage) => {
  page.value = nextPage;
  fetchEvents();
};

const copyUrl = async (url) => {
  await navigator.clipboard.writeText(url);
};

const openOrder = (id) => {
  router.push(`/orders/${id}/tracking`);
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

onMounted(fetchEvents);
</script>

<style scoped>
.webhook-page {
  min-height: 100vh;
  padding: 32px;
  background: #f1f5f9;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 20px;
}

.webhook-panel,
.payload-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.webhook-header,
.payload-panel header {
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.webhook-header h1,
.payload-panel h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #1e293b;
}

.webhook-header p,
.payload-panel span {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.refresh-btn,
.copy-btn,
.order-link,
.pager button {
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  background: #2563eb;
  color: #fff;
}

.url-section {
  padding: 18px 28px;
  border-bottom: 1px solid #e2e8f0;
  display: grid;
  gap: 10px;
}

.url-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
}

.url-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 800;
  color: #475569;
}

.url-row code {
  display: block;
  color: #0f172a;
  white-space: normal;
  overflow-wrap: anywhere;
}

.copy-btn,
.order-link {
  padding: 8px 12px;
  background: #e0f2fe;
  color: #0369a1;
}

.empty-url {
  color: #64748b;
  font-size: 14px;
}

.filters-bar {
  padding: 18px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 440px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 36px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
}

.results-count {
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th {
  text-align: left;
  padding: 12px 14px;
  color: #64748b;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  text-transform: uppercase;
}

td {
  padding: 13px 14px;
  border-bottom: 1px solid #edf2f7;
  color: #334155;
  vertical-align: middle;
}

tbody tr {
  cursor: pointer;
}

tbody tr:hover,
tbody tr.selected {
  background: #f8fafc;
}

.mono-cell {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.status-pill {
  display: inline-flex;
  max-width: 210px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.reason-cell {
  max-width: 220px;
  overflow-wrap: anywhere;
}

.state-cell {
  text-align: center;
  color: #64748b;
  padding: 28px;
}

.pager {
  padding: 16px 28px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.pager button {
  padding: 8px 12px;
  background: #e2e8f0;
  color: #334155;
}

.payload-panel {
  align-self: start;
  position: sticky;
  top: 24px;
}

.payload-panel pre {
  margin: 0;
  padding: 20px;
  min-height: 360px;
  max-height: calc(100vh - 180px);
  overflow: auto;
  background: #0f172a;
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.55;
}

@media (max-width: 1180px) {
  .webhook-page {
    grid-template-columns: 1fr;
  }

  .payload-panel {
    position: static;
  }
}

@media (max-width: 760px) {
  .webhook-page {
    padding: 18px;
  }

  .webhook-header,
  .filters-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .search-wrap {
    max-width: none;
    width: 100%;
  }
}
</style>

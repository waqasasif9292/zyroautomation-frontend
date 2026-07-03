<template>
  <AppLayout>
    <main class="performance-page">
      <section class="page-head">
        <div>
          <p class="eyebrow">Operations</p>
          <h1>{{ copy.title }}</h1>
          <p>{{ copy.subtitle }}</p>
        </div>
        <button class="refresh-btn" type="button" :disabled="loading" @click="fetchData">
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </section>

      <section class="report-toolbar">
        <div class="toolbar-copy">
          <strong>Report scope</strong>
          <span>{{ toolbarCopy }}</span>
        </div>
        <form class="toolbar-controls" :class="{ cancel: !isReturnReport }" @submit.prevent="applyGlobalFilters">
          <label>
            <span>Brand</span>
            <select v-model="globalDraft.brand_id">
              <option value="">All brands</option>
              <option v-for="brand in data.filters.brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
            </select>
          </label>
          <label>
            <span>From</span>
            <input v-model="globalDraft.report_start_date" type="date">
          </label>
          <label>
            <span>To</span>
            <input v-model="globalDraft.report_end_date" type="date">
          </label>
          <label v-if="isReturnReport">
            <span>Courier</span>
            <select v-model="globalDraft.courier_integration_id">
              <option value="">All couriers</option>
              <option v-for="courier in data.filters.couriers" :key="courier.id" :value="courier.id">{{ courier.name }}</option>
            </select>
          </label>
          <label>
            <span>Source</span>
            <select v-model="globalDraft.source">
              <option value="">All sources</option>
              <option v-for="source in data.filters.sources" :key="source" :value="source">{{ source }}</option>
            </select>
          </label>
          <div class="toolbar-actions">
            <button class="primary-btn" type="submit">Apply</button>
            <button class="secondary-btn" type="button" @click="clearGlobalFilters">Reset</button>
          </div>
        </form>
      </section>

      <nav class="tabs" aria-label="Performance tabs">
        <button v-for="tab in tabs" :key="tab.key" :class="{ active: activeTab === tab.key }" type="button" @click="setTab(tab.key)">
          {{ tab.label }}
        </button>
      </nav>

      <section v-if="activeTab === 'dashboard'" class="panel">
        <div class="panel-head">
          <div>
            <h2>{{ copy.dashboardTitle }}</h2>
            <p>Identify product-level risk within the selected report scope.</p>
          </div>
        </div>

        <div class="metric-grid">
          <article class="metric-card">
            <span>Total orders</span>
            <strong>{{ formatNumber(data.dashboard.total_orders) }}</strong>
          </article>
          <article class="metric-card danger">
            <span>{{ copy.targetOrdersLabel }}</span>
            <strong>{{ formatNumber(data.dashboard.target_orders) }}</strong>
          </article>
          <article class="metric-card warn">
            <span>{{ copy.percentageLabel }}</span>
            <strong>{{ formatPercent(data.dashboard.percentage) }}</strong>
          </article>
        </div>

        <div class="report-table-head">
          <h3>Products <span class="muted-count">({{ formatNumber(productRows.length) }})</span></h3>
          <button class="secondary-btn export-btn" type="button" @click="exportProductCsv">Export CSV</button>
        </div>

        <DataTable
          :columns="productColumns"
          :rows="productRows"
          :export-name="`${copy.title} products`"
          :show-export="false"
          @row-click="drilldownProduct"
          :empty-text="`No product data found for this ${copy.shortLabel.toLowerCase()} date range.`"
        />
      </section>

      <section v-else-if="activeTab === 'city'" class="panel">
        <div class="panel-head">
          <div>
            <h2>{{ copy.cityTitle }} <span class="muted-count">({{ formatNumber(filteredCityRows.length) }})</span></h2>
            <p>Find destinations with high {{ copy.rateNoun.toLowerCase() }} rates within the selected scope.</p>
            <p v-if="citySearch.trim()">Filtered from {{ formatNumber(cityRows.length) }} cities</p>
          </div>
          <button class="secondary-btn export-btn" type="button" @click="exportCityCsv">Export CSV</button>
        </div>

        <form class="filter-grid compact" @submit.prevent="applyCitySearch">
          <input v-model="citySearchDraft" type="search" placeholder="Search cities">
          <div class="filter-actions">
            <button class="primary-btn" type="submit">Search</button>
            <button class="secondary-btn" type="button" @click="clearCitySearch">Clear</button>
          </div>
        </form>

        <OrderPagination
          class="report-pagination-top"
          :pagination="cityPagination"
          item-label="cities"
          @page-change="setCityPage"
        />

        <DataTable
          :columns="cityColumns"
          :rows="paginatedCityRows"
          :export-name="`${copy.title} cities`"
          :show-export="false"
          @row-click="drilldownCity"
          empty-text="No city data found for this date range."
        />

        <OrderPagination
          class="report-pagination-bottom"
          :pagination="cityPagination"
          item-label="cities"
          @page-change="setCityPage"
        />
      </section>

      <section v-else-if="activeTab === 'courier' && isReturnReport" class="panel">
        <div class="panel-head">
          <div>
            <h2>Courier wise returns</h2>
            <p>Compare return performance across courier integrations.</p>
          </div>
        </div>

        <div class="metric-grid">
          <article class="metric-card">
            <span>Total orders</span>
            <strong>{{ formatNumber(data.courier.total_orders) }}</strong>
          </article>
          <article class="metric-card danger">
            <span>Returned orders</span>
            <strong>{{ formatNumber(data.courier.target_orders) }}</strong>
          </article>
          <article class="metric-card warn">
            <span>Return percentage</span>
            <strong>{{ formatPercent(data.courier.percentage) }}</strong>
          </article>
        </div>

        <div class="report-table-head">
          <h3>Couriers <span class="muted-count">({{ formatNumber(courierRows.length) }})</span></h3>
          <button class="secondary-btn export-btn" type="button" @click="exportCourierCsv">Export CSV</button>
        </div>

        <DataTable
          :columns="courierColumns"
          :rows="courierRows"
          export-name="Return Report couriers"
          :show-export="false"
          @row-click="drilldownCourier"
          empty-text="No courier data found for this date range."
        />
      </section>

      <section v-else class="panel">
        <div class="panel-head">
          <div>
            <h2>{{ copy.ordersTitle }} <span class="muted-count">({{ formatNumber(data.orders.pagination.total) }})</span></h2>
            <p>Search by order, customer, contact, or tracking number.</p>
          </div>
          <button class="secondary-btn export-btn" type="button" @click="exportOrdersCsv">Export CSV</button>
        </div>

        <form class="filter-grid compact" @submit.prevent="applyOrderFilters">
          <input v-model="orderDraft.keyword" type="search" placeholder="Search orders">
          <div class="filter-actions">
            <button class="primary-btn" type="submit">Search</button>
            <button class="secondary-btn" type="button" @click="clearOrderFilters">Clear</button>
          </div>
        </form>

        <OrderPagination
          class="report-pagination-top"
          :pagination="data.orders.pagination"
          item-label="orders"
          @page-change="setPage"
        />

        <DataTable
          :columns="orderColumns"
          :rows="orderRows"
          :export-name="`${copy.title} orders`"
          :show-export="false"
          empty-text="No matching orders found."
        />

        <OrderPagination
          class="report-pagination-bottom"
          :pagination="data.orders.pagination"
          item-label="orders"
          @page-change="setPage"
        />
      </section>
    </main>
  </AppLayout>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../layouts/AppLayout.vue';
import OrderPagination from '../components/orders/OrderPagination.vue';
import OrderPerformanceService from '../services/OrderPerformanceService';
import { useAuthStore } from '../stores/authStore';
import { formatPhone } from '../utils/phoneNormalizer';

const DateRangeControls = defineComponent({
  props: {
    from: { type: String, default: '' },
    to: { type: String, default: '' },
  },
  emits: ['apply', 'clear'],
  setup(props, { emit }) {
    const local = reactive({ from: props.from || '', to: props.to || '' });
    watch(() => props.from, value => { local.from = value || ''; });
    watch(() => props.to, value => { local.to = value || ''; });

    return () => h('form', {
      class: 'date-controls',
      onSubmit: (event) => {
        event.preventDefault();
        emit('apply', { from: local.from, to: local.to });
      },
    }, [
      h('input', { type: 'date', value: local.from, onInput: event => { local.from = event.target.value; } }),
      h('input', { type: 'date', value: local.to, onInput: event => { local.to = event.target.value; } }),
      h('button', { class: 'primary-btn', type: 'submit' }, 'Filter'),
      h('button', { class: 'secondary-btn', type: 'button', onClick: () => emit('clear') }, 'Reset'),
    ]);
  },
});

const DataTable = defineComponent({
  props: {
    columns: { type: Array, required: true },
    rows: { type: Array, required: true },
    emptyText: { type: String, default: 'No records found.' },
    exportName: { type: String, default: 'report' },
    showExport: { type: Boolean, default: true },
  },
  emits: ['row-click'],
  setup(props, { emit }) {
    const sortKey = ref('');
    const sortDir = ref('desc');
    const sortedRows = computed(() => {
      if (!sortKey.value) return props.rows;
      const column = props.columns.find(item => item.key === sortKey.value);
      if (!column) return props.rows;

      return [...props.rows].sort((a, b) => {
        const valueA = column.sortValue ? column.sortValue(a) : a[column.key];
        const valueB = column.sortValue ? column.sortValue(b) : b[column.key];
        const result = typeof valueA === 'number' && typeof valueB === 'number'
          ? valueA - valueB
          : String(valueA ?? '').localeCompare(String(valueB ?? ''));
        return sortDir.value === 'asc' ? result : -result;
      });
    });
    const setSort = (column) => {
      if (!column.sortable) return;
      if (sortKey.value === column.key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey.value = column.key;
        sortDir.value = 'desc';
      }
    };
    const exportCsv = () => {
      const plainColumns = props.columns.filter(column => column.export !== false);
      const csvRows = [
        plainColumns.map(column => csvEscape(column.label)).join(','),
        ...sortedRows.value.map(row => plainColumns.map(column => csvEscape(row[column.key] ?? '')).join(',')),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${props.exportName.replace(/\s+/g, '-').toLowerCase()}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    return () => h('div', { class: 'table-wrap' }, [
      props.showExport ? h('div', { class: 'table-actions' }, [
        h('button', { type: 'button', class: 'secondary-btn', onClick: exportCsv }, 'Export CSV'),
      ]) : null,
      h('table', { class: 'data-table' }, [
        h('thead', [
          h('tr', props.columns.map(column => h('th', { key: column.key }, [
            h('button', {
              type: 'button',
              class: ['th-button', { sortable: column.sortable }],
              onClick: () => setSort(column),
            }, `${column.label}${sortKey.value === column.key ? (sortDir.value === 'asc' ? ' ↑' : ' ↓') : ''}`),
          ]))),
        ]),
        h('tbody', sortedRows.value.length
          ? sortedRows.value.map((row, index) => h('tr', {
              key: row.id || row.product_key || row.city || row.courier_integration_id || index,
              class: { clickable: row.drilldown },
              onClick: () => row.drilldown && emit('row-click', row),
            }, props.columns.map(column => h('td', { key: column.key }, column.render ? column.render(row) : (row[column.key] ?? '-')))))
          : [h('tr', [h('td', { colspan: props.columns.length, class: 'empty-cell' }, props.emptyText)])]),
      ]),
    ]);
  },
});

const csvEscape = (value) => {
  const stringValue = String(value ?? '');
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
};

const exportCsv = (columns, rows, exportName) => {
  const plainColumns = columns.filter(column => column.export !== false);
  const csvRows = [
    plainColumns.map(column => csvEscape(column.label)).join(','),
    ...rows.map(row => plainColumns.map(column => csvEscape(row[column.key] ?? '')).join(',')),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${exportName.replace(/\s+/g, '-').toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const citySearch = ref('');
const citySearchDraft = ref('');
const cityPage = ref(1);
const cityPerPage = 100;

const defaultData = () => ({
  summary: { today: 0, yesterday: 0, seven_days: 0, this_month: 0, last_month: 0, total: 0 },
  dashboard: { total_orders: 0, target_orders: 0, percentage: 0, top_products: [] },
  city: { total_orders: 0, target_orders: 0, percentage: 0, cities: [] },
  courier: { total_orders: 0, target_orders: 0, percentage: 0, couriers: [] },
  orders: { items: [], pagination: { current_page: 1, per_page: 50, total: 0, total_pages: 1, has_next: false, has_prev: false } },
  filters: { brands: [], couriers: [], sources: [] },
});

const data = ref(defaultData());
const orderDraft = reactive({ keyword: '', date_from: '', date_to: '', courier_integration_id: '', source: '' });
const globalDraft = reactive({ brand_id: '', report_start_date: '', report_end_date: '', courier_integration_id: '', source: '' });

const type = computed(() => route.meta.performanceType || 'cancelled');
const isReturnReport = computed(() => type.value === 'returns');
const activeTab = computed(() => route.query.tab || 'dashboard');
const toolbarCopy = computed(() => isReturnReport.value
  ? 'Filter all return insights by brand, courier, source, and date range.'
  : 'Filter all cancellation insights by brand, source, and date range.');
const copy = computed(() => type.value === 'returns'
  ? {
      title: 'Return Report',
      subtitle: 'Track returned orders by product, city, and individual order.',
      shortLabel: 'Return',
      dashboardTitle: 'Product return risk',
      cityTitle: 'City wise returns',
      ordersTitle: 'Returned Orders',
      targetOrdersLabel: 'Returned orders',
      percentageLabel: 'Return percentage',
      rateNoun: 'Return',
      targetColumn: 'Returns',
      percentColumn: 'Return %',
    }
  : {
      title: 'Cancel Report',
      subtitle: 'Track cancellation volume, cancellation rate, and affected products.',
      shortLabel: 'Cancel',
      dashboardTitle: 'Cancel report',
      cityTitle: 'City wise cancellations',
      ordersTitle: 'Cancelled Orders',
      targetOrdersLabel: 'Cancelled orders',
      percentageLabel: 'Cancel percentage',
      rateNoun: 'Cancel',
      targetColumn: 'Cancelled',
      percentColumn: 'Cancel %',
    });

const filters = computed(() => ({
  dash_start_date: route.query.dash_start_date || '',
  dash_end_date: route.query.dash_end_date || '',
  report_start_date: route.query.report_start_date || '',
  report_end_date: route.query.report_end_date || '',
  brand_id: route.query.brand_id || '',
  city_start_date: route.query.city_start_date || '',
  city_end_date: route.query.city_end_date || '',
  courier_start_date: route.query.courier_start_date || '',
  courier_end_date: route.query.courier_end_date || '',
  keyword: route.query.keyword || '',
  date_from: isReturnReport.value ? '' : (route.query.date_from || ''),
  date_to: isReturnReport.value ? '' : (route.query.date_to || ''),
  courier_integration_id: route.query.courier_integration_id || '',
  source: route.query.source || '',
  page: route.query.page || 1,
}));

const tabs = computed(() => [
  { key: 'dashboard', label: isReturnReport.value ? 'Products' : 'Dashboard' },
  { key: 'city', label: 'City' },
  ...(isReturnReport.value ? [{ key: 'courier', label: 'Courier' }] : []),
  { key: 'orders', label: 'Orders' },
]);

const productColumns = computed(() => [
  { key: 'index', label: '#', sortable: true, sortValue: row => row.raw_index },
  { key: 'product_name', label: 'Product name', sortable: true },
  { key: 'total_orders', label: 'Orders', sortable: true, sortValue: row => row.raw_total_orders },
  { key: 'target_orders', label: copy.value.targetColumn, sortable: true, sortValue: row => row.raw_target_orders },
  { key: 'risk', label: 'Risk', sortable: true, sortValue: row => row.raw_percentage, render: row => riskCell(row) },
]);
const cityColumns = computed(() => [
  { key: 'index', label: '#', sortable: true, sortValue: row => row.raw_index },
  { key: 'city', label: 'City', sortable: true },
  { key: 'total_orders', label: 'Total orders', sortable: true, sortValue: row => row.raw_total_orders },
  { key: 'target_orders', label: copy.value.targetColumn, sortable: true, sortValue: row => row.raw_target_orders },
  { key: 'risk', label: copy.value.percentColumn, sortable: true, sortValue: row => row.raw_percentage, render: row => riskCell(row) },
]);
const courierColumns = computed(() => [
  { key: 'index', label: '#', sortable: true, sortValue: row => row.raw_index },
  { key: 'courier_name', label: 'Courier', sortable: true },
  { key: 'total_orders', label: 'Total orders', sortable: true, sortValue: row => row.raw_total_orders },
  { key: 'target_orders', label: 'Returns', sortable: true, sortValue: row => row.raw_target_orders },
  { key: 'risk', label: 'Return %', sortable: true, sortValue: row => row.raw_percentage, render: row => riskCell(row) },
]);
const orderColumns = computed(() => [
  { key: 'index', label: 'Sr.' },
  { key: 'created_at', label: 'Created at' },
  { key: 'status', label: 'Status', render: row => statusCell(row) },
  { key: 'brand_name', label: 'Brand' },
  { key: 'courier_name', label: 'Courier' },
  { key: 'source', label: 'Source' },
  { key: 'customer_name', label: 'Name' },
  { key: 'contact', label: 'Contact' },
  { key: 'cash_on_delivery', label: 'COD' },
  {
    key: 'tracking_number',
    label: 'Tracking / Address',
    render: row => row.raw_tracking_number
      ? h('button', {
          type: 'button',
          class: 'tracking-code',
          onClick: () => handleTrack(row.id),
        }, row.raw_tracking_number)
      : h('span', { class: 'tracking-empty' }, row.address || '-'),
  },
]);

const productRows = computed(() => (data.value.dashboard.top_products || []).map((item, index) => ({
  ...item,
  index: index + 1,
  raw_index: index + 1,
  raw_total_orders: Number(item.total_orders || 0),
  raw_target_orders: Number(item.target_orders || 0),
  raw_percentage: Number(item.percentage || 0),
  risk_label: riskLabel(item),
  risk: `${formatPercent(item.percentage)} ${riskLabel(item)}`,
  drilldown: isReturnReport.value,
  total_orders: formatNumber(item.total_orders),
  target_orders: formatNumber(item.target_orders),
  percentage: formatPercent(item.percentage),
})));
const cityRows = computed(() => (data.value.city.cities || []).map((item, index) => ({
  ...item,
  index: index + 1,
  raw_index: index + 1,
  raw_total_orders: Number(item.total_orders || 0),
  raw_target_orders: Number(item.target_orders || 0),
  raw_percentage: Number(item.percentage || 0),
  risk_label: riskLabel(item),
  risk: `${formatPercent(item.percentage)} ${riskLabel(item)}`,
  drilldown: isReturnReport.value,
  total_orders: formatNumber(item.total_orders),
  target_orders: formatNumber(item.target_orders),
  percentage: formatPercent(item.percentage),
})));
const filteredCityRows = computed(() => {
  const keyword = citySearch.value.trim().toLowerCase();
  if (!keyword) return cityRows.value;

  return cityRows.value.filter(row => String(row.city || '').toLowerCase().includes(keyword));
});
const cityPagination = computed(() => {
  const total = filteredCityRows.value.length;
  const totalPages = Math.max(1, Math.ceil(total / cityPerPage));
  const currentPage = Math.min(cityPage.value, totalPages);

  return {
    current_page: currentPage,
    per_page: cityPerPage,
    total,
    total_pages: totalPages,
    has_next: currentPage < totalPages,
    has_prev: currentPage > 1,
  };
});
const paginatedCityRows = computed(() => {
  const start = (cityPagination.value.current_page - 1) * cityPerPage;

  return filteredCityRows.value.slice(start, start + cityPerPage).map((row, index) => ({
    ...row,
    index: start + index + 1,
    raw_index: start + index + 1,
  }));
});
const courierRows = computed(() => (data.value.courier.couriers || []).map((item, index) => ({
  ...item,
  index: index + 1,
  courier_name: titleCase(item.courier_name || ''),
  raw_index: index + 1,
  raw_total_orders: Number(item.total_orders || 0),
  raw_target_orders: Number(item.target_orders || 0),
  raw_percentage: Number(item.percentage || 0),
  risk_label: riskLabel(item),
  risk: `${formatPercent(item.percentage)} ${riskLabel(item)}`,
  drilldown: true,
  total_orders: formatNumber(item.total_orders),
  target_orders: formatNumber(item.target_orders),
  percentage: formatPercent(item.percentage),
})));
const orderRows = computed(() => {
  const pagination = data.value.orders.pagination || {};
  const offset = ((pagination.current_page || 1) - 1) * (pagination.per_page || 50);

  return (data.value.orders.items || []).map((item, index) => ({
    ...item,
    index: offset + index + 1,
    created_at: formatDate(item.created_at || item.shopify_created_at),
    raw_status: item.status || '',
    status: titleCase(item.status || ''),
    brand_name: item.brand_name || 'Unassigned',
    courier_name: titleCase(item.courier_name || ''),
    contact: formatPhone(item.contact),
    cash_on_delivery: money(item.cash_on_delivery),
    raw_tracking_number: item.tracking_number || '',
    tracking_number: item.tracking_number || item.address || '-',
  }));
});

const formatNumber = value => Number(value || 0).toLocaleString();
const formatPercent = value => `${Number(value || 0).toFixed(2)}%`;
const money = value => `Rs ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const formatDate = value => value ? new Date(value).toLocaleString() : '-';
const titleCase = value => String(value || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, letter => letter.toUpperCase());
const riskLabel = (item) => {
  const total = Number(item.total_orders || 0);
  const percentage = Number(item.percentage || 0);
  if (total < 5) return 'Low sample';
  if (percentage >= 20 && total >= 10) return 'High risk';
  if (percentage >= 10) return 'Watchlist';
  return 'Normal';
};
const riskTone = row => ({
  'Low sample': 'sample',
  'High risk': 'high',
  Watchlist: 'watch',
  Normal: 'normal',
}[row.risk_label] || 'normal');
const riskCell = row => h('div', { class: 'risk-cell' }, [
  h('div', { class: 'risk-top' }, [
    h('strong', row.percentage),
    h('span', { class: ['risk-badge', riskTone(row)] }, row.risk_label),
  ]),
  h('span', { class: 'risk-bar' }, [
    h('i', { style: { width: `${Math.min(100, row.raw_percentage)}%` }, class: riskTone(row) }),
  ]),
]);
const statusCell = row => h('span', { class: 'status-badge' }, titleCase(row.raw_status || row.status));
const exportProductCsv = () => exportCsv(productColumns.value, productRows.value, `${copy.value.title} products`);
const exportCityCsv = () => exportCsv(cityColumns.value, filteredCityRows.value, `${copy.value.title} cities`);
const exportCourierCsv = () => exportCsv(courierColumns.value, courierRows.value, 'Return Report couriers');
const exportOrdersCsv = () => exportCsv(orderColumns.value, orderRows.value, `${copy.value.title} orders`);
const setCityPage = page => {
  cityPage.value = Math.min(Math.max(Number(page) || 1, 1), cityPagination.value.total_pages);
};
const applyCitySearch = () => {
  citySearch.value = citySearchDraft.value.trim();
};
const clearCitySearch = () => {
  citySearchDraft.value = '';
  citySearch.value = '';
};

const syncDraftFromQuery = () => {
  Object.assign(orderDraft, {
    keyword: filters.value.keyword,
    date_from: filters.value.date_from,
    date_to: filters.value.date_to,
    courier_integration_id: filters.value.courier_integration_id,
    source: filters.value.source,
  });
  Object.assign(globalDraft, {
    brand_id: filters.value.brand_id,
    report_start_date: filters.value.report_start_date,
    report_end_date: filters.value.report_end_date,
    courier_integration_id: filters.value.courier_integration_id,
    source: filters.value.source,
  });
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = Object.fromEntries(Object.entries(route.query).filter(([, value]) => value !== '' && value !== null && value !== undefined));
    delete params.dash_start_date;
    delete params.dash_end_date;
    delete params.city_start_date;
    delete params.city_end_date;
    delete params.courier_start_date;
    delete params.courier_end_date;
    delete params.date_from;
    delete params.date_to;
    if (!isReturnReport.value) {
      delete params.courier_integration_id;
    }
    const res = type.value === 'returns'
      ? await OrderPerformanceService.getReturns(params)
      : await OrderPerformanceService.getCancelled(params);
    data.value = { ...defaultData(), ...(res.data.data || {}) };
  } finally {
    loading.value = false;
  }
};

const pushQuery = (updates) => {
  router.push({
    path: route.path,
    query: Object.fromEntries(Object.entries({ ...route.query, ...updates }).filter(([, value]) => value !== '' && value !== null && value !== undefined)),
  });
};

const setTab = tab => pushQuery({ tab, page: undefined });
const setPage = page => pushQuery({ tab: 'orders', page });
const handleTrack = (id) => {
  authStore.prepareTabHandoff();
  window.open(router.resolve(`/orders/${id}/tracking`).href, '_blank', 'noopener');
};
const applyDashboardDates = ({ from, to }) => pushQuery({ tab: 'dashboard', dash_start_date: from, dash_end_date: to, page: undefined });
const clearDashboardDates = () => pushQuery({ tab: 'dashboard', dash_start_date: undefined, dash_end_date: undefined, page: undefined });
const applyCityDates = ({ from, to }) => pushQuery({ tab: 'city', city_start_date: from, city_end_date: to, page: undefined });
const clearCityDates = () => pushQuery({ tab: 'city', city_start_date: undefined, city_end_date: undefined, page: undefined });
const applyCourierDates = ({ from, to }) => pushQuery({ tab: 'courier', courier_start_date: from, courier_end_date: to, page: undefined });
const clearCourierDates = () => pushQuery({ tab: 'courier', courier_start_date: undefined, courier_end_date: undefined, page: undefined });
const applyGlobalFilters = () => pushQuery({
  brand_id: globalDraft.brand_id,
  report_start_date: globalDraft.report_start_date,
  report_end_date: globalDraft.report_end_date,
  courier_integration_id: isReturnReport.value ? globalDraft.courier_integration_id : undefined,
  source: globalDraft.source,
  dash_start_date: undefined,
  dash_end_date: undefined,
  city_start_date: undefined,
  city_end_date: undefined,
  courier_start_date: undefined,
  courier_end_date: undefined,
  date_from: undefined,
  date_to: undefined,
  page: undefined,
});
const clearGlobalFilters = () => {
  Object.assign(globalDraft, { brand_id: '', report_start_date: '', report_end_date: '', courier_integration_id: '', source: '' });
  pushQuery({
    brand_id: undefined,
    report_start_date: undefined,
    report_end_date: undefined,
    courier_integration_id: undefined,
    source: undefined,
    dash_start_date: undefined,
    dash_end_date: undefined,
    city_start_date: undefined,
    city_end_date: undefined,
    courier_start_date: undefined,
    courier_end_date: undefined,
    date_from: undefined,
    date_to: undefined,
    page: undefined,
  });
};
const clearGlobalDates = () => pushQuery({
  report_start_date: undefined,
  report_end_date: undefined,
  page: undefined,
});
const drilldownProduct = row => row.product_key && pushQuery({ tab: 'orders', product_key: row.product_key, city: undefined, page: undefined });
const drilldownCity = row => row.city && pushQuery({ tab: 'orders', city: row.city, product_key: undefined, page: undefined });
const drilldownCourier = row => row.courier_integration_id && pushQuery({ tab: 'orders', courier_integration_id: row.courier_integration_id, city: undefined, product_key: undefined, page: undefined });
const applyOrderFilters = () => pushQuery({
  tab: 'orders',
  ...orderDraft,
  courier_integration_id: isReturnReport.value ? filters.value.courier_integration_id : undefined,
  source: filters.value.source,
  date_from: undefined,
  date_to: undefined,
  product_key: undefined,
  city: undefined,
  page: undefined,
});
const clearOrderFilters = () => {
  Object.assign(orderDraft, { keyword: '', date_from: '', date_to: '', courier_integration_id: '', source: '' });
  pushQuery({
    tab: 'orders',
    keyword: undefined,
    date_from: undefined,
    date_to: undefined,
    courier_integration_id: isReturnReport.value ? filters.value.courier_integration_id : undefined,
    source: filters.value.source,
    product_key: undefined,
    city: undefined,
    page: undefined,
  });
};

watch(() => route.fullPath, () => {
  syncDraftFromQuery();
  fetchData();
});

watch(citySearch, () => {
  cityPage.value = 1;
});

watch(filteredCityRows, () => {
  if (cityPage.value > cityPagination.value.total_pages) {
    cityPage.value = cityPagination.value.total_pages;
  }
});

onMounted(() => {
  syncDraftFromQuery();
  fetchData();
});
</script>

<style scoped>
.performance-page {
  min-height: 100vh;
  padding: 28px;
  background: #f6f8fb;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.page-head h1 {
  margin: 0;
  color: #0f172a;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 0;
}

.page-head p,
.panel-head p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.refresh-btn,
.primary-btn,
.secondary-btn,
.tabs button {
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.refresh-btn,
.secondary-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
}

.refresh-btn {
  min-width: 92px;
  padding: 9px 13px;
}

.report-toolbar {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  align-items: end;
  gap: 18px;
  margin-bottom: 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%);
  padding: 14px 16px;
}

.toolbar-copy strong {
  display: block;
  color: #1e3a8a;
  font-size: 14px;
  font-weight: 900;
}

.toolbar-copy span {
  display: block;
  margin-top: 3px;
  color: #475569;
  font-size: 12px;
  font-weight: 750;
}

.toolbar-controls {
  display: grid;
  grid-template-columns: minmax(160px, 1.2fr) repeat(4, minmax(118px, 1fr)) auto;
  align-items: end;
  gap: 10px;
}

.toolbar-controls.cancel {
  grid-template-columns: minmax(180px, 1.2fr) repeat(3, minmax(130px, 1fr)) auto;
}

.toolbar-controls label {
  display: grid;
  gap: 6px;
}

.toolbar-controls label span {
  color: #475569;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.toolbar-controls input,
.toolbar-controls select {
  min-height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  padding: 8px 10px;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.toolbar-actions .primary-btn,
.toolbar-actions .secondary-btn {
  min-width: 64px;
  white-space: nowrap;
}

.metric-card,
.panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.metric-card span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 24px;
  font-weight: 950;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.tabs button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  padding: 9px 13px;
}

.tabs button.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.panel {
  padding: 18px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-head h2,
.table-title h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 900;
}

.muted-count {
  color: #64748b;
  font-weight: 800;
}

.export-btn {
  min-width: 96px;
  white-space: nowrap;
}

.date-controls,
:deep(.date-controls),
.filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

:deep(.date-controls input),
.filter-grid input,
.filter-grid select {
  min-height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  padding: 8px 10px;
  font-size: 13px;
}

.primary-btn,
:deep(.primary-btn),
.secondary-btn,
:deep(.secondary-btn) {
  min-height: 38px;
  padding: 8px 12px;
}

.primary-btn,
:deep(.primary-btn) {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  padding: 18px;
  box-shadow: none;
}

.metric-card.danger {
  border-left: 5px solid #dc2626;
}

.metric-card.warn {
  border-left: 5px solid #d97706;
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1.3fr) repeat(4, minmax(140px, 1fr)) auto;
  margin-bottom: 16px;
}

.filter-grid.compact {
  grid-template-columns: minmax(280px, 520px) auto;
  justify-content: start;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.table-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 4px 0 12px;
}

.report-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 2px 0 12px;
}

.report-table-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 900;
}

.report-table-head p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
}

.refresh-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.report-pagination-top {
  padding: 0 0 14px;
  border-top: none;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 10px;
}

.report-pagination-bottom {
  margin-top: 14px;
}

:deep(.table-wrap) {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

:deep(.table-actions) {
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  padding: 10px;
}

:deep(.data-table) {
  width: 100%;
  min-width: 880px;
  border-collapse: collapse;
  background: #fff;
}

:deep(.data-table th),
:deep(.data-table td) {
  border-bottom: 1px solid #e2e8f0;
  padding: 12px;
  color: #334155;
  font-size: 13px;
  text-align: left;
  vertical-align: top;
}

:deep(.data-table th) {
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
}

:deep(.th-button) {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  font: inherit;
  text-align: left;
}

:deep(.th-button.sortable) {
  cursor: pointer;
}

:deep(.th-button.sortable:hover) {
  color: #2563eb;
}

:deep(.data-table tr.clickable) {
  cursor: pointer;
}

:deep(.data-table tr.clickable:hover td) {
  background: #f8fafc;
}

:deep(.data-table tr:last-child td) {
  border-bottom: 0;
}

:deep(.empty-cell) {
  color: #64748b;
  font-weight: 800;
  text-align: center;
}

:deep(.tracking-code),
:deep(.tracking-empty) {
  display: inline-block;
  max-width: none;
  border: none;
  background: transparent;
  color: #1d4ed8;
  padding: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

:deep(.tracking-code) {
  cursor: pointer;
}

:deep(.tracking-code:hover) {
  color: #2563eb;
  text-decoration: underline;
}

:deep(.tracking-empty) {
  color: #64748b;
}

:deep(.status-badge) {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  padding: 3px 9px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

:deep(.risk-cell) {
  display: grid;
  min-width: 170px;
  gap: 7px;
}

:deep(.risk-top) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

:deep(.risk-top strong) {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
}

:deep(.risk-badge) {
  border-radius: 999px;
  padding: 4px 7px;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}

:deep(.risk-badge.normal) {
  background: #dcfce7;
  color: #166534;
}

:deep(.risk-badge.watch) {
  background: #fef3c7;
  color: #92400e;
}

:deep(.risk-badge.high) {
  background: #fee2e2;
  color: #991b1b;
}

:deep(.risk-badge.sample) {
  background: #f1f5f9;
  color: #475569;
}

:deep(.risk-bar) {
  display: block;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

:deep(.risk-bar i) {
  display: block;
  height: 100%;
  border-radius: inherit;
}

:deep(.risk-bar i.normal) {
  background: #16a34a;
}

:deep(.risk-bar i.watch) {
  background: #d97706;
}

:deep(.risk-bar i.high) {
  background: #dc2626;
}

:deep(.risk-bar i.sample) {
  background: #94a3b8;
}

@media (max-width: 1220px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-toolbar {
    align-items: flex-start;
    grid-template-columns: 1fr;
  }

  .toolbar-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .performance-page {
    padding: 18px;
  }

  .page-head,
  .panel-head,
  .table-title {
    flex-direction: column;
  }

  .metric-grid,
  .filter-grid,
  .toolbar-controls {
    grid-template-columns: 1fr;
  }
}
</style>

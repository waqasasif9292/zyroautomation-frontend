<template>
  <section class="order-stats-strip" aria-label="Order summary">
    <button
      v-for="item in statItems"
      :key="item.key"
      class="stat-card"
      type="button"
      :aria-label="`Show ${item.label} orders`"
      @click="$emit('select', item.filter)"
    >
      <div class="stat-copy">
        <span>{{ item.label }}</span>
        <strong>{{ formatNumber(item.value) }}</strong>
      </div>
      <span :class="['stat-icon', item.icon]">
        <svg v-if="item.icon === 'thumb'" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 10.5h2.3l1.6-5.1c.2-.7.8-1.1 1.5-1.1 1.2 0 2.1 1 1.9 2.2l-.5 3.1h4.1c1.2 0 2.1 1.1 1.8 2.3l-1.2 5.4c-.3 1.4-1.5 2.3-2.9 2.3H7v-9.1Z"
            fill="currentColor"
          />
          <path d="M4 10.5h3v9.1H4a1 1 0 0 1-1-1v-7.1a1 1 0 0 1 1-1Z" fill="currentColor" />
        </svg>
        <svg v-else-if="item.icon === 'chart'" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a9 9 0 1 0 9 9h-9V3Z" fill="currentColor" opacity="0.95" />
          <path d="M14 3.3V10h6.7A9 9 0 0 0 14 3.3Z" fill="currentColor" opacity="0.7" />
          <path d="M14 12h7a8.8 8.8 0 0 1-2.6 6.3L14 12Z" fill="#fff" opacity="0.9" />
        </svg>
        <svg v-else width="23" height="23" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Z" fill="currentColor" />
          <path d="M8 8h8M8 12h8M8 16h5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" />
        </svg>
      </span>
    </button>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import OrderService from '../../services/OrderService';

defineEmits(['select']);

const stats = ref({
  today: 0,
  yesterday: 0,
  last_7_days: 0,
  this_month: 0,
  last_month: 0,
  total: 0,
  hold: 0,
  pending_confirmation: 0,
  duplicate: 0,
  merchant_warehouse: 0,
  dispatched: 0,
  out_for_delivery: 0,
});

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const formatDate = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const dateFilter = (from, to) => ({ date_from: formatDate(from), date_to: formatDate(to), status: null });
const statusFilter = status => ({ date_from: null, date_to: null, status });

const statItems = computed(() => [
  {
    key: 'today',
    label: 'Today',
    value: stats.value.today,
    icon: 'thumb',
    filter: dateFilter(new Date(), new Date()),
  },
  {
    key: 'yesterday',
    label: 'Yesterday',
    value: stats.value.yesterday,
    icon: 'thumb',
    filter: dateFilter(addDays(new Date(), -1), addDays(new Date(), -1)),
  },
  {
    key: 'last_7_days',
    label: 'Last 7 Days',
    value: stats.value.last_7_days,
    icon: 'chart',
    filter: dateFilter(addDays(new Date(), -6), new Date()),
  },
  {
    key: 'this_month',
    label: 'This Month',
    value: stats.value.this_month,
    icon: 'chart',
    filter: dateFilter(startOfMonth(new Date()), new Date()),
  },
  {
    key: 'last_month',
    label: 'Last Month',
    value: stats.value.last_month,
    icon: 'chart',
    filter: (() => {
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      return dateFilter(startOfMonth(lastMonth), endOfMonth(lastMonth));
    })(),
  },
  {
    key: 'total',
    label: 'Total',
    value: stats.value.total,
    icon: 'chart',
    filter: { date_from: null, date_to: null, status: null },
  },
  { key: 'hold', label: 'On Hold', value: stats.value.hold, icon: 'status', filter: statusFilter('hold') },
  { key: 'pending_confirmation', label: 'Pending Confirmation', value: stats.value.pending_confirmation, icon: 'status', filter: statusFilter('pending_confirmation') },
  { key: 'duplicate', label: 'Duplicate', value: stats.value.duplicate, icon: 'status', filter: statusFilter('duplicate') },
  { key: 'merchant_warehouse', label: 'Merchant Warehouse', value: stats.value.merchant_warehouse, icon: 'status', filter: statusFilter('merchant_warehouse') },
  { key: 'dispatched', label: 'Dispatched', value: stats.value.dispatched, icon: 'status', filter: statusFilter('dispatched') },
  { key: 'out_for_delivery', label: 'Out For Delivery', value: stats.value.out_for_delivery, icon: 'status', filter: statusFilter('out_for_delivery') },
]);

const formatNumber = value => Number(value || 0).toLocaleString();

const fetchStats = async () => {
  const response = await OrderService.getStats();
  stats.value = {
    ...stats.value,
    ...(response.data.data?.stats || {}),
  };
};

onMounted(fetchStats);
</script>

<style scoped>
.order-stats-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  padding: 22px 12px 18px;
  border-radius: 0;
  background: linear-gradient(135deg, #5e74dd 0%, #5b6ee1 48%, #607be2 100%);
}

.stat-card {
  position: relative;
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 6px;
  background: #fff;
  padding: 17px 18px 16px 22px;
  box-shadow: 0 11px 28px rgba(59, 76, 163, 0.18);
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.stat-card::after {
  content: "›";
  position: absolute;
  right: 12px;
  bottom: 10px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #1e293b;
  color: #fff;
  font-size: 19px;
  font-weight: 800;
  line-height: 1;
  opacity: 0;
  transform: translateX(8px);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.stat-card:hover {
  border-color: rgba(30, 41, 59, 0.28);
  transform: translateY(-3px);
  box-shadow: 0 18px 38px rgba(31, 44, 116, 0.32);
}

.stat-card:hover::after,
.stat-card:focus-visible::after {
  opacity: 1;
  transform: translateX(0);
}

.stat-card:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.72);
  outline-offset: 3px;
}

.stat-card:active {
  transform: translateY(-1px);
}

.stat-copy {
  min-width: 0;
}

.stat-copy span {
  display: block;
  color: #8290ad;
  font-size: 11.5px;
  font-weight: 800;
  line-height: 1.55;
  text-transform: uppercase;
}

.stat-copy strong {
  display: block;
  margin-top: 3px;
  color: #222a5c;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.15;
}

.stat-icon {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #fff;
  box-shadow: 0 12px 24px rgba(248, 89, 55, 0.22);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.stat-card:hover .stat-icon,
.stat-card:focus-visible .stat-icon {
  transform: scale(1.08) rotate(-4deg);
  box-shadow: 0 14px 28px rgba(248, 89, 55, 0.3);
}

.stat-icon.thumb {
  background: linear-gradient(135deg, #f63764 0%, #ff5538 100%);
}

.stat-icon.chart {
  background: linear-gradient(135deg, #ff6546 0%, #ffa729 100%);
}

.stat-icon.status {
  background: linear-gradient(135deg, #2f80ed 0%, #18a999 100%);
}

@media (max-width: 1180px) {
  .order-stats-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .order-stats-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 14px;
  }

  .stat-card {
    min-height: 76px;
    padding: 14px;
  }

  .stat-icon {
    width: 42px;
    height: 42px;
  }
}

@media (max-width: 480px) {
  .order-stats-strip {
    grid-template-columns: 1fr;
  }
}
</style>

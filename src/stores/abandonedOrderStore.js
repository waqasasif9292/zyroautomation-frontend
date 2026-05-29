import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import AbandonedOrderService from '../services/AbandonedOrderService';

const defaultFilters = () => ({
  search: '',
  date_from: '',
  date_to: '',
  brand_id: '',
  status: '',
  sort: 'received_desc',
  page: 1,
});

export const useAbandonedOrderStore = defineStore('abandonedOrder', () => {
  const orders = ref([]);
  const pagination = ref(null);
  const stats = ref({});
  const brands = ref([]);
  const filters = reactive(defaultFilters());
  const loading = ref(false);

  const requestParams = () => Object.fromEntries(
    Object.entries({ ...filters, per_page: 20 }).filter(([, value]) => value !== null && value !== '')
  );

  const fetchOrders = async () => {
    loading.value = true;
    try {
      const res = await AbandonedOrderService.getOrders(requestParams());
      orders.value = res.data.data.orders;
      pagination.value = res.data.data.pagination;
      stats.value = res.data.data.stats || {};
      brands.value = res.data.data.brands || [];
    } finally {
      loading.value = false;
    }
  };

  const setFilter = async (key, value) => {
    filters[key] = value || '';
    filters.page = 1;
    await fetchOrders();
  };

  const hydrateFilters = (values) => {
    Object.assign(filters, defaultFilters(), values);
    filters.page = Number.parseInt(filters.page, 10) || 1;
  };

  const setPage = async (page) => {
    filters.page = page;
    await fetchOrders();
  };

  const updateStatus = async (id, status) => {
    const res = await AbandonedOrderService.updateStatus(id, status);
    const updated = res.data.data.order;
    const index = orders.value.findIndex(order => order.id === id);
    if (index !== -1) {
      orders.value[index] = updated;
    }
    return updated;
  };

  const deleteOrder = async (id) => {
    await AbandonedOrderService.deleteOrder(id);
    orders.value = orders.value.filter(order => order.id !== id);
  };

  return {
    orders,
    pagination,
    stats,
    brands,
    filters,
    loading,
    fetchOrders,
    setFilter,
    hydrateFilters,
    setPage,
    updateStatus,
    deleteOrder,
  };
});

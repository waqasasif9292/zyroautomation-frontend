import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import AbandonedOrderService from '../services/AbandonedOrderService';

const defaultFilters = () => ({
  search: '',
  date_from: '',
  date_to: '',
  brand_id: '',
  status: 'pending',
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
    Object.entries({ ...filters, per_page: 200 }).filter(([, value]) => value !== null && value !== '')
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

  const normalizeStatus = (status) => {
    if (status === '') {
      return '';
    }

    const value = String(status || 'pending').toLowerCase();

    return value === 'open' || value === 'completed' || value === 'cancelled' || value === 'canceled'
      ? { open: 'pending', completed: 'complete', cancelled: 'cancel', canceled: 'cancel' }[value]
      : value;
  };

  const removeOrdersFromPage = (ids) => {
    const removeIds = new Set(Array.isArray(ids) ? ids : [ids]);
    const removedCount = orders.value.filter(order => removeIds.has(order.id)).length;

    orders.value = orders.value.filter(order => !removeIds.has(order.id));

    if (pagination.value && removedCount > 0) {
      const total = Math.max(0, Number(pagination.value.total || 0) - removedCount);
      pagination.value = {
        ...pagination.value,
        total,
        total_pages: Math.max(1, Math.ceil(total / Number(pagination.value.per_page || 1))),
        has_next: pagination.value.current_page < Math.max(1, Math.ceil(total / Number(pagination.value.per_page || 1))),
      };
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
      const activeStatus = normalizeStatus(filters.status);
      const updatedStatus = normalizeStatus(updated.status);

      if (activeStatus && updatedStatus !== activeStatus) {
        removeOrdersFromPage(id);
      } else {
        orders.value[index] = updated;
      }
    }
    return updated;
  };

  const updateNote = async (id, note) => {
    const res = await AbandonedOrderService.updateNote(id, note);
    const updated = res.data.data.order;
    const index = orders.value.findIndex(order => order.id === id);
    if (index !== -1) {
      orders.value[index] = updated;
    }
    return updated;
  };

  const deleteOrder = async (id) => {
    await AbandonedOrderService.deleteOrder(id);
    removeOrdersFromPage(id);
  };

  const bulkDeleteOrders = async (ids) => {
    await AbandonedOrderService.bulkDeleteOrders(ids);
    removeOrdersFromPage(ids);
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
    updateNote,
    deleteOrder,
    bulkDeleteOrders,
  };
});

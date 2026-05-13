import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import OrderService from '../services/OrderService';

const defaultFilters = () => ({
  brand_id: null,
  financial_status: null,
  search: '',
  sort: 'created_id_desc',
  page: 1,
});

export const useOrderStore = defineStore('order', () => {
  const orders = ref([]);
  const pagination = ref(null);
  const filters = reactive(defaultFilters());
  const loading = ref(false);
  const selectedOrder = ref(null);
  const detailLoading = ref(false);
  const panelOpen = ref(false);

  const requestParams = () => Object.fromEntries(
    Object.entries({ ...filters, per_page: 20 }).filter(([, value]) => value !== null && value !== '')
  );

  const fetchOrders = async () => {
    loading.value = true;
    try {
      const res = await OrderService.getOrders(requestParams());
      orders.value = res.data.data.orders;
      pagination.value = res.data.data.pagination;
    } finally {
      loading.value = false;
    }
  };

  const fetchOrder = async (id) => {
    panelOpen.value = true;
    detailLoading.value = true;
    selectedOrder.value = null;
    try {
      const res = await OrderService.getOrder(id);
      selectedOrder.value = res.data.data.order;
      return selectedOrder.value;
    } finally {
      detailLoading.value = false;
    }
  };

  const closePanel = () => {
    panelOpen.value = false;
    selectedOrder.value = null;
  };

  const setFilter = async (key, value) => {
    filters[key] = value || null;
    filters.page = 1;
    await fetchOrders();
  };

  const setPage = async (page) => {
    filters.page = page;
    await fetchOrders();
  };

  const resetFilters = async () => {
    Object.assign(filters, defaultFilters());
    await fetchOrders();
  };

  const createHold = async (payload) => {
    const res = await OrderService.createHold(payload);
    return res.data.data.order;
  };

  const updateHold = async (id, payload) => {
    const res = await OrderService.updateHold(id, payload);
    return res.data.data.order;
  };

  const createPostexShipment = async (id) => {
    const res = await OrderService.createPostexShipment(id);
    return res.data.data;
  };

  const deleteOrder = async (id) => {
    await OrderService.deleteOrder(id);
    if (selectedOrder.value?.id === id) closePanel();
    await fetchOrders();
  };

  return {
    orders,
    pagination,
    filters,
    loading,
    selectedOrder,
    detailLoading,
    panelOpen,
    fetchOrders,
    fetchOrder,
    closePanel,
    setFilter,
    setPage,
    resetFilters,
    createHold,
    updateHold,
    createPostexShipment,
    deleteOrder,
  };
});

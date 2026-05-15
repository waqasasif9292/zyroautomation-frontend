import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import OrderService from '../services/OrderService';

const defaultFilters = () => ({
  brand_id: null,
  courier_integration_id: null,
  customer_id: null,
  date_from: null,
  date_to: null,
  financial_status: null,
  search: '',
  source: null,
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

  const applyFilters = async (values) => {
    Object.assign(filters, {
      ...values,
      customer_id: filters.customer_id,
      page: 1,
    });
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

  const saveDraft = async (payload) => {
    const res = await OrderService.saveDraft(payload);
    return res.data.data.order;
  };

  const updateDraft = async (id, payload) => {
    const res = await OrderService.updateDraft(id, payload);
    return res.data.data.order;
  };

  const createBooking = async (payload) => {
    const res = await OrderService.createBooking(payload);
    return res.data.data;
  };

  const updateBooking = async (id, payload) => {
    const res = await OrderService.updateBooking(id, payload);
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
    applyFilters,
    setPage,
    resetFilters,
    saveDraft,
    updateDraft,
    createBooking,
    updateBooking,
    deleteOrder,
  };
});

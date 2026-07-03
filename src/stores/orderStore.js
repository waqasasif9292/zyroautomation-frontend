import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import OrderService from '../services/OrderService';
import { useAuthStore } from './authStore';

const defaultFilters = () => ({
  brand_id: null,
  courier_integration_id: null,
  customer_id: null,
  date_from: null,
  date_to: null,
  financial_status: null,
  product_id: null,
  search: '',
  source: null,
  sort: 'created_id_desc',
  status: null,
  page: 1,
});

export const useOrderStore = defineStore('order', () => {
  const authStore = useAuthStore();
  const orders = ref([]);
  const pagination = ref(null);
  const filters = reactive(defaultFilters());
  const loading = ref(false);
  const selectedOrder = ref(null);
  const detailLoading = ref(false);
  const panelOpen = ref(false);

  const requestParams = () => Object.fromEntries(
    Object.entries({ ...filters, per_page: 100 }).filter(([, value]) => value !== null && value !== '')
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

  const hydrateFilters = (values) => {
    Object.assign(filters, defaultFilters(), values);
    filters.page = Number.parseInt(filters.page, 10) || 1;
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
    await authStore.fetchUser();
    return res.data.data.order;
  };

  const updateDraft = async (id, payload) => {
    const res = await OrderService.updateDraft(id, payload);
    return res.data.data.order;
  };

  const createBooking = async (payload) => {
    const res = await OrderService.createBooking(payload);
    await authStore.fetchUser();
    return res.data.data;
  };

  const updateBooking = async (id, payload) => {
    const res = await OrderService.updateBooking(id, payload);
    return res.data.data;
  };

  const correctAddress = async (rawAddress) => {
    const res = await OrderService.correctAddress(rawAddress);
    return res.data.data.address;
  };

  const correctOrderAddress = async (id) => {
    const res = await OrderService.correctOrderAddress(id);
    const updatedOrder = res.data.data.order;
    const index = orders.value.findIndex(order => order.id === id);
    if (index !== -1) {
      orders.value[index] = {
        ...orders.value[index],
        ai_address_correction: updatedOrder.ai_address_correction || null,
      };
    }
    if (selectedOrder.value?.id === id) {
      selectedOrder.value = updatedOrder;
    }
    return updatedOrder;
  };

  const deleteOrder = async (id) => {
    await OrderService.deleteOrder(id);
    if (selectedOrder.value?.id === id) closePanel();
    await fetchOrders();
  };

  const bulkDeleteOrders = async (ids) => {
    await OrderService.bulkDeleteOrders(ids);
    if (ids.includes(selectedOrder.value?.id)) closePanel();
    await fetchOrders();
  };

  const cancelByShipper = async (id) => {
    await OrderService.cancelByShipper(id);
    if (selectedOrder.value?.id === id) closePanel();
    await fetchOrders();
  };

  const sendAddressConfirmation = async (id) => {
    const res = await OrderService.sendAddressConfirmation(id);
    return res.data;
  };

  const sendOutForDelivery = async (id) => {
    const res = await OrderService.sendOutForDelivery(id);
    return res.data;
  };

  const saveHoldCallLog = async (id, payload) => {
    const res = await OrderService.saveHoldCallLog(id, payload);
    const updatedOrder = res.data.data.order;
    const index = orders.value.findIndex(order => order.id === id);
    if (index !== -1) {
      orders.value[index] = {
        ...orders.value[index],
        last_hold_call_log: updatedOrder.hold_call_logs?.[0] || orders.value[index].last_hold_call_log || null,
      };
    }
    if (selectedOrder.value?.id === id) {
      selectedOrder.value = updatedOrder;
    }
    return updatedOrder;
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
    hydrateFilters,
    applyFilters,
    setPage,
    resetFilters,
    saveDraft,
    updateDraft,
    createBooking,
    updateBooking,
    correctAddress,
    correctOrderAddress,
    sendAddressConfirmation,
    sendOutForDelivery,
    saveHoldCallLog,
    cancelByShipper,
    deleteOrder,
    bulkDeleteOrders,
  };
});

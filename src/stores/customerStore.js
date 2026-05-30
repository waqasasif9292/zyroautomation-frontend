import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import CustomerService from '../services/CustomerService';

const defaultFilters = () => ({
  search: '',
  sort_by: 'date',
  sort_dir: 'desc',
  page: 1,
});

export const useCustomerStore = defineStore('customer', () => {
  const customers = ref([]);
  const pagination = ref(null);
  const filters = reactive(defaultFilters());
  const loading = ref(false);

  const requestParams = () => Object.fromEntries(
    Object.entries({ ...filters, per_page: 20 }).filter(([, value]) => value !== null && value !== '')
  );

  const fetchCustomers = async () => {
    loading.value = true;
    try {
      const res = await CustomerService.getCustomers(requestParams());
      customers.value = res.data.data.customers;
      pagination.value = res.data.data.pagination;
    } finally {
      loading.value = false;
    }
  };

  const setFilter = async (key, value) => {
    filters[key] = value || '';
    filters.page = 1;
    await fetchCustomers();
  };

  const setFilters = async (values) => {
    Object.entries(values).forEach(([key, value]) => {
      filters[key] = value || '';
    });
    filters.page = 1;
    await fetchCustomers();
  };

  const hydrateFilters = (values) => {
    Object.assign(filters, defaultFilters(), values);
    filters.page = Number.parseInt(filters.page, 10) || 1;
  };

  const setPage = async (page) => {
    filters.page = page;
    await fetchCustomers();
  };

  return {
    customers,
    pagination,
    filters,
    loading,
    fetchCustomers,
    setFilter,
    setFilters,
    hydrateFilters,
    setPage,
  };
});

import axios from 'axios';
import API_BASE_URL from './config';

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 403 || err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => API.post('/user/register', data);
export const login = (data) => API.post('/user/login', data);

// Groups
export const createGroup = (data) => API.post('/groups', data);
export const addMember = (groupId, data) => API.post(`/groups/${groupId}/members`, data);
export const getMembers = (groupId) => API.get(`/groups/${groupId}/members`);
export const leaveGroup = (groupId) => API.delete(`/groups/${groupId}/members/me`);
export const getMyGroups = () => API.get('/groups/my');

// Expenses
export const addExpense = (data) => API.post('/expense', data);
export const getExpenses = (groupId) => API.get(`/groups/${groupId}/expenses`);
export const getBalances = (groupId) => API.get(`/groups/${groupId}/balances`);

// Settlement
export const settle = (data) => API.post('/settlements/pay', data);

export default API;

import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
export const err = e => e.response?.data?.message || e.message;
export const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
export const daysLeft = d => d ? Math.max(0, 90 - Math.floor((Date.now() - new Date(d)) / 864e5)) : 0;
export default api;

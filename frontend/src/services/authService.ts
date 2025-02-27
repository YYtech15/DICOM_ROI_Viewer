// frontend/src/services/authService.ts
import httpClient from './httpClient';

const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await httpClient.post('/auth/login', formData);
  
  // 成功したらトークンをローカルストレージに保存
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }
  
  return response;
};

const logout = () => {
  localStorage.removeItem('access_token');
  return httpClient.post('/auth/logout');
};

const getCurrentUser = async () => {
  try {
    const response = await httpClient.get('/auth/user');
    return response;
  } catch (error) {
    throw error;
  }
};

// 認証状態を確認
const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default {
  login,
  logout,
  getCurrentUser,
  isAuthenticated
};
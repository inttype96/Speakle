import apiClient from './index';

export const loginAPI = async (data: any) => {
  return apiClient.post('/auth/login', data);
};

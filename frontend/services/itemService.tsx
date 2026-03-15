import apiClient from "../api/apiClient";

/**
 * Service สำหรับจัดการข้อมูลสินค้า (Master Data)
 */
export const getItems = () => {
  return apiClient.get("/items");
};

export const getItemById = (id: number) => {
  return apiClient.get(`/items/${id}`);
};

export const createItem = (data: any) => {
  return apiClient.post("/items", data);
};

export const updateItem = (id: number, data: any) => {
  return apiClient.put(`/items/${id}`, data);
};

export const deleteItem = (id: number) => {
  return apiClient.delete(`/items/${id}`);
};

// หากต้องการเพิ่มฟังก์ชันสร้างหรือแก้ไขสินค้าในอนาคต
export const itemService = {
  getAll: getItems,
  getById: getItemById,
  create: (data: any) => apiClient.post("/items", data),
  update: (id: number, data: any) => apiClient.put(`/items/${id}`, data),
  delete: (id: number) => apiClient.delete(`/items/${id}`),
};

export default itemService;
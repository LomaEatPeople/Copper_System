// services/itemService.ts
import { apiClient } from "../api/apiClient";

export const itemService = {
  getAllItems: () => apiClient.get("/items"),

createItem: (item_name: string, category_id: number) => {
    return apiClient.post("/items", {
      item_name: item_name,
      category_id: category_id
    });
  },

  deleteItem: (id: number) => {
    // สำคัญ: ใส่ headers และโครงสร้าง data ให้เป๊ะตาม schema
    return apiClient.delete(`/items/${id}`, {
      data: { item_id: id }
    });
  }
};
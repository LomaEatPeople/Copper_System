// services/categoryService.tsx
import { apiClient } from "../api/apiClient";

export const categoryService = {
  getAll: () => apiClient.get("/categories"),
  create: (data: { name: string; require_image: number }) => apiClient.post("/categories", data),
  update: (id: number, data: { name?: string; require_image?: number }) => apiClient.patch(`/categories/${id}`, data),
  delete: (id: number) => apiClient.delete(`/categories/${id}`)
};
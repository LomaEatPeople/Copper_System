// services/billService.ts
import { get } from "http";
import {apiClient} from "../api/apiClient";

export const billService = {
  // ดึงรายการบิลทั้งหมด (ที่คุณ GET ได้ข้อมูลมา)
  getTransactions: () => apiClient.get("/transactions"),

  // ดึงข้อมูลบิลใบเดียว (โดยใช้ ID)
  getTransactionById: (id: number) => apiClient.get(`/transactions/${id}`),

  getTransactionWithItems: (id: number) => apiClient.get(`/transactions/${id}/with-items`),

  deleteTransactionItem: (id: number, item_id: number) => apiClient.delete(`/transactions/${id}/items/${item_id}`),

  // ดึงสินค้าที่อยู่ในบิลนั้นๆ
  // **ลองเช็คว่า Backend ใช้ URL ไหนระหว่าง 2 อันนี้**
  getTransactionItems: (id: number) => apiClient.get(`/transactions/${id}/items`),
  // เพิ่มสินค้าเข้าบิล
  addItemToTransaction: (id: number, itemId: number, weight: number) => {
    // ตรวจสอบ payload ให้มั่นใจว่าเป็นตัวเลข
    const payload = {
      item_id: Number(itemId),
      weight: parseFloat(weight.toString()) // บังคับเป็นทศนิยมตามสไตล์ข้อมูลน้ำหนัก
    };
    
    console.log("DEBUG: Sending Payload to Backend:", payload);
    
    return apiClient.post(`/transactions/${id}/items`, payload);
  },
  updateItemPrice: (transactionId: number, itemId: number, price: number) => {
  return apiClient.patch("/transaction-items/price", {
    transaction_id: transactionId,
    item_id: itemId,
    price_per_kg: price
  });
},

  // ยืนยันบิล
  confirmTransaction: (id: number) => 
    apiClient.post(`/transactions/${id}/confirm`, { transaction_id: Number(id) }),
};
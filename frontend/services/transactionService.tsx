// ใส่ปีกกาครอบ apiClient เพื่อให้ตรงกับการ export { apiClient }
import { apiClient } from "../api/apiClient";

const transactionService = {
  getTransactions: () => {
    // ตอนนี้ apiClient จะมีฟังก์ชัน .get แน่นอน
    return apiClient.get(`/transactions?t=${new Date().getTime()}`);
  },

  deleteTransaction: (id: number) => {
    console.log("Service: Attempting to delete ID:", id);
    return apiClient.delete(`/transactions/${id}`, {
      data: { 
        transaction_id: id 
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  createTransaction: (data: any) => {
    return apiClient.post("/transactions", data);
  }
};

export default transactionService;
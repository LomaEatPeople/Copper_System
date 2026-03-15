import apiClient from "../api/apiClient";

const transactionService = {
  // ฟังก์ชันดึงรายการทั้งหมดที่หน้าแรกเรียกใช้
  getTransactions: () => {
    return apiClient.get("/transactions");
  },

  // ฟังก์ชันสร้างบิลใหม่
  createTransaction: (data: any) => {
    return apiClient.post("/transactions", data);
  }
};

export default transactionService;
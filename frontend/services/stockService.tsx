// services/stockService.tsx
import { apiClient } from "../api/apiClient";

export const stockService = {
  
  // 🟢 1. สำหรับหน้า Dashboard (อันใหม่ที่เราเพิ่งทำ)
  getDashboardSummary: async (date: string, mode: string = "daily") => {
    const response = await apiClient.get(`/api/dashboard/summary`, {
      params: { 
        date: date, 
        mode: mode 
      }
    });
    return response.data;
  },

  // 🔵 2. สำหรับหน้า Stock & Margin (ที่เรากำลังจะแก้ให้สวย)
  // รับเดือน (month) และ ปี (year) ไปกรองข้อมูลสต็อกรายเดือน
  getStockSummary: async (month: string = "all", year: string = "2026") => {
    const response = await apiClient.get(`/api/stocks/summary`, {
      params: { 
        month: month, 
        year: year 
      }
    });
    // ปกติ Axios จะคืนค่า data ที่มีโครงสร้าง { status: 'success', data: [...] }
    return response.data;
  }
};
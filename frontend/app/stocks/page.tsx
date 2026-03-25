"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { stockService } from "@/services/stockService";

export default function StockPage() {
  const [stockData, setStockData] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true);
      // มั่นใจว่าใน stockService มี getStockSummary ที่ใช้ apiClient นะคะ
      const res = await stockService.getStockSummary(filterMonth, "2026");
      setStockData(res.data || []);
    } catch (err) {
      console.error("Error fetching stock:", err);
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  const filteredStock = useMemo(() => {
    return stockData.filter(item => 
      item.item_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [stockData, search]);

  return (
    // 🟢 เปลี่ยนพื้นหลังเป็น Slate 50 ให้ดูพรีเมียมคลีนๆ
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Inventory Management</h1>
            <h2 className="text-4xl font-extrabold text-slate-950 tracking-tighter flex items-center gap-3">
              Stock & Margin
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">จัดการสต็อกและดูผลกำไรแยกตามรายการสินค้า</p>
          </div>

          {/* 🟢 ส่วน Filter & Search ที่ดูสะอาดตาขึ้น */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <select 
                className="w-full p-3 pl-4 pr-10 rounded-xl border border-slate-200 shadow-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 appearance-none cursor-pointer"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">📅 ข้อมูลทั้งหมด</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>

            <div className="relative flex-[2] md:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อสินค้า..." 
                className="w-full p-3 pl-10 rounded-xl border border-slate-200 shadow-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder:text-slate-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 🟢 ตารางสไตล์ Professional Clean เหมือน Ref */}
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                  <th className="p-6">Item Details</th>
                  <th className="p-6 text-center">Movement (In/Out)</th>
                  <th className="p-6 text-center">Current Stock</th>
                  <th className="p-6 text-right">Net Profit / Margin</th>
                  <th className="p-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-24 text-center"><div className="animate-pulse flex flex-col items-center gap-2"><div className="w-12 h-12 bg-slate-100 rounded-full mb-2"></div><span className="font-bold text-slate-300 uppercase tracking-widest text-xs">Calculating Data...</span></div></td></tr>
                ) : filteredStock.length === 0 ? (
                  <tr><td colSpan={5} className="p-24 text-center font-bold text-slate-300 uppercase tracking-widest text-xs">No records found</td></tr>
                ) :
                  filteredStock.map((item) => (
                    <tr key={item.item_id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="p-6">
                        <div className="font-extrabold text-xl text-slate-900 tracking-tight">{item.item_name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">ID: #{item.item_id.toString().padStart(4, '0')}</div>
                      </td>
                      
                      <td className="p-6">
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-10 text-orange-500 font-black">IN</span>
                                <span className="font-extrabold text-slate-700">{(item.total_buy_weight || 0).toLocaleString()} kg</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="w-10 text-blue-500 font-black">OUT</span>
                                <span className="font-extrabold text-slate-700">{(item.total_sell_weight || 0).toLocaleString()} kg</span>
                            </div>
                        </div>
                      </td>
                      
                      <td className="p-6 text-center">
                        <div className={`inline-block px-4 py-1.5 rounded-xl font-black text-xs ${
                          item.remaining_stock > 100 
                            ? 'bg-green-50 text-green-600' 
                            : item.remaining_stock > 0 
                                ? 'bg-orange-50 text-orange-600' 
                                : 'bg-red-50 text-red-600'
                        }`}>
                          {item.remaining_stock.toLocaleString()} KG LEFT
                        </div>
                      </td>
                      
                      <td className={`p-6 text-right font-black text-2xl tracking-tighter ${
                        item.profit_margin >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        <span className="text-xs font-bold mr-1 italic text-slate-300">฿</span>
                        {item.profit_margin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-6 text-right">
                        <button className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest border border-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                            History
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
            <div>Total Items: {filteredStock.length}</div>
            <div>Data updated via Parinya DB</div>
        </div>
      </div>
    </div>
  );
}
"use client";
import { useState, useEffect, useMemo } from "react";
import { stockService } from "@/services/stockService";

// 🟢 Card สไตล์โปร: รับค่ามาแสดงผลอย่างเดียวพอ (Stateless)
function CleanStatCard({ label, value, diff, type, showCompare, icon, viewMode }: { label: string; value: number; diff: number; type: 'buy' | 'sell' | 'profit'; showCompare: boolean; icon: string; viewMode: 'daily' | 'monthly' }) {
  const iconColors: { [key in 'buy' | 'sell' | 'profit']: string } = {
    buy: "text-red-500 bg-red-50",
    sell: "text-blue-600 bg-blue-50",
    profit: "text-green-600 bg-green-50",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:border-slate-200">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${iconColors[type]} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tighter mb-2">
          ฿{(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        {showCompare && (
          <div className="flex items-center gap-1.5 text-xs font-bold mt-1">
            <span className={diff >= 0 ? 'text-green-600' : 'text-red-500'}>
              {diff >= 0 ? `▲ +${diff.toLocaleString()}` : `▼ -${Math.abs(diff).toLocaleString()}`}
            </span>
            <span className="text-slate-400 font-medium">{viewMode === 'daily' ? 'เทียบกับเมื่อวาน' : 'เทียบกับเดือนที่แล้ว'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ buy: 0, sell: 0, profit: 0 });
  const [prevTotals, setPrevTotals] = useState({ buy: 0, sell: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  
  // 🟢 State หลักสำหรับการกรองข้อมูล
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    async function loadData() {
      try {
        setLoading(true);
        // 🟢 ยิง API เส้นใหม่ที่ส่งทั้งวันที่และโหมด
        const res = await stockService.getDashboardSummary(selectedDate, viewMode);
        if (res.status === "success") {
          setTotals(res.data.current);
          setPrevTotals(res.data.previous);
          setReportData(res.data.inventory);
        }
      } catch (err) {
        console.error("Load data failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDate, viewMode]); // โหลดใหม่เมื่อเปลี่ยนวันที่หรือโหมด

  const displayDate = selectedDate ? selectedDate.split('-').reverse().join('/') : "...";
  const formattedMonth = selectedDate ? new Date(selectedDate).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) : "...";

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Controls */}
        <div className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Copper Business Analysis</h1>
            <h2 className="text-4xl font-extrabold text-slate-950 tracking-tighter">
              {viewMode === 'daily' ? 'สรุปยอดรายวัน' : 'สรุปยอดรายเดือน'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* 🟢 ตัวสลับโหมด Daily / Monthly (UX: กดง่ายสุดๆ) */}
            <div className="bg-slate-200/50 p-1 rounded-2xl flex gap-1">
              <button 
                onClick={() => setViewMode("daily")}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'daily' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                DAILY
              </button>
              <button 
                onClick={() => setViewMode("monthly")}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'monthly' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                MONTHLY
              </button>
            </div>

            {/* Date Picker มินิมอล */}
            <div 
              className="relative bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm hover:border-slate-300 cursor-pointer"
              onClick={() => (document.getElementById('date-input') as any)?.showPicker()}
            >
              <span className="text-lg">🗓️</span>
              <div className="min-w-[120px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                  {viewMode === 'daily' ? 'ระบุวันที่' : 'ระบุเดือน'}
                </p>
                <p className="font-extrabold text-sm text-slate-700 leading-none">
                  {viewMode === 'daily' ? displayDate : formattedMonth}
                </p>
              </div>
              <input 
                id="date-input"
                type={viewMode === 'daily' ? 'date' : 'month'}
                value={viewMode === 'daily' ? selectedDate : selectedDate.substring(0, 7)}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDate(val.length === 7 ? `${val}-01` : val);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Stat Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <CleanStatCard label="ยอดซื้อ" value={totals.buy} diff={totals.buy - prevTotals.buy} type="buy" showCompare={true} icon="💰" viewMode={viewMode} />
            <CleanStatCard label="ยอดขาย" value={totals.sell} diff={totals.sell - prevTotals.sell} type="sell" showCompare={true} icon="🛒" viewMode={viewMode} />
            <CleanStatCard label="กำไร" value={totals.profit} diff={totals.profit - prevTotals.profit} type="profit" showCompare={true} icon="📈" viewMode={viewMode} />
          </div>
          
          <div className="bg-[#1e3a8a] text-white p-6 rounded-[2rem] shadow-xl flex flex-col justify-between transition-transform hover:scale-[1.02]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-2">Net Profit ({viewMode})</p>
              <div className="text-4xl font-black tracking-tighter italic">
                ฿{(totals.profit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-[10px] text-blue-200/60 font-medium mt-4">อ้างอิงข้อมูลจริงจากระบบสต็อก</p>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-12">
          <h3 className="text-xl font-extrabold text-slate-900 mb-6 ml-1">Inventory Tracking</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="p-6">รายการสินค้า</th>
                  <th className="p-6">จำนวนคงเหลือ</th>
                  <th className="p-6">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reportData.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-bold text-slate-700">{item.item_name}</td>
                    <td className="p-6 font-black text-lg">{item.remaining_stock.toLocaleString()} <span className="text-xs text-slate-400">KG</span></td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.remaining_stock < 50 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {item.remaining_stock < 50 ? 'Low Stock' : 'Ready'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
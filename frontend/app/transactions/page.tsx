"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import transactionService from "@/services/transactionService";
import { useRouter } from "next/navigation";
import DisplayNumber from "@/components/DisplayNumber";

type Transaction = {
  transaction_id: number;
  transaction_date: string;
  transaction_type: string;
  total_cost: number;
  status: string;
  display_id?: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString();
  const currentDay = today.getDate().toString();
  const [newType, setNewType] = useState("BUY");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [dayFilter, setDayFilter] = useState(currentDay);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); 
  const router = useRouter();
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const parseDate = (dateStr: string) => {
    try {
      if (!dateStr) return new Date();
      const date = new Date(dateStr.replace(" ", "T"));
      return isNaN(date.getTime()) ? new Date() : date;
    } catch {
      return new Date();
    }
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactions();
      let data = response.data || response;
      
      if (Array.isArray(data)) {
        const mappedData = data.map((t: any, index: number) => ({
          ...t,
          display_id: (data.length - index).toString().padStart(2, '0')
        }));
        setTransactions(mappedData);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true); 
    fetchTransactions();

    const handleRefresh = () => {
      if (document.visibilityState === 'visible') fetchTransactions();
    };

    window.addEventListener("focus", handleRefresh);
    document.addEventListener("visibilitychange", handleRefresh);
    return () => {
      window.removeEventListener("focus", handleRefresh);
      document.removeEventListener("visibilitychange", handleRefresh);
    };
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      const date = parseDate(t.transaction_date);
      const monthMatch = monthFilter === "all" || (date.getMonth() + 1) === Number(monthFilter);
      const dayMatch = dayFilter === "all" || date.getDate() === Number(dayFilter);
      const searchTerm = search.toLowerCase().trim();
      const searchMatch = search === "" || t.display_id.toLowerCase().includes(searchTerm);
      return monthMatch && dayMatch && searchMatch;
    });
  }, [transactions, monthFilter, dayFilter, search]);

  const handleNewBill = async (type: string) => {
    try {
      const response = await transactionService.createTransaction({ 
        user_id: 0, 
        transaction_type: type 
      });
      const data = response.data || response;
      const newId = data.transaction_id || data;
      if (newId) {
        router.push(`/transactions/${newId}`);
      }
    } catch (error) {
      alert(`ไม่สามารถสร้างบิล ${type} ได้จ้า!`);
    }
  };

  const handleDelete = async (id: number, status: string) => {
    const s = status?.toLowerCase();
    if (s === "complete" || s === "confirmed") {
      showToast("ลบไม่ได้จ้าาาาา บิลมัน Complete แล้วคุณน้า อย่าหาทำ!", "error");
      return;
    }
    try {
      await transactionService.deleteTransaction(id);
      showToast("ลบเรียบร้อยแล้วจ้าาา", "success");
      await fetchTransactions();
    } catch (err: any) {
      showToast("Backend บอกว่าลบไม่ได้จ้า!", "error");
    }
  };

  const toggleFilter = () => {
    const isToday = monthFilter === currentMonth && dayFilter === currentDay;
    if (isToday) {
      setMonthFilter("all");
      setDayFilter("all");
    } else {
      setMonthFilter(currentMonth);
      setDayFilter(currentDay);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "confirmed") return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    if (s === "draft") return "bg-amber-50 text-amber-600 border border-amber-100";
    return "bg-slate-50 text-slate-600 border border-slate-100";
  };

  return (
    // 🟢 1. พื้นหลัง style dashboard: เปลี่ยนเป็นสีเทาอ่อน Slate 50
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Ledger History</h1>
            <h2 className="text-4xl font-extrabold text-slate-950 tracking-tighter">รายการธุรกรรม</h2>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => handleNewBill("SELL")}
              className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>📤</span> ขายออก
            </button>
            <button
              onClick={() => handleNewBill("BUY")}
              className="flex-1 md:flex-none bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>📥</span> ซื้อเข้า
            </button>
          </div>
        </div>

        {/* 🟢 2. Filter Section: เปลี่ยนสีและ Shadow ให้ดูมินิมอลแบบ Dashboard */}
        <div className="flex flex-wrap gap-4 mb-10 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <select 
            className="border-none rounded-xl px-4 py-3 bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 text-sm cursor-pointer"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">ทุกเดือน</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
              </option>
            ))}
          </select>
          
          <select 
            className="border-none rounded-xl px-4 py-3 bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 text-sm cursor-pointer"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option value="all">ทุกวัน</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>

          <button 
            onClick={toggleFilter}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border shadow-sm flex items-center gap-3 ${
              monthFilter === "all" && dayFilter === "all"
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-blue-600 border-blue-200 hover:border-blue-300"
            }`}
          >
            {monthFilter === "all" && dayFilter === "all" ? (
              <><span className="text-base">📍</span> กรองเฉพาะวันนี้</>
            ) : (
              <><span className="text-base">🌐</span> ดูทั้งหมด</>
            )}
          </button>

          <div className="relative flex-1 min-w-[280px]">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="ค้นหาเลขที่บิล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-100 rounded-xl px-12 py-3.5 font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* 🟢 3. Table Section: เปลี่ยนเป็นสีขาวตัดกับพื้นหลัง Slate 50 */}
        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-200 mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="p-8">ID</th>
                  <th className="p-8">Timestamp</th>
                  <th className="p-8">Transaction Type</th>
                  <th className="p-8">Status</th>
                  <th className="p-8">Total Amount</th>
                  <th className="p-8 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading || !mounted ? (
                  <tr><td colSpan={6} className="text-center p-32 text-slate-300 font-black animate-pulse tracking-widest uppercase">Fetching Data...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-32 text-slate-300 font-bold italic">No transaction records found.</td></tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const dateObj = parseDate(t.transaction_date);
                    return (
                      <tr key={t.transaction_id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-8">
                          <DisplayNumber index={Number(t.display_id) || 0} />
                        </td>
                        <td className="p-8">
                          <div className="text-lg font-extrabold text-slate-900 leading-none mb-1">
                            {dateObj.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} น.
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {dateObj.toLocaleDateString("th-TH", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-8">
                          <span className={`py-1.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            t.transaction_type === 'SELL' 
                              ? "bg-blue-50 text-blue-600 border-blue-100" 
                              : "bg-orange-50 text-orange-600 border-orange-100"
                          }`}>
                            {t.transaction_type === 'SELL' ? '📤 Sell' : '📥 Buy'}
                          </span>
                        </td>
                        <td className="p-8">
                          <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-8">
                            <span className="text-xs font-bold text-slate-300 mr-1 italic">฿</span>
                            <span className="font-black text-slate-950 text-3xl tracking-tighter">
                                {(t.total_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </td>
                        <td className="p-8">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => router.push(`/transactions/${t.transaction_id}`)}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-100"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleDelete(t.transaction_id, t.status)}
                              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-100"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[999] px-8 py-4 rounded-2xl shadow-2xl font-black text-white transition-all animate-bounce ${
          toast.type === "error" ? "bg-red-500" : "bg-emerald-600"
        }`}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}
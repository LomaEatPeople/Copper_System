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
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // กันระเบิดตอน Hydration
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
          // สร้างเลข Display ID เช่น "01", "02" เกาะติดกับ Object นี้ไปเลย
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
    setMounted(true); // ยืนยันว่าหน้าจอพร้อมโหลด Date แล้ว
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
    
    const searchMatch = search === "" || 
                        t.display_id.includes(search);
    
    return monthMatch && dayMatch && searchMatch;
  });
}, [transactions, monthFilter, dayFilter, search]);

  const handleNewBill = async () => {
    try {
      const response = await transactionService.createTransaction({ user_id: 0 });
      const newId = response.data?.transaction_id || response.data;
      if (newId) router.push(`/transactions/${newId}`);
    } catch (error) {
      alert("ไม่สามารถสร้างบิลใหม่ได้");
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

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "confirmed") return "bg-green-100 text-green-700 border border-green-200";
    if (s === "draft") return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  return (
    <div className="min-h-screen bg-[#dce8d8] p-4 md:p-10 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black tracking-tight">Transactions Management</h2>
          <button
            onClick={handleNewBill}
            className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95"
          >
            + NEW BILL
          </button>
        </div>

        {/* Filter Section */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <select 
            className="border-none rounded-xl px-4 py-3 bg-white shadow-sm font-bold outline-none focus:ring-2 focus:ring-green-500"
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
            className="border-none rounded-xl px-4 py-3 bg-white shadow-sm font-bold outline-none focus:ring-2 focus:ring-green-500"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option value="all">ทุกวันที่</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="ค้นหาเลขที่บิล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none rounded-xl px-5 py-3 flex-1 shadow-sm font-bold outline-none focus:ring-2 focus:ring-green-600 bg-white"
          />
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="p-6">ID</th>
                  <th className="p-6">Time & Date</th>
                  <th className="p-6">Type</th>
                  <th className="p-6">Status</th>
                  <th className="p-6">Total Amount</th>
                  <th className="p-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading || !mounted ? (
                  <tr><td colSpan={6} className="text-center p-24 text-gray-400 font-black animate-pulse">LOADING DATA...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-24 text-gray-300 font-bold italic">NO TRANSACTIONS FOUND</td></tr>
                ) : (
                  filteredTransactions.map((t, index) => {
                    const dateObj = parseDate(t.transaction_date);
                    return (
                      <tr key={t.transaction_id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="p-6 font-black text-blue-600 text-lg">
                          {/* ใช้ DisplayNumber รัน 01, 02 ให้สวยๆ */}
                          <DisplayNumber index={Number(t.display_id) || 0} />
                        </td>
                        <td className="p-6">
                          <div className="text-xl font-black text-gray-900 leading-none mb-1">
                            {dateObj.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} น.
                          </div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {dateObj.toLocaleDateString("th-TH", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="py-1 px-3 bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                            {t.transaction_type}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusStyle(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-6 font-black text-gray-900 text-2xl tracking-tighter">
                          ฿{(t.total_cost || 0).toLocaleString()}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => router.push(`/transactions/${t.transaction_id}`)}
                              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-blue-600 shadow-md transition-all active:scale-95 whitespace-nowrap"
                            >
                              OPEN
                            </button>
                            <button
                              onClick={() => handleDelete(t.transaction_id, t.status)}
                              className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white active:scale-95 shadow-sm border border-red-100"
                            >
                              <img 
                                src="https://cdn-icons-png.flaticon.com/512/6861/6861362.png" 
                                alt="delete" 
                                className="w-8 h-8 object-contain"
                              />
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
          toast.type === "error" ? "bg-red-500" : "bg-green-600"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
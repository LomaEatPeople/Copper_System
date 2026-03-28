"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; 

export default function Sidebar() {
  const pathname = usePathname();

  const getLinkStyle = (path: string) => {
    // เช็คว่า path ปัจจุบันตรงกับเมนูไหม
    const isActive = pathname === path || (path !== "/" && pathname.startsWith(path));
    
    return `block px-6 py-4 rounded-[1.5rem] transition-all duration-300 mb-2 ${
      isActive 
        ? "bg-slate-900 text-white font-black shadow-xl translate-x-2" // ตอน Active: ให้สีตัดกับพื้นหลังและขยับออกมานิดนึง
        : "text-gray-700 hover:bg-[#8ba88b]/30 hover:text-black font-bold uppercase text-[12px] tracking-widest"
    }`;
  };

  return (
      <aside className="
        hidden               /* 📱 ซ่อนใน Tablet และมือถือ */
        lg:block             /* 💻 โชว์เฉพาะหน้าจอ Desktop (1024px+) */
        w-72 
        min-h-screen 
        bg-[#a7c3a7] 
        p-8 
        shadow-[10px_0_30px_rgba(0,0,0,0.05)] 
        sticky 
        top-0 
        z-50
      ">

        {/* Logo Section */}
        <div className="mb-12 pb-6 border-b border-[#8ba88b]/50">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-2xl shadow-sm">
              <img 
                src="/Logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain" 
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tighter leading-none">
                PARINYA
              </h1>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Management</span>
            </div>
          </div>
        </div>

        {/* Menu Title */}
        <p className="text-[10px] font-black text-[#6d8a6d] uppercase tracking-[0.4em] mb-6 ml-2">Main Menu</p>

        {/* Navigation */}
        <nav className="space-y-1">
          <Link href="/dashboard" className={getLinkStyle("/dashboard")}>
            <span className="mr-3 text-lg">📊</span> Dashboard
          </Link>

          <Link href="/transactions" className={getLinkStyle("/transactions")}>
            <span className="mr-3 text-lg">📝</span> Transactions
          </Link>

          <Link href="/items" className={getLinkStyle("/items")}>
            <span className="mr-3 text-lg">📦</span> Store Items
          </Link>

          <Link href="/stocks" className={getLinkStyle("/stocks")}>
            <span className="mr-3 text-lg">📈</span> Stock & Margin
          </Link>
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-10 left-8 right-8 p-6 bg-[#8ba88b]/20 rounded-[2rem] border border-[#8ba88b]/30">
          <p className="text-[9px] font-black text-[#5a735a] uppercase tracking-widest leading-relaxed">
            Logged in as Admin<br/>
            v2.6.0 Stable
          </p>
        </div>

    </aside>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // ตัวช่วยเช็คว่าตอนนี้อยู่หน้าไหน

export default function Sidebar() {
  const pathname = usePathname(); // ดึง Path ปัจจุบันมาเก็บไว้

  // ฟังก์ชันช่วยจัดการ Class (ถ้า Path ตรงกัน ให้ใช้สีเข้ม)
  const getLinkStyle = (path: string) => {
    const isActive = pathname === path || (path !== "/" && pathname.startsWith(path));
    
    return `block px-4 py-3 rounded-2xl transition-all duration-200 ${
      isActive 
        ? "bg-[#8ba88b] text-black font-black shadow-inner" // ตอน Active: พื้นหลังเข้มขึ้น + ตัวหนา + มีเงาข้างในเล็กๆ
        : "text-gray-700 hover:bg-[#b5cdb5] hover:text-black font-medium" // ตอนปกติ: สีจางกว่า + Hover แล้วเข้มขึ้นนิดนึง
    }`;
  };

  return (
      <aside className="w-64 min-h-screen bg-[#a7c3a7] p-6 shadow-lg">

            {/* Logo Section */}
            <div className="mb-10 pb-4 border-b border-[#8ba88b]">
              <div className="flex items-center gap-3">
                {/* แก้ไข path ตรงนี้: ตัด /public ออกนะคะ */}
                <img 
                  src="/Logo.png" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain rounded-lg" 
                />
                <h1 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">
                  PARINYA
                </h1>
              </div>
            </div>

      {/* Menu */}
      <nav className="space-y-2"> {/* ปรับช่องไฟให้ชิดขึ้นหน่อยเพื่อความสวยงาม */}

        <Link href="/dashboard" className={getLinkStyle("/dashboard")}>
          Dashboard
        </Link>

        <Link href="/transactions" className={getLinkStyle("/transactions")}>
          Transactions
        </Link>

        <Link href="/items" className={getLinkStyle("/items")}>
          Items
        </Link>

        <Link href="/stocks" className={getLinkStyle("/stock")}>
          Stock
        </Link>

      </nav>

    </aside>
  );
}
// layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "PARINYA - ระบบจัดการร้านรับซื้อของเก่า",
  description: "ระบบจัดการร้านรับซื้อของเก่า ทองแดง อะลูมิเนียม เหล็ก",
  manifest: "/manifest.json",
  icons: {
    icon: ["/icons/icon-192.png", "/icons/icon-512.png"],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* 🟢 ใช้ bg-slate-50 เพื่อให้ Content ดูเด่นและพรีเมียม */}
        <div className="flex min-h-screen bg-slate-50 font-sans">

          {/* Sidebar จะซ่อนตัวเองอัตโนมัติเมื่อเปิดบน Tablet (ขนาด < 1024px) */}
          <Sidebar />

          <main className="flex-1 w-full overflow-x-hidden">
            {children}
          </main>

        </div>
        <PwaRegister />
      </body>
    </html>
  );
}
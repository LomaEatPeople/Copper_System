// layout.tsx
import "./globals.css";
import Sidebar from "@/components/sidebar";

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
      </body>
    </html>
  );
}
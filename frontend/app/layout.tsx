import "./globals.css";
import Sidebar from "@/components/sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>

        <div className="flex min-h-screen bg-gradient-to-r from-green-100 to-gray-100">

          <Sidebar />

          <main className="flex-1">
            {children}
          </main>

        </div>

      </body>
    </html>
  );
}
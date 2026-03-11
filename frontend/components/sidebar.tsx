"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#a7c3a7] p-6">

      {/* Logo */}
      <div className="text-xl font-bold mb-10 text-gray-800 pb-4 border-b border-gray-300">
        Parinya
      </div>

      {/* Menu */}
      <nav className="space-y-8 text-gray-700">

        <Link
          href="/"
          className="block hover:text-black"
        >
          Dashboard
        </Link>

        <Link
          href="/transactions"
          className="block font-semibold text-black"
        >
          Transactions
        </Link>

        <Link
          href="/items"
          className="block hover:text-black"
        >
          Items
        </Link>

        <Link
          href="/stock"
          className="block hover:text-black"
        >
          Stock
        </Link>

      </nav>

    </aside>
  );
}
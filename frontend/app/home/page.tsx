import Image from "next/image";

export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto">

      <div>
          <Image
          src="/parinya-logo.jpeg"
          alt="Parinya Store Logo"
          width={60}
          height={60}
          className="mb-6"
        />

        <h1 className="text-2xl font-bold mb-6">
          Parinya Store
        </h1>
      </div>

      <button className="mb-6 px-4 py-2 border rounded hover:bg-gray-100">
        New Transaction
      </button>

    </div>
  );
}
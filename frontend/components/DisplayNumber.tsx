// components/DisplayNumber.tsx
type Props = {
  index: string | number;
  currentPage?: number;
  itemsPerPage?: number;
};

export default function DisplayNumber({ index }: Props) {
  // 🟢 ไม่ต้องมีสูตรคำนวณบวกเลขแล้ว เพราะ index ที่ส่งมาคือเลขที่ถูกต้องแล้วค่ะ
  return (
    <span className="font-mono font-bold text-gray-400">
      {index}.
    </span>
  );
}
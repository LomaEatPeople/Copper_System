type Props = {
  index: number;
  currentPage?: number;
  itemsPerPage?: number;
};

export default function DisplayNumber({ index, currentPage = 1, itemsPerPage = 0 }: Props) {
  // คำนวณเลขลำดับเผื่ออนาคตมีการทำ Pagination (แบ่งหน้า)
  const displayNumber = (currentPage - 1) * itemsPerPage + (index + 1);
  
  return (
    <span className="font-mono font-bold text-gray-400">
      {String(displayNumber).padStart(2, '0')}.
    </span>
  );
}
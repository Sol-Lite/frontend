export default function EditHandle({ onDelete }) {
  return (
    <button
      aria-label="위젯 삭제"
      onClick={(e) => { e.stopPropagation(); onDelete?.() }}
      className="absolute top-1.5 left-1.5 z-20 w-[22px] h-[22px] rounded-full bg-danger border-2 border-surface text-white text-[14px] font-bold leading-none flex items-center justify-center shadow-delete-btn hover:opacity-85 transition-opacity duration-[150ms]"
    >
      −
    </button>
  )
}

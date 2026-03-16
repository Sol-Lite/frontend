export default function LiveDot({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-[5px] h-[5px]',
    md: 'w-[6px] h-[6px]',
  }

  return (
    <span
      className={`inline-flex rounded-full bg-live flex-shrink-0 animate-pulse-dot ${sizes[size]} ${className}`}
    />
  )
}

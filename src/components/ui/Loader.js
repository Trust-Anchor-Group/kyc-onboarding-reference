import React from 'react'

export default function Loader({ text = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <span className="relative flex h-12 w-12 mb-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FBB040] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-12 w-12 bg-[#FBB040]" />
        <svg className="absolute top-0 left-0 h-12 w-12 text-[#004866] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </span>
      <span className="text-white text-lg font-semibold mt-2 animate-pulse">{text}</span>
    </div>
  )
}

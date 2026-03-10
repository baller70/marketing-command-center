"use client"

export default function FormbricksPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full -m-8">
      <iframe
        src="http://localhost:8086"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

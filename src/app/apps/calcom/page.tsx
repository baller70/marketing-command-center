"use client"

export default function CalcomPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full -m-8">
      <iframe
        src="http://localhost:8089"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

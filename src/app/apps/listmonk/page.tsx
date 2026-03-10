"use client"

export default function ListmonkPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full -m-8">
      <iframe
        src="http://localhost:8095"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}

import { Suspense } from 'react'
import HomeClient from './home-client'

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeClient />
    </Suspense>
  )
}

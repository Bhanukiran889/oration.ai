'use client'

import { useUser } from '@clerk/nextjs'

export default function HomePage() {
  const { user } = useUser()

  console.log(user) // user.id, user.email, user.firstName, user.lastName
  return <div>Welcome, {user?.firstName}
  <p>user id: {user?.id}</p></div>
}

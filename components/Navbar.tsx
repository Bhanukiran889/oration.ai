'use client';

import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{ display: 'flex', gap: '10px', padding: '10px' }}>
      <Link href="/">Home</Link>

      <SignedIn>
        <UserButton />
        <Link href="/profile">Profile</Link>
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <button>Login</button>
        </SignInButton>
      </SignedOut>
    </nav>
  );
}

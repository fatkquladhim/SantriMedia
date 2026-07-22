import { redirect } from 'next/navigation'

// Root route — always redirect to login.
// Authenticated users are handled by middleware which redirects to /dashboard.
export default function Home() {
    redirect('/login')
}
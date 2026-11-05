import { redirect } from 'next/navigation'

// Marketing landing page (User Story 6) comes after the core flow; until then enter the app.
export default function Home() {
	redirect('/app')
}

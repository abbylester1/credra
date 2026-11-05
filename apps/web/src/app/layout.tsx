import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
	title: 'Credra | Verified invoice financing',
	description:
		'Trust-backed financing infrastructure connecting verified business receivables with on-chain capital. Testnet demo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}

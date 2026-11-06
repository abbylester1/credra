'use client'

/** Four-stage progress rail for an invoice. Failed states mark the stage where the path stopped. */
const STAGES = ['Submitted', 'Verified', 'Funded', 'Repaid']

function position(status: number): { done: number; problem: number | null; review: boolean } {
	switch (status) {
		case 1: return { done: 0, problem: null, review: false }
		case 2: return { done: 0, problem: null, review: true }
		case 3: return { done: 1, problem: null, review: false }
		case 4: return { done: 0, problem: 1, review: false }
		case 5: return { done: 2, problem: null, review: false }
		case 6: return { done: 3, problem: null, review: false }
		case 7: return { done: 2, problem: 3, review: false }
		default: return { done: 0, problem: null, review: false }
	}
}

export function Lifecycle({ status }: { status: number }) {
	const { done, problem, review } = position(status)
	return (
		<ol className="mb-6 grid grid-cols-4 gap-0 rounded-card border border-hair bg-card px-4 py-5 sm:px-8" aria-label="Invoice progress">
			{STAGES.map((label, i) => {
				const complete = i <= done
				const failed = problem === i
				const current = !failed && i === done + 1 && problem === null
				const connectorOn = i < done
				return (
					<li key={label} className="relative flex flex-col items-center text-center">
						{i > 0 && (
							<span className="absolute right-1/2 top-[13px] h-[2px] w-full bg-hair" aria-hidden>
								<span className={`animate-fillbar block h-full ${failed ? 'bg-s-reject' : 'bg-verified'}`} style={{ transform: connectorOn || failed ? undefined : 'scaleX(0)', animationDelay: `${i * 120}ms` }} />
							</span>
						)}
						<span
							className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
								failed ? 'bg-s-reject text-white' : complete ? 'bg-verified text-white' : current ? 'animate-pulse-ring border-2 border-accent bg-card text-accent' : 'bg-inset text-ink-3'
							}`}
						>
							{failed ? '✕' : complete ? '✓' : i + 1}
						</span>
						<span className={`mt-2 text-[13px] ${complete || current ? 'font-medium text-ink' : 'text-ink-3'}`}>{label}</span>
						{i === 1 && review && <span className="mt-0.5 text-[11px] text-s-review">Under review</span>}
						{failed && <span className="mt-0.5 text-[11px] text-s-reject">{i === 3 ? 'Defaulted' : 'Rejected'}</span>}
					</li>
				)
			})}
		</ol>
	)
}

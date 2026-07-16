export default function Home() {
	return (
		<main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
			<div className="mx-auto max-w-5xl">
				<p className="font-mono text-sm uppercase tracking-[0.24em] text-cyan-300">Cloudflare platform reference</p>
				<h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-7xl">EdgeOps Dashboard</h1>
				<p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
					A clean-room operations dashboard built with Next.js, OpenNext, Cloudflare Workers, and D1.
				</p>
				<div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
					<p className="text-sm font-medium text-emerald-300">Foundation ready</p>
					<p className="mt-2 text-slate-400">Operational data and service health will appear here in the next implementation stage.</p>
				</div>
			</div>
		</main>
	);
}

import Link from "next/link";

export default function Unauthorized() {
	return (
		<main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100">
			<section className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
				<p className="font-mono text-xs uppercase tracking-[0.24em] text-amber-300">Protected route</p>
				<h1 className="mt-4 text-3xl font-semibold">Access could not be verified</h1>
				<p className="mt-4 leading-7 text-slate-300">
					The operations console is available only through its configured access gateway. No identity details were stored.
				</p>
				<Link className="mt-8 inline-flex text-sm font-medium text-cyan-300 hover:text-cyan-200" href="/">
					Return to public dashboard
				</Link>
			</section>
		</main>
	);
}

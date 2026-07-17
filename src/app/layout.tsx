import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "EdgeOps Dashboard",
	description: "A clean-room Cloudflare platform operations reference built with Workers, D1, OpenNext, and GitHub Actions.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body>{children}</body>
		</html>
	);
}

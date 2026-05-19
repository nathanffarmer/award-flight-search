export function formatMiles(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
	return n.toLocaleString();
}

export function formatUSD(n: number): string {
	return `$${n.toFixed(0)}`;
}

export function formatDate(iso: string): string {
	const d = new Date(iso + 'T00:00:00Z');
	return d.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		weekday: 'short',
		timeZone: 'UTC'
	});
}

export function formatDateLong(iso: string): string {
	const d = new Date(iso + 'T00:00:00Z');
	return d.toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

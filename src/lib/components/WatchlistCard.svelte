<script lang="ts">
	import {
		CABIN_LABELS,
		type WatchedTrip,
		type AwardAvailability,
		type CabinAvailability,
		type Cabin
	} from '$lib/types';
	import { formatMiles, formatDate } from '$lib/format';
	import CabinBadge from './CabinBadge.svelte';
	import { ArrowRight, Trash2, Loader2 } from '@lucide/svelte';

	let {
		trip,
		results,
		loading,
		onDelete
	}: {
		trip: WatchedTrip;
		results: AwardAvailability[] | undefined;
		loading: boolean;
		onDelete: (id: string) => void;
	} = $props();

	const best = $derived.by(() => {
		const out: Partial<Record<Cabin, { miles: number; date: string; program: string }>> = {};
		if (!results) return out;
		for (const r of results) {
			for (const [cabin, info] of Object.entries(r.cabins) as [Cabin, CabinAvailability][]) {
				const current = out[cabin];
				if (!current || info.mileageCost < current.miles) {
					out[cabin] = { miles: info.mileageCost, date: r.date, program: r.program };
				}
			}
		}
		return out;
	});

	const hasAny = $derived(results && results.length > 0);
</script>

<article class="card">
	<header>
		<div class="route">
			<span class="airport">{trip.origin}</span>
			<ArrowRight size={16} />
			<span class="airport">{trip.destination}</span>
		</div>
		<button
			type="button"
			class="delete"
			aria-label="Remove trip"
			onclick={() => onDelete(trip.id)}
		>
			<Trash2 size={14} />
		</button>
	</header>

	<div class="meta">
		<span>{formatDate(trip.departDate)}</span>
		{#if trip.flexDays > 0}
			<span class="flex">±{trip.flexDays}d</span>
		{/if}
		<span class="dot">·</span>
		<div class="cabins">
			{#each trip.cabins as c (c)}
				<CabinBadge cabin={c} size="sm" />
			{/each}
		</div>
	</div>

	<div class="results">
		{#if loading}
			<div class="loading"><Loader2 size={14} class="spin" /> Searching…</div>
		{:else if !hasAny}
			<div class="none">No matching availability.</div>
		{:else}
			<div class="best-grid">
				{#each trip.cabins as cabin (cabin)}
					{@const b = best[cabin]}
					<div class="best-cell" class:empty={!b}>
						<div class="best-cabin">{CABIN_LABELS[cabin]}</div>
						{#if b}
							<div class="best-miles">{formatMiles(b.miles)}</div>
							<div class="best-when">{formatDate(b.date)}</div>
						{:else}
							<div class="best-miles dim">—</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<a class="footer-link" href="/trips/{trip.id}">
		View all options <ArrowRight size={14} />
	</a>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.route {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 18px;
		font-weight: 600;
	}
	.airport {
		font-family: var(--font-mono);
		letter-spacing: 0.02em;
	}
	.delete {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-muted);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.delete:hover {
		color: var(--color-text);
		background: color-mix(in srgb, var(--color-text) 8%, transparent);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-muted);
		font-size: 13px;
	}
	.flex {
		font-family: var(--font-mono);
		font-size: 12px;
	}
	.dot {
		opacity: 0.4;
	}
	.cabins {
		display: inline-flex;
		gap: 4px;
	}
	.results {
		min-height: 60px;
	}
	.loading,
	.none {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-muted);
		font-size: 13px;
	}
	:global(.spin) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.best-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: var(--space-2);
	}
	.best-cell {
		padding: var(--space-2);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-accent) 6%, transparent);
	}
	.best-cell.empty {
		background: transparent;
		border: 1px dashed var(--color-border);
	}
	.best-cabin {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-muted);
	}
	.best-miles {
		font-family: var(--font-mono);
		font-size: 16px;
		font-weight: 600;
		margin-top: 2px;
	}
	.best-miles.dim {
		color: var(--color-muted);
	}
	.best-when {
		font-size: 11px;
		color: var(--color-muted);
		margin-top: 2px;
	}
	.footer-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		font-weight: 500;
		text-decoration: none;
		margin-top: var(--space-1);
	}
	.footer-link:hover {
		text-decoration: underline;
	}
</style>

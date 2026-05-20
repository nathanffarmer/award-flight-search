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
		returnResults,
		returnLoading = false,
		onDelete
	}: {
		trip: WatchedTrip;
		results: AwardAvailability[] | undefined;
		loading: boolean;
		returnResults?: AwardAvailability[] | undefined;
		returnLoading?: boolean;
		onDelete: (id: string) => void;
	} = $props();

	type BestPerCabin = Partial<Record<Cabin, { miles: number; date: string }>>;

	function computeBest(rows: AwardAvailability[] | undefined): BestPerCabin {
		const out: BestPerCabin = {};
		if (!rows) return out;
		for (const r of rows) {
			for (const [cabin, info] of Object.entries(r.cabins) as [
				Cabin,
				CabinAvailability | undefined
			][]) {
				if (!info) continue;
				const current = out[cabin];
				if (!current || info.mileageCost < current.miles) {
					out[cabin] = { miles: info.mileageCost, date: r.date };
				}
			}
		}
		return out;
	}

	const bestOut = $derived(computeBest(results));
	const bestReturn = $derived(computeBest(returnResults));

	const isRoundTrip = $derived(!!trip.returnDate);
	const anyLoading = $derived(loading || (isRoundTrip && returnLoading));
	const hasAny = $derived(
		(results && results.length > 0) || (returnResults && returnResults.length > 0)
	);
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
		<span>
			{formatDate(trip.departDate)}{#if trip.returnDate}
				<span class="meta-sep"> → </span>{formatDate(trip.returnDate)}{/if}
		</span>
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
		{#if anyLoading}
			<div class="loading"><Loader2 size={14} class="spin" /> Searching…</div>
		{:else if !hasAny}
			<div class="none">No matching availability.</div>
		{:else}
			<div class="best-grid">
				{#each trip.cabins as cabin (cabin)}
					{@const o = bestOut[cabin]}
					{@const r = isRoundTrip ? bestReturn[cabin] : undefined}
					<div class="best-cell" class:empty={!o && !r}>
						<div class="best-cabin">{CABIN_LABELS[cabin]}</div>
						{#if isRoundTrip}
							<div class="leg">
								<span class="leg-tag">OUT</span>
								<span class="leg-miles">{o ? formatMiles(o.miles) : '—'}</span>
							</div>
							<div class="leg">
								<span class="leg-tag">RET</span>
								<span class="leg-miles">{r ? formatMiles(r.miles) : '—'}</span>
							</div>
						{:else if o}
							<div class="best-miles">{formatMiles(o.miles)}</div>
							<div class="best-when">{formatDate(o.date)}</div>
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
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
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
	.leg {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-2);
		margin-top: 2px;
	}
	.leg-tag {
		font-family: var(--font-mono);
		font-size: 9px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: var(--color-muted);
	}
	.leg-miles {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 600;
	}
	.meta-sep {
		color: var(--color-muted);
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

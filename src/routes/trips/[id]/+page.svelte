<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { watchlist } from '$lib/store/watchlist.svelte';
	import { postSearch } from '$lib/search-client';
	import AwardOptionRow from '$lib/components/AwardOptionRow.svelte';
	import CabinBadge from '$lib/components/CabinBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TripNotFound from '$lib/components/TripNotFound.svelte';
	import { formatDateLong } from '$lib/format';
	import {
		CABIN_LABELS,
		tripToSearchRequest,
		tripToReturnSearchRequest,
		type AwardAvailability,
		type CabinAvailability,
		type Cabin,
		type SearchResponse
	} from '$lib/types';
	import type { QueryObserverResult } from '@tanstack/svelte-query';
	import { ArrowLeft, ArrowRight, Loader2, Pencil, Plane } from '@lucide/svelte';

	const tripId = $derived(page.params.id ?? '');
	const trip = $derived(watchlist.get(tripId));

	let cabinFilter = $state<Cabin | 'all'>('all');
	let sortKey = $state<'miles' | 'date' | 'taxes'>('miles');
	let directOnly = $state(false);

	const outboundQuery = untrack(() =>
		createQuery<SearchResponse>({
			queryKey: ['trip-search', tripId, trip?.updatedAt],
			queryFn: () => {
				if (!trip) throw new Error('no trip');
				return postSearch(tripToSearchRequest(trip));
			},
			enabled: !!trip,
			staleTime: 60_000
		})
	);

	const returnQuery = untrack(() =>
		createQuery<SearchResponse>({
			queryKey: ['trip-search', tripId, trip?.updatedAt, 'return'],
			queryFn: () => {
				if (!trip?.returnDate) throw new Error('no return date');
				return postSearch(tripToReturnSearchRequest(trip));
			},
			enabled: !!trip?.returnDate,
			staleTime: 60_000
		})
	);

	function bestMilesIn(r: AwardAvailability, restrictTo: Cabin | 'all'): number {
		let min = Infinity;
		for (const [c, info] of Object.entries(r.cabins) as [
			Cabin,
			CabinAvailability | undefined
		][]) {
			if (!info) continue;
			if (restrictTo !== 'all' && c !== restrictTo) continue;
			if (info.mileageCost < min) min = info.mileageCost;
		}
		return min;
	}

	function hasDirectIn(r: AwardAvailability, restrictTo: Cabin | 'all'): boolean {
		if (restrictTo !== 'all') return r.cabins[restrictTo]?.direct ?? false;
		for (const info of Object.values(r.cabins) as (CabinAvailability | undefined)[]) {
			if (info?.direct) return true;
		}
		return false;
	}

	function filterAndSort(data: AwardAvailability[]): AwardAvailability[] {
		const f = cabinFilter;
		let rows = f === 'all' ? [...data] : data.filter((r) => r.cabins[f]?.available);
		if (directOnly) rows = rows.filter((r) => hasDirectIn(r, f));
		if (sortKey === 'date') {
			rows.sort((a, b) => a.date.localeCompare(b.date));
		} else if (sortKey === 'taxes') {
			rows.sort((a, b) => a.taxesUSD - b.taxesUSD);
		} else {
			const keyed = rows.map((r) => ({ r, key: bestMilesIn(r, f) }));
			keyed.sort((a, b) => a.key - b.key);
			return keyed.map((k) => k.r);
		}
		return rows;
	}

	const outboundFiltered = $derived.by(() => filterAndSort($outboundQuery.data?.results ?? []));
	const returnFiltered = $derived.by(() => filterAndSort($returnQuery.data?.results ?? []));
</script>

<section class="page">
	<div class="top-bar">
		<a class="back" href="/"><ArrowLeft size={14} /> Watchlist</a>
		{#if trip}
			<a class="edit" href="/trips/{trip.id}/edit"><Pencil size={14} /> Edit</a>
		{/if}
	</div>

	{#if !trip}
		<TripNotFound />
	{:else}
		<header class="head">
			<div class="title">
				<span class="airport">{trip.origin}</span>
				<ArrowRight size={20} />
				<span class="airport">{trip.destination}</span>
				{#if trip.returnDate}
					<span class="rt-tag">round trip</span>
				{/if}
			</div>
			<div class="sub">
				{formatDateLong(trip.departDate)}{#if trip.returnDate}
					<span class="sub-sep"> → </span>{formatDateLong(trip.returnDate)}{/if}
				{trip.flexDays > 0 ? ` · ± ${trip.flexDays} days` : ''}
			</div>
		</header>

		<div class="toolbar">
			<div class="toolbar-group">
				<span class="label">Cabin</span>
				<button
					type="button"
					class="tab"
					class:on={cabinFilter === 'all'}
					onclick={() => (cabinFilter = 'all')}>All</button
				>
				{#each trip.cabins as c (c)}
					<button
						type="button"
						class="tab"
						class:on={cabinFilter === c}
						onclick={() => (cabinFilter = c)}
					>
						<CabinBadge cabin={c} size="sm" />
						{CABIN_LABELS[c]}
					</button>
				{/each}
			</div>

			<div class="toolbar-group">
				<span class="label">Sort</span>
				<button
					type="button"
					class="tab"
					class:on={sortKey === 'miles'}
					onclick={() => (sortKey = 'miles')}>Miles</button
				>
				<button
					type="button"
					class="tab"
					class:on={sortKey === 'date'}
					onclick={() => (sortKey = 'date')}>Date</button
				>
				<button
					type="button"
					class="tab"
					class:on={sortKey === 'taxes'}
					onclick={() => (sortKey = 'taxes')}>Taxes</button
				>
			</div>

			<div class="toolbar-group">
				<button
					type="button"
					class="tab"
					class:on={directOnly}
					onclick={() => (directOnly = !directOnly)}
					aria-pressed={directOnly}
				>
					<Plane size={14} />
					Direct only
				</button>
			</div>
		</div>

		{#snippet leg(
			heading: string | null,
			q: QueryObserverResult<SearchResponse>,
			rows: AwardAvailability[]
		)}
			{#if heading}
				<h3 class="leg-heading">{heading}</h3>
			{/if}
			{#if q.isLoading}
				<div class="loading"><Loader2 size={16} class="spin" /> Searching seats.aero…</div>
			{:else if q.isError}
				<div class="error">Something went wrong loading results.</div>
			{:else if rows.length === 0}
				<EmptyState
					title="No matching availability"
					description="Try widening your date flex, adding programs, or removing the miles cap."
				/>
			{:else}
				<div class="meta">
					{rows.length} result{rows.length === 1 ? '' : 's'}
					{#if q.data?.source === 'mock'}
						<span class="mock-tag">mock data</span>
					{/if}
				</div>
				<div class="list">
					{#each rows as result (result.id)}
						<AwardOptionRow {result} />
					{/each}
				</div>
			{/if}
		{/snippet}

		{#if trip.returnDate}
			<section class="leg-section">
				{@render leg(`Outbound — ${trip.origin} → ${trip.destination}`, $outboundQuery, outboundFiltered)}
			</section>
			<section class="leg-section">
				{@render leg(`Return — ${trip.destination} → ${trip.origin}`, $returnQuery, returnFiltered)}
			</section>
		{:else}
			{@render leg(null, $outboundQuery, outboundFiltered)}
		{/if}
	{/if}
</section>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding-top: var(--space-4);
	}
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.back,
	.edit {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		color: var(--color-muted);
		text-decoration: none;
		width: fit-content;
	}
	.back:hover,
	.edit:hover {
		color: var(--color-text);
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.title {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-3);
		font-size: 28px;
		font-weight: 600;
	}
	.airport {
		font-family: var(--font-mono);
	}
	.sub {
		color: var(--color-muted);
		font-size: 14px;
	}
	.sub-sep {
		opacity: 0.6;
	}
	.rt-tag {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
		border-radius: var(--radius-sm);
		padding: 2px 6px;
		white-space: nowrap;
	}
	.leg-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}
	.leg-heading {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3) var(--space-4);
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	.toolbar-group {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}
	@media (max-width: 600px) {
		.toolbar-group {
			flex-basis: 100%;
		}
	}
	.label {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-muted);
		margin-right: 4px;
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px;
		font: inherit;
		font-size: 13px;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		color: var(--color-text);
		cursor: pointer;
	}
	.tab:hover {
		border-color: var(--color-accent);
	}
	.tab.on {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 13px;
		color: var(--color-muted);
	}
	.mock-tag {
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, #f59e0b 18%, transparent);
		color: #f59e0b;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.loading {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-muted);
	}
	.error {
		padding: var(--space-3);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, #ef4444 10%, transparent);
		color: #ef4444;
	}
</style>

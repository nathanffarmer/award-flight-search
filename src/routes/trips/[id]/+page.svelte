<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { watchlist } from '$lib/store/watchlist.svelte';
	import { postSearch } from '$lib/search-client';
	import AwardOptionRow from '$lib/components/AwardOptionRow.svelte';
	import CabinBadge from '$lib/components/CabinBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { formatDateLong } from '$lib/format';
	import {
		CABIN_LABELS,
		tripToSearchRequest,
		type AwardAvailability,
		type CabinAvailability,
		type Cabin,
		type SearchResponse
	} from '$lib/types';
	import { ArrowLeft, ArrowRight, Loader2 } from '@lucide/svelte';

	const tripId = $derived(page.params.id ?? '');
	const trip = $derived(watchlist.get(tripId));

	let cabinFilter = $state<Cabin | 'all'>('all');
	let sortKey = $state<'miles' | 'date'>('miles');

	// queryKey captured at mount; the page remounts per id so id alone is enough.
	const query = untrack(() =>
		createQuery<SearchResponse>({
			queryKey: ['trip-search', tripId],
			queryFn: () => {
				if (!trip) throw new Error('no trip');
				return postSearch(tripToSearchRequest(trip));
			},
			enabled: !!trip,
			staleTime: 60_000
		})
	);

	function bestMilesIn(r: AwardAvailability, restrictTo: Cabin | 'all'): number {
		let min = Infinity;
		for (const [c, info] of Object.entries(r.cabins) as [Cabin, CabinAvailability][]) {
			if (restrictTo !== 'all' && c !== restrictTo) continue;
			if (info.mileageCost < min) min = info.mileageCost;
		}
		return min;
	}

	const filtered = $derived.by((): AwardAvailability[] => {
		const data = $query.data?.results ?? [];
		const f = cabinFilter;
		const rows = f === 'all' ? [...data] : data.filter((r) => r.cabins[f]?.available);
		if (sortKey === 'date') {
			rows.sort((a, b) => a.date.localeCompare(b.date));
		} else {
			const keyed = rows.map((r) => ({ r, key: bestMilesIn(r, f) }));
			keyed.sort((a, b) => a.key - b.key);
			return keyed.map((k) => k.r);
		}
		return rows;
	});
</script>

<section class="page">
	<a class="back" href="/"><ArrowLeft size={14} /> Watchlist</a>

	{#if !trip}
		<EmptyState
			title="Trip not found"
			description="This trip isn't on your watchlist — it may have been removed."
		/>
	{:else}
		<header class="head">
			<div class="title">
				<span class="airport">{trip.origin}</span>
				<ArrowRight size={20} />
				<span class="airport">{trip.destination}</span>
			</div>
			<div class="sub">
				{formatDateLong(trip.departDate)}{trip.flexDays > 0 ? ` ± ${trip.flexDays} days` : ''}
			</div>
		</header>

		<div class="toolbar">
			<div class="filter">
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

			<div class="sort">
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
			</div>
		</div>

		{#if $query.isLoading}
			<div class="loading"><Loader2 size={16} class="spin" /> Searching seats.aero…</div>
		{:else if $query.isError}
			<div class="error">Something went wrong loading results.</div>
		{:else if filtered.length === 0}
			<EmptyState
				title="No matching availability"
				description="Try widening your date flex, adding programs, or removing the miles cap."
			/>
		{:else}
			<div class="meta">
				{filtered.length} result{filtered.length === 1 ? '' : 's'}
				{#if $query.data?.source === 'mock'}
					<span class="mock-tag">mock data</span>
				{/if}
			</div>
			<div class="list">
				{#each filtered as result (result.id)}
					<AwardOptionRow {result} />
				{/each}
			</div>
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
	.back {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		color: var(--color-muted);
		text-decoration: none;
		width: fit-content;
	}
	.back:hover {
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
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		padding: var(--space-3);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	.filter,
	.sort {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
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

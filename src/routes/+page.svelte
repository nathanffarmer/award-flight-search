<script lang="ts">
	import { watchlist } from '$lib/store/watchlist.svelte';
	import TripCardWithData from '$lib/components/TripCardWithData.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { Plus } from '@lucide/svelte';

	const trips = $derived(watchlist.all);
</script>

<section class="page">
	<header class="page-head">
		<div>
			<h2>Watchlist</h2>
			<p>Award deals across your saved trips.</p>
		</div>
		<a href="/trips/new" class="add-button">
			<Plus size={16} />
			Add trip
		</a>
	</header>

	{#if trips.length === 0}
		<EmptyState
			title="Nothing on the watchlist yet"
			description="Add a route and we'll surface the best award deals across the programs you care about."
		>
			{#snippet action()}
				<a href="/trips/new" class="add-button">
					<Plus size={16} />
					Add your first trip
				</a>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="grid">
			{#each trips as trip (trip.id)}
				<TripCardWithData {trip} onDelete={(id) => watchlist.remove(id)} />
			{/each}
		</div>
	{/if}
</section>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding-top: var(--space-4);
	}
	.page-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-3);
	}
	h2 {
		font-size: 24px;
	}
	.page-head p {
		margin: 4px 0 0;
		color: var(--color-muted);
		font-size: 14px;
	}
	.add-button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: var(--color-accent);
		color: white;
		text-decoration: none;
		border-radius: var(--radius-sm);
		font-size: 14px;
		font-weight: 500;
	}
	.add-button:hover {
		filter: brightness(1.05);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: var(--space-4);
	}
</style>

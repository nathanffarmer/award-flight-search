<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import AddTripForm from '$lib/components/AddTripForm.svelte';
	import TripNotFound from '$lib/components/TripNotFound.svelte';
	import { watchlist } from '$lib/store/watchlist.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	const tripId = $derived(page.params.id ?? '');
	const trip = $derived(watchlist.get(tripId));
</script>

<section class="page">
	<a class="back" href="/trips/{tripId}"><ArrowLeft size={14} /> Back to trip</a>

	{#if !trip}
		<TripNotFound />
	{:else}
		<h2>Edit trip</h2>
		<p class="lead">Changes apply on save and refresh the search.</p>
		<AddTripForm
			initialTrip={trip}
			submitLabel="Save changes"
			onSubmit={(changes) => {
				watchlist.update(tripId, changes);
				goto(`/trips/${tripId}`);
			}}
			onCancel={() => goto(`/trips/${tripId}`)}
		/>
	{/if}
</section>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 560px;
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
	h2 {
		font-size: 24px;
	}
	.lead {
		margin: 0;
		color: var(--color-muted);
		max-width: 52ch;
	}
</style>

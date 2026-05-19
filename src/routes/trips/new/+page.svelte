<script lang="ts">
	import { goto } from '$app/navigation';
	import AddTripForm from '$lib/components/AddTripForm.svelte';
	import { watchlist } from '$lib/store/watchlist.svelte';
	import { ArrowLeft } from '@lucide/svelte';
</script>

<section class="page">
	<a class="back" href="/"><ArrowLeft size={14} /> Watchlist</a>
	<h2>Add a trip</h2>
	<p class="lead">
		We'll search seats.aero for award availability in your chosen cabins and programs across a ±N
		day window.
	</p>
	<AddTripForm
		onSubmit={(t) => {
			watchlist.add(t);
			goto('/');
		}}
		onCancel={() => goto('/')}
	/>
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

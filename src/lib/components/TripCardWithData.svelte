<script lang="ts">
	import { untrack } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import {
		tripToSearchRequest,
		tripToReturnSearchRequest,
		type WatchedTrip,
		type SearchResponse
	} from '$lib/types';
	import { postSearch } from '$lib/search-client';
	import WatchlistCard from './WatchlistCard.svelte';

	let {
		trip,
		onDelete
	}: { trip: WatchedTrip; onDelete: (id: string) => void } = $props();

	// Parent keys cards by `${trip.id}:${trip.updatedAt}`; edits remount the card
	// and the captured queryKey reflects the new updatedAt.
	const outboundQuery = untrack(() =>
		createQuery<SearchResponse>({
			queryKey: ['search', trip.id, trip.updatedAt],
			queryFn: () => postSearch(tripToSearchRequest(trip)),
			staleTime: 60_000
		})
	);

	const returnQuery = untrack(() =>
		createQuery<SearchResponse>({
			queryKey: ['search', trip.id, trip.updatedAt, 'return'],
			queryFn: () => postSearch(tripToReturnSearchRequest(trip)),
			enabled: !!trip.returnDate,
			staleTime: 60_000
		})
	);
</script>

<WatchlistCard
	{trip}
	results={$outboundQuery.data?.results}
	loading={$outboundQuery.isLoading}
	returnResults={$returnQuery.data?.results}
	returnLoading={$returnQuery.isLoading && !!trip.returnDate}
	{onDelete}
/>

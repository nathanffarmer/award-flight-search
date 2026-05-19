<script lang="ts">
	import type { AwardAvailability, Cabin } from '$lib/types';
	import { formatMiles, formatUSD, formatDate } from '$lib/format';
	import CabinBadge from './CabinBadge.svelte';
	import ProgramBadge from './ProgramBadge.svelte';
	import { Plane, ArrowRight } from '@lucide/svelte';

	let { result }: { result: AwardAvailability } = $props();

	const cabinEntries = $derived(
		(Object.entries(result.cabins) as [Cabin, NonNullable<AwardAvailability['cabins'][Cabin]>][])
			.sort(([a], [b]) => 'YWJF'.indexOf(a) - 'YWJF'.indexOf(b))
	);
</script>

<article class="row">
	<div class="left">
		<div class="date">{formatDate(result.date)}</div>
		<div class="route">
			<span class="airport">{result.origin}</span>
			<ArrowRight size={12} />
			<span class="airport">{result.destination}</span>
		</div>
		<ProgramBadge program={result.program} />
	</div>

	<div class="cabins">
		{#each cabinEntries as [cabin, info] (cabin)}
			<div class="cabin">
				<div class="cabin-head">
					<CabinBadge {cabin} size="sm" />
					<span class="miles">{formatMiles(info.mileageCost)}</span>
				</div>
				<div class="cabin-meta">
					<span class="taxes">+ {formatUSD(result.taxesUSD)}</span>
					<span class="dot">·</span>
					{#if info.direct}
						<span class="direct"><Plane size={11} /> direct</span>
					{:else}
						<span class="connect">connecting</span>
					{/if}
					<span class="dot">·</span>
					<span class="seats">{info.remainingSeats} seat{info.remainingSeats === 1 ? '' : 's'}</span>
				</div>
				<div class="airlines">{info.airlines.join(' / ')}</div>
			</div>
		{/each}
	</div>
</article>

<style>
	.row {
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}
	.left {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		align-items: flex-start;
	}
	.date {
		font-size: 14px;
		font-weight: 600;
	}
	.route {
		display: flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-muted);
	}
	.cabins {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: var(--space-3);
	}
	.cabin {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.cabin-head {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	.miles {
		font-family: var(--font-mono);
		font-size: 16px;
		font-weight: 600;
	}
	.cabin-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--color-muted);
	}
	.dot {
		opacity: 0.4;
	}
	.direct {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		color: var(--color-accent);
	}
	.airlines {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-muted);
		letter-spacing: 0.04em;
	}
	@media (max-width: 600px) {
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>

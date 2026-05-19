<script lang="ts">
	import type { Cabin } from '$lib/types';
	import { CABIN_LABELS } from '$lib/types';

	let { cabin, size = 'md' }: { cabin: Cabin; size?: 'sm' | 'md' } = $props();
</script>

<span class="badge cabin-{cabin}" class:sm={size === 'sm'} title={CABIN_LABELS[cabin]}>
	{cabin}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 600;
		color: white;
		letter-spacing: 0.02em;
	}
	.sm {
		min-width: 18px;
		height: 18px;
		font-size: 10px;
		padding: 0 4px;
	}
	.cabin-Y {
		background: var(--color-cabin-economy);
	}
	.cabin-W {
		background: var(--color-cabin-premium);
	}
	.cabin-J {
		background: var(--color-cabin-business);
	}
	.cabin-F {
		background: var(--color-cabin-first);
	}
</style>

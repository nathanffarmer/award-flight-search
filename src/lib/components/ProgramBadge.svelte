<script lang="ts">
	import type { Program } from '$lib/types';
	import { PROGRAM_LABELS } from '$lib/types';

	let { program }: { program: Program } = $props();
</script>

<span class="badge">{PROGRAM_LABELS[program]}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		height: 22px;
		padding: 0 8px;
		border-radius: var(--radius-sm);
		font-size: 12px;
		font-weight: 500;
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
		color: var(--color-accent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
	}
</style>

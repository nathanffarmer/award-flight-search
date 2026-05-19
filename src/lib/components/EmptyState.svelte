<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		action
	}: { title: string; description: string; action?: Snippet } = $props();
</script>

<div class="empty">
	<h3>{title}</h3>
	<p>{description}</p>
	{#if action}
		<div class="action">{@render action()}</div>
	{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-6) var(--space-5);
		text-align: center;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}
	h3 {
		font-size: 18px;
	}
	p {
		margin: 0;
		color: var(--color-muted);
		max-width: 44ch;
	}
	.action {
		margin-top: var(--space-2);
	}
</style>

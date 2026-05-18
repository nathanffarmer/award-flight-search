<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { Plane } from '@lucide/svelte';
	import '../app.css';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60_000,
				refetchOnWindowFocus: false
			}
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	<header>
		<Plane size={20} />
		<h1>Award flights</h1>
	</header>
	<main>
		{@render children()}
	</main>
</QueryClientProvider>

<style>
	header {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	header h1 {
		font-size: 16px;
		font-weight: 600;
	}

	main {
		max-width: 960px;
		margin: 0 auto;
		padding: var(--space-5);
	}
</style>

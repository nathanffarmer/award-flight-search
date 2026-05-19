<script lang="ts">
	import type { Cabin, Program, WatchedTrip } from '$lib/types';
	import { CABIN_LABELS, PROGRAM_LABELS } from '$lib/types';

	let {
		onSubmit,
		onCancel
	}: {
		onSubmit: (trip: Omit<WatchedTrip, 'id' | 'createdAt'>) => void;
		onCancel?: () => void;
	} = $props();

	let origin = $state('');
	let destination = $state('');
	let departDate = $state('');
	let flexDays = $state(3);
	let maxMiles = $state<number | null>(null);
	let cabins = $state<Cabin[]>(['J']);
	let programs = $state<Program[]>(['aeroplan', 'aa', 'united', 'flyingblue']);

	let error = $state<string | null>(null);

	const ALL_CABINS: Cabin[] = ['Y', 'W', 'J', 'F'];
	const ALL_PROGRAMS: Program[] = [
		'aeroplan',
		'united',
		'aa',
		'delta',
		'alaska',
		'flyingblue',
		'virgin',
		'lifemiles',
		'etihad',
		'ba'
	];

	function toggleCabin(c: Cabin) {
		cabins = cabins.includes(c) ? cabins.filter((x) => x !== c) : [...cabins, c];
	}

	function toggleProgram(p: Program) {
		programs = programs.includes(p) ? programs.filter((x) => x !== p) : [...programs, p];
	}

	function submit(e: Event) {
		e.preventDefault();
		error = null;

		const o = origin.trim().toUpperCase();
		const d = destination.trim().toUpperCase();

		if (o.length !== 3 || d.length !== 3) {
			error = 'Origin and destination must be 3-letter IATA codes.';
			return;
		}
		if (!departDate) {
			error = 'Pick a departure date.';
			return;
		}
		if (cabins.length === 0) {
			error = 'Pick at least one cabin.';
			return;
		}
		if (programs.length === 0) {
			error = 'Pick at least one program.';
			return;
		}

		onSubmit({
			origin: o,
			destination: d,
			departDate,
			flexDays,
			cabins,
			programs,
			maxMiles: maxMiles ?? undefined
		});
	}
</script>

<form onsubmit={submit}>
	<div class="row two">
		<label>
			<span>Origin</span>
			<input
				type="text"
				maxlength="3"
				placeholder="JFK"
				bind:value={origin}
				autocapitalize="characters"
			/>
		</label>
		<label>
			<span>Destination</span>
			<input
				type="text"
				maxlength="3"
				placeholder="NRT"
				bind:value={destination}
				autocapitalize="characters"
			/>
		</label>
	</div>

	<div class="row two">
		<label>
			<span>Departure</span>
			<input type="date" bind:value={departDate} />
		</label>
		<label>
			<span>Flex (± days)</span>
			<input type="number" min="0" max="14" bind:value={flexDays} />
		</label>
	</div>

	<fieldset>
		<legend>Cabins</legend>
		<div class="chips">
			{#each ALL_CABINS as c (c)}
				<button
					type="button"
					class="chip"
					class:on={cabins.includes(c)}
					onclick={() => toggleCabin(c)}
				>
					{CABIN_LABELS[c]}
				</button>
			{/each}
		</div>
	</fieldset>

	<fieldset>
		<legend>Programs</legend>
		<div class="chips">
			{#each ALL_PROGRAMS as p (p)}
				<button
					type="button"
					class="chip"
					class:on={programs.includes(p)}
					onclick={() => toggleProgram(p)}
				>
					{PROGRAM_LABELS[p]}
				</button>
			{/each}
		</div>
	</fieldset>

	<label>
		<span>Max miles (optional)</span>
		<input
			type="number"
			min="0"
			step="1000"
			placeholder="e.g. 80000"
			bind:value={maxMiles}
		/>
	</label>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	<div class="actions">
		{#if onCancel}
			<button type="button" class="secondary" onclick={onCancel}>Cancel</button>
		{/if}
		<button type="submit" class="primary">Add to watchlist</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.row {
		display: grid;
		gap: var(--space-3);
	}
	.row.two {
		grid-template-columns: 1fr 1fr;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
	}
	input[type='text'],
	input[type='number'],
	input[type='date'] {
		width: 100%;
		padding: 8px 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font: inherit;
		background: var(--color-surface);
		color: var(--color-text);
	}
	input:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: -1px;
		border-color: var(--color-accent);
	}
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	legend {
		padding: 0;
		font-size: 13px;
		font-weight: 500;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.chip {
		padding: 6px 12px;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 13px;
		cursor: pointer;
	}
	.chip:hover {
		border-color: var(--color-accent);
	}
	.chip.on {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}
	.primary,
	.secondary {
		padding: 9px 16px;
		font: inherit;
		font-weight: 500;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.primary {
		background: var(--color-accent);
		border: 1px solid var(--color-accent);
		color: white;
	}
	.secondary {
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}
	.error {
		padding: var(--space-2) var(--space-3);
		background: color-mix(in srgb, #ef4444 10%, transparent);
		border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
		color: #ef4444;
		border-radius: var(--radius-sm);
		font-size: 13px;
	}
</style>

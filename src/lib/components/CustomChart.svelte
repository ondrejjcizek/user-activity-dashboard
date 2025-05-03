<script lang="ts">
	type Props = {
		setCanvas: (el: HTMLCanvasElement | null) => void;
	};

	const { setCanvas }: Props = $props();

	let canvasEl: HTMLCanvasElement | null = null;

	$effect(() => {
		setCanvas(canvasEl);
	});
</script>

<div class="w-full overflow-x-auto">
	<canvas bind:this={canvasEl} class="h-[300px] w-full max-w-full sm:h-[400px]" data-lenis-prevent
	></canvas>
</div>

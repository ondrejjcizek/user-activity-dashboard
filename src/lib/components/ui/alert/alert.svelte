<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const alertVariants = tv({
		base: '[&>svg]:text-blue-500 relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
		variants: {
			variant: {
				default: 'bg-white text-neutral-950 border-neutral-200',
				destructive: 'bg-red-50 text-red-600 border-red-200 [&>svg]:text-red-600',
				success: 'bg-green-50 text-green-800 border-green-200 [&>svg]:text-green-600',
				info: 'bg-[rgba(240,248,255)] text-[rgba(9,115,220)] border-[rgb(211,224,253)] [&>svg]:text-[text-[rgba(9,115,220)]]'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type AlertVariant = VariantProps<typeof alertVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WithElementRef } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div bind:this={ref} class={cn(alertVariants({ variant }), className)} {...restProps} role="alert">
	{@render children?.()}
</div>

import type { TolueBridge } from './tolueBridge';
declare global { interface Window { readonly tolue: Readonly<TolueBridge>; } }

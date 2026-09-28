import type { IncomingMessage, ServerResponse } from 'node:http';
export declare function sendJson(response: ServerResponse, status: number, value: unknown): void;
export declare function sendText(response: ServerResponse, status: number, value: string): void;
/**
 * Whether a Host header names a loopback authority.
 *
 * The Desktop proxy may remove Host before forwarding a request into the
 * in-process DSH server, so an absent header is handled by sameOrigin below.
 * When it is present, keep the DNS-rebinding guard: a public page must not be
 * able to make a matching Origin/Host pair for an arbitrary authority.
 */
export declare function loopbackAuthority(host: string | undefined): boolean;
/**
 * Accept same-origin browser requests and the official Desktop proxy's
 * header-stripped requests. A missing Origin is allowed because the proxy
 * strips it; a present but invalid/cross-site Origin remains rejected.
 */
export declare function sameOrigin(request: IncomingMessage): boolean;
export declare function readSkinId(request: IncomingMessage, limit?: number): Promise<string>;
export declare function readOperationRetryAction(request: IncomingMessage, limit?: number): Promise<'retry' | 'approve-build'>;
export type RestartTarget = {
    kind: 'skin';
    skinId: string;
} | {
    kind: 'market-update';
};
export declare function readRestartTarget(request: IncomingMessage, limit?: number): Promise<RestartTarget>;

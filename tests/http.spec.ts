import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { loopbackAuthority, readSkinId, sameOrigin } from '../src/http.ts'
import type { IncomingMessage } from 'node:http'

describe('HTTP guards', () => {
  it('accepts same-origin requests and Desktop proxy requests', () => {
    expect(sameOrigin({ headers: { origin: 'http://127.0.0.1:3080', host: '127.0.0.1:3080' } } as IncomingMessage)).toBe(true)
    expect(sameOrigin({ headers: { origin: 'https://evil.example', host: '127.0.0.1:3080' } } as IncomingMessage)).toBe(false)
    expect(sameOrigin({ headers: { host: '127.0.0.1:3080' } } as IncomingMessage)).toBe(true)
    expect(sameOrigin({ headers: {} } as IncomingMessage)).toBe(true)
    expect(sameOrigin({ headers: { host: 'evil.example' } } as IncomingMessage)).toBe(false)
    expect(sameOrigin({ headers: { origin: 'null', host: '127.0.0.1:3080' } } as IncomingMessage)).toBe(false)
    expect(sameOrigin({ headers: { origin: 'http://evil.example', host: 'evil.example' } } as IncomingMessage)).toBe(false)
  })

  it('recognizes loopback authorities without trusting public hosts', () => {
    expect(loopbackAuthority('127.0.0.1:3080')).toBe(true)
    expect(loopbackAuthority('localhost:3080')).toBe(true)
    expect(loopbackAuthority('[::1]:3080')).toBe(true)
    expect(loopbackAuthority('localhost.evil.example:3080')).toBe(false)
    expect(loopbackAuthority(undefined)).toBe(false)
  })

  it('reads a structured skin id and rejects oversized input', async () => {
    const request = Readable.from([JSON.stringify({ skinId: 'small-tailqwq.maid-atelier' })]) as IncomingMessage
    request.headers = { 'content-type': 'application/json' }
    await expect(readSkinId(request)).resolves.toBe('small-tailqwq.maid-atelier')

    const oversized = Readable.from([JSON.stringify({ skinId: 'x'.repeat(9000) })]) as IncomingMessage
    oversized.headers = { 'content-type': 'application/json' }
    await expect(readSkinId(oversized)).rejects.toThrow('too large')
  })
})

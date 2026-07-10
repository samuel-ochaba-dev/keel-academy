'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckIcon, CopyIcon, KeyIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type KeyInfo = {
  id: string
  name: string
  lastUsedAt: string | null
  createdAt: string
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<KeyInfo[]>([])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [keyName, setKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchKeys = useCallback(async () => {
    const res = await fetch('/api/account/api-keys')
    if (res.ok) {
      const data = (await res.json()) as { keys: KeyInfo[] }
      setKeys(data.keys)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/account/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim() || 'My CLI' }),
      })
      if (!res.ok) throw new Error('Failed to create API key')
      const data = (await res.json()) as { key: string }
      setNewKey(data.key)
      setKeyName('')
      setCopied(false)
      fetchKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/account/api-keys/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to revoke key')
      fetchKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRevokingId(null)
    }
  }

  function copyKey() {
    if (!newKey) return
    navigator.clipboard.writeText(newKey)
    setCopied(true)
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {newKey ? (
        <Alert variant="destructive">
          <KeyIcon className="size-4" aria-hidden />
          <AlertTitle>Copy your API key now</AlertTitle>
          <AlertDescription>
            You won&rsquo;t see this key again. Store it somewhere safe &mdash;
            you&rsquo;ll need it to authenticate the CLI.
          </AlertDescription>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm">
              {newKey}
            </code>
            <Button variant="outline" size="sm" onClick={copyKey}>
              {copied ? (
                <>
                  <CheckIcon className="size-4" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="size-4" aria-hidden />
                  Copy
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setNewKey(null)}>
              Done
            </Button>
          </div>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Create a new API key</CardTitle>
          <CardDescription>
            Give it a name so you remember which machine it belongs to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Laptop, Desktop, CI"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creating) handleCreate()
                }}
              />
            </div>
            <Button onClick={handleCreate} disabled={creating}>
              <PlusIcon className="size-4" aria-hidden />
              {creating ? 'Creating...' : 'Create key'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API keys</CardTitle>
          <CardDescription>
            Revoke a key to immediately invalidate it for CLI submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No API keys yet. Create one above to get started.
            </p>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between gap-4 rounded-md border border-border p-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {key.name}
                    </span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt
                      ? ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                      : ' · Never used'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(key.id)}
                  disabled={revokingId === key.id}
                >
                  <TrashIcon className="size-4" aria-hidden />
                  {revokingId === key.id ? 'Revoking...' : 'Revoke'}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

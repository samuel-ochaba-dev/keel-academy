'use client'

import type { AuditEventRow } from '@/lib/db/schema'
import { useState } from 'react'

interface Props {
  rows: Pick<
    AuditEventRow,
    | 'id'
    | 'createdAt'
    | 'actorUserId'
    | 'type'
    | 'subjectType'
    | 'subjectId'
    | 'metadata'
  >[]
}

function formatTimestamp(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function formatMetadata(raw: string | null): string {
  if (!raw) return '—'
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    return JSON.stringify(obj, null, 0)
  } catch {
    return raw.length > 60 ? raw.slice(0, 60) + '…' : raw
  }
}

function typeBadge(type: string): string {
  if (type.startsWith('api.error')) return 'bg-red-100 text-red-800'
  if (type.startsWith('api.')) return 'bg-yellow-100 text-yellow-800'
  if (type.startsWith('auth.')) return 'bg-blue-100 text-blue-800'
  return 'bg-muted text-muted-foreground'
}

export function AuditEventsClient({ rows }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (rows.length === 0) {
    return (
      <p className="mt-4 text-muted-foreground">
        No events in the last 7 days.
      </p>
    )
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">When</th>
            <th className="px-3 py-2 font-medium">Actor</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Subject</th>
            <th className="px-3 py-2 font-medium">Metadata</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-t transition-colors hover:bg-muted/30"
            >
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                {formatTimestamp(row.createdAt)}
              </td>
              <td className="px-3 py-2 font-mono text-xs">
                {row.actorUserId?.slice(0, 8) ?? 'system'}…
              </td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge(row.type)}`}
                >
                  {row.type}
                </span>
              </td>
              <td className="px-3 py-2 text-xs">
                {row.subjectType ? (
                  <span>
                    {row.subjectType}
                    {row.subjectId ? ` / ${row.subjectId}` : ''}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <code className="max-w-[200px] truncate block text-[11px]">
                    {formatMetadata(row.metadata)}
                  </code>
                  {row.metadata && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground text-xs"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          formatMetadata(row.metadata),
                        )
                        setCopiedId(row.id)
                        setTimeout(() => setCopiedId(null), 1500)
                      }}
                    >
                      {copiedId === row.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

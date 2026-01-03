'use client'

import { cn } from '@/lib/utils'
import { STATUS_FLOW } from '@/lib/constants'
import type { ApplicationStatus, StatusHistory } from '@/types/database'
import { Check, Clock, X } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface StatusTimelineProps {
  currentStatus: ApplicationStatus
  history: StatusHistory[]
  rejectionReason?: string
}

export function StatusTimeline({ currentStatus, history, rejectionReason }: StatusTimelineProps) {
  const isRejected = currentStatus === 'Ditolak'
  
  const getStatusIndex = (status: ApplicationStatus) => {
    return STATUS_FLOW.indexOf(status as typeof STATUS_FLOW[number])
  }

  const currentIndex = getStatusIndex(currentStatus)

  const getHistoryForStatus = (status: string) => {
    return history.find(h => h.status === status)
  }

  return (
    <div className="space-y-4">
      {STATUS_FLOW.map((status, index) => {
        const historyItem = getHistoryForStatus(status)
        const isCompleted = index < currentIndex || (index === currentIndex && currentStatus === 'Diambil')
        const isCurrent = index === currentIndex && !isRejected
        const isPending = index > currentIndex

        return (
          <div key={status} className="flex gap-4">
            {/* Icon */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2',
                  isCompleted && 'bg-green-600 border-green-600 text-white',
                  isCurrent && 'bg-blue-600 border-blue-600 text-white',
                  isPending && 'bg-white border-gray-300 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-12 mt-1',
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <h4
                className={cn(
                  'font-medium',
                  isCompleted && 'text-green-700',
                  isCurrent && 'text-blue-700',
                  isPending && 'text-gray-400'
                )}
              >
                {status}
              </h4>
              {historyItem && (
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(historyItem.changed_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                </p>
              )}
              {historyItem?.notes && (
                <p className="text-sm text-muted-foreground mt-1">
                  {historyItem.notes}
                </p>
              )}
            </div>
          </div>
        )
      })}

      {/* Rejected status */}
      {isRejected && (
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-600 border-2 border-red-600 text-white">
              <X className="h-4 w-4" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-red-700">Ditolak</h4>
            {rejectionReason && (
              <p className="text-sm text-red-600 mt-1">
                Alasan: {rejectionReason}
              </p>
            )}
            {getHistoryForStatus('Ditolak') && (
              <p className="text-sm text-muted-foreground mt-1">
                {format(
                  new Date(getHistoryForStatus('Ditolak')!.changed_at),
                  'dd MMMM yyyy, HH:mm',
                  { locale: id }
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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

// Wavy line SVG component
function WavyLine({ isCompleted }: { isCompleted: boolean }) {
  return (
    <svg 
      className="w-full h-6 mx-1" 
      viewBox="0 0 100 24" 
      preserveAspectRatio="none"
    >
      <path
        d="M0 12 Q 12.5 4, 25 12 T 50 12 T 75 12 T 100 12"
        fill="none"
        stroke={isCompleted ? '#16a34a' : '#d1d5db'}
        strokeWidth="2"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
    </svg>
  )
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

  // Short labels for mobile
  const getShortLabel = (status: string) => {
    const labels: Record<string, string> = {
      'Menunggu Verifikasi Admin': 'Pengajuan',
      'Diverifikasi Admin': 'Admin',
      'Diparaf Kasubbag Anev': 'Kasubbag',
      'Diproses Sekretaris': 'Sekretaris',
      'Ditandatangani Inspektur': 'Inspektur',
      'Selesai': 'Selesai',
    }
    return labels[status] || status
  }

  return (
    <div className="w-full">
      {/* Horizontal Timeline */}
      <div className="relative">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto pb-4">
          <div className="flex items-start min-w-max px-4">
            {STATUS_FLOW.map((status, index) => {
              const historyItem = getHistoryForStatus(status)
              const isCompleted = index < currentIndex || (index === currentIndex && currentStatus === 'Selesai')
              const isCurrent = index === currentIndex && !isRejected
              const isPending = index > currentIndex
              const isLast = index === STATUS_FLOW.length - 1

              return (
                <div key={status} className="flex items-start">
                  {/* Status Node */}
                  <div className="flex flex-col items-center" style={{ width: '120px' }}>
                    {/* Circle */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center border-3 shadow-lg transition-all duration-300',
                        isCompleted && 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white shadow-green-200',
                        isCurrent && 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-blue-200 ring-4 ring-blue-100 animate-pulse',
                        isPending && 'bg-white border-gray-200 text-gray-400 shadow-gray-100'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : isCurrent ? (
                        <Clock className="h-6 w-6" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>

                    {/* Label */}
                    <div className="mt-3 text-center">
                      <p
                        className={cn(
                          'text-xs font-semibold leading-tight',
                          isCompleted && 'text-green-700',
                          isCurrent && 'text-blue-700',
                          isPending && 'text-gray-400'
                        )}
                      >
                        {getShortLabel(status)}
                      </p>
                      {historyItem && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(historyItem.changed_at), 'dd MMM', { locale: id })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Wavy Connector */}
                  {!isLast && (
                    <div className="flex items-center h-12 w-16">
                      <WavyLine isCompleted={isCompleted} />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Rejected Node */}
            {isRejected && (
              <div className="flex items-start">
                <div className="flex items-center h-12 w-16">
                  <WavyLine isCompleted={false} />
                </div>
                <div className="flex flex-col items-center" style={{ width: '120px' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 border-3 border-red-400 text-white shadow-lg shadow-red-200">
                    <X className="h-6 w-6" />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs font-semibold text-red-700">Ditolak</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile View - Compact Horizontal */}
        <div className="md:hidden overflow-x-auto pb-4">
          <div className="flex items-center min-w-max px-2 py-4">
            {STATUS_FLOW.map((status, index) => {
              const isCompleted = index < currentIndex || (index === currentIndex && currentStatus === 'Selesai')
              const isCurrent = index === currentIndex && !isRejected
              const isPending = index > currentIndex
              const isLast = index === STATUS_FLOW.length - 1

              return (
                <div key={status} className="flex items-center">
                  {/* Status Node */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                        isCompleted && 'bg-green-600 border-green-500 text-white',
                        isCurrent && 'bg-blue-600 border-blue-500 text-white ring-2 ring-blue-200',
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
                    <p
                      className={cn(
                        'text-[9px] font-medium mt-1 w-14 text-center leading-tight',
                        isCompleted && 'text-green-700',
                        isCurrent && 'text-blue-700',
                        isPending && 'text-gray-400'
                      )}
                    >
                      {getShortLabel(status)}
                    </p>
                  </div>

                  {/* Wavy Connector */}
                  {!isLast && (
                    <div className="w-8 h-8 flex items-center">
                      <svg className="w-full h-4" viewBox="0 0 32 16" preserveAspectRatio="none">
                        <path
                          d="M0 8 Q 8 2, 16 8 T 32 8"
                          fill="none"
                          stroke={isCompleted ? '#16a34a' : '#d1d5db'}
                          strokeWidth="2"
                          strokeDasharray="3 2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Rejected Node Mobile */}
            {isRejected && (
              <div className="flex items-center">
                <div className="w-8 h-8 flex items-center">
                  <svg className="w-full h-4" viewBox="0 0 32 16" preserveAspectRatio="none">
                    <path
                      d="M0 8 Q 8 2, 16 8 T 32 8"
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-600 border-2 border-red-500 text-white">
                    <X className="h-4 w-4" />
                  </div>
                  <p className="text-[9px] font-medium mt-1 text-red-700">Ditolak</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Card - Current Status */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isRejected ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          )}>
            {isRejected ? <X className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status Saat Ini</p>
            <p className={cn(
              'font-semibold',
              isRejected ? 'text-red-700' : 'text-blue-700'
            )}>
              {currentStatus}
            </p>
          </div>
        </div>
        
        {/* Show rejection reason if rejected */}
        {isRejected && rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">
              <span className="font-medium">Alasan Penolakan:</span> {rejectionReason}
            </p>
          </div>
        )}

        {/* Show latest history */}
        {history.length > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-muted-foreground mb-2">Riwayat Terakhir</p>
            <div className="space-y-2">
              {history.slice(-3).reverse().map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-slate-600">{item.status}</span>
                  <span className="text-muted-foreground text-xs">
                    - {format(new Date(item.changed_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

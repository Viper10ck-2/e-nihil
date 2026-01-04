'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react'

interface SimpleCaptchaProps {
  onVerified: (verified: boolean) => void
  isVerified: boolean
}

export function SimpleCaptcha({ onVerified, isVerified }: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)
  const [operator, setOperator] = useState<'+' | '-' | 'x'>('+')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState(false)
  const initialized = useRef(false)

  const generateChallenge = () => {
    const ops: ('+' | '-' | 'x')[] = ['+', '-', 'x']
    const op = ops[Math.floor(Math.random() * ops.length)]
    let n1: number, n2: number

    if (op === '+') {
      n1 = Math.floor(Math.random() * 20) + 1
      n2 = Math.floor(Math.random() * 20) + 1
    } else if (op === '-') {
      n1 = Math.floor(Math.random() * 20) + 10
      n2 = Math.floor(Math.random() * n1) + 1
    } else {
      n1 = Math.floor(Math.random() * 10) + 1
      n2 = Math.floor(Math.random() * 10) + 1
    }

    setNum1(n1)
    setNum2(n2)
    setOperator(op)
    setAnswer('')
    setError(false)
    onVerified(false)
  }

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      generateChallenge()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getCorrectAnswer = (): number => {
    switch (operator) {
      case '+': return num1 + num2
      case '-': return num1 - num2
      case 'x': return num1 * num2
      default: return 0
    }
  }

  const handleVerify = () => {
    const userAnswer = parseInt(answer, 10)
    const correct = getCorrectAnswer()
    
    if (userAnswer === correct) {
      onVerified(true)
      setError(false)
    } else {
      setError(true)
      onVerified(false)
      setTimeout(() => generateChallenge(), 1000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleVerify()
    }
  }

  if (isVerified) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-700">Verifikasi Berhasil</p>
          <p className="text-xs text-emerald-600">Anda bukan robot</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={generateChallenge}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-xl border-2 transition-colors ${
      error ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className={`h-5 w-5 ${error ? 'text-red-500' : 'text-slate-500'}`} />
        <span className="text-sm font-medium text-slate-700">Verifikasi Anti-Robot</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 font-mono text-lg font-bold text-slate-800 select-none">
            {num1} {operator} {num2} = ?
          </div>
          <Input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jawaban"
            className={`w-24 text-center font-mono ${
              error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-400'
            }`}
          />
        </div>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!answer}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Verifikasi
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={generateChallenge}
          className="text-slate-500 hover:text-slate-700"
          title="Ganti soal"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {error && (
        <p className="text-xs text-red-600 mt-2">Jawaban salah. Silakan coba lagi.</p>
      )}
    </div>
  )
}

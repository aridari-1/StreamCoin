'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'stmc_wallet'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function useWallet() {
  const [wallet, setWalletState] = useState<string | null>(null)

  useEffect(() => {
    const cookie    = getCookie(STORAGE_KEY)
    const stored    = localStorage.getItem(STORAGE_KEY)
    const params    = new URLSearchParams(window.location.search)
    const urlWallet = params.get('wallet')
    const found     = cookie ?? stored ?? urlWallet ?? null
    if (found && /^0x[a-fA-F0-9]{40}$/.test(found)) {
      localStorage.setItem(STORAGE_KEY, found)
      setWalletState(found)
    }
  }, [])

  function setWallet(addr: string) {
    localStorage.setItem(STORAGE_KEY, addr)
    document.cookie = `${STORAGE_KEY}=${addr}; path=/; max-age=${60*60*24*365}; samesite=lax`
    setWalletState(addr)
  }

  function clearWallet() {
    localStorage.removeItem(STORAGE_KEY)
    document.cookie = `${STORAGE_KEY}=; path=/; max-age=0`
    setWalletState(null)
  }

  return { wallet, setWallet, clearWallet }
}
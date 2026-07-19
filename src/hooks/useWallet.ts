'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'stmc_wallet'

export function useWallet() {
  const [wallet, setWalletState] = useState<string | null>(null)

  useEffect(() => {
    // Check URL params first (set after YouTube OAuth callback)
    const params = new URLSearchParams(window.location.search)
    const urlWallet = params.get('wallet')
    if (urlWallet && /^0x[a-fA-F0-9]{40}$/.test(urlWallet)) {
      localStorage.setItem(STORAGE_KEY, urlWallet)
      setWalletState(urlWallet)
      return
    }
    // Fall back to localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    setWalletState(stored)
  }, [])

  function setWallet(addr: string) {
    localStorage.setItem(STORAGE_KEY, addr)
    setWalletState(addr)
  }

  function clearWallet() {
    localStorage.removeItem(STORAGE_KEY)
    setWalletState(null)
  }

  return { wallet, setWallet, clearWallet }
}

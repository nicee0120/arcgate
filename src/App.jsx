import { useState, useEffect } from 'react'
import { createWalletClient, custom } from 'viem'
import { AppKit } from '@circle-fin/app-kit'
import { ViemAdapter, createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'

const ARC_TESTNET = {
  id: 1313161555,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
}

const SEPOLIA = {
  id: 11155111,
  name: 'Ethereum Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.sepolia.org'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
}

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1229 50%, #0a0e1a 100%)',
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 2rem',
    borderBottom: '1px solid rgba(196, 158, 71, 0.15)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(10, 14, 26, 0.85)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    background: 'linear-gradient(135deg, #c49e47, #e8c97a)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #c49e47, #e8c97a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '0.5px',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  walletBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid rgba(196, 158, 71, 0.4)',
    fontSize: '13px',
    color: '#c49e47',
    fontFamily: 'monospace',
  },
  connectNavBtn: {
    padding: '8px 18px',
    borderRadius: '20px',
    border: 'none',
    background: 'linear-gradient(135deg, #c49e47, #e8c97a)',
    color: '#0a0e1a',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  hero: {
    textAlign: 'center',
    padding: '4rem 2rem 2rem',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #c49e47, #e8c97a, #c49e47)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '12px',
    letterSpacing: '-1px',
  },
  heroSub: {
    fontSize: '16px',
    color: 'rgba(232, 224, 204, 0.6)',
    maxWidth: '400px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  tabs: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    padding: '2rem 1rem 0',
  },
  tab: (active) => ({
    padding: '10px 28px',
    borderRadius: '24px',
    border: active ? 'none' : '1px solid rgba(196, 158, 71, 0.25)',
    background: active ? 'linear-gradient(135deg, #c49e47, #e8c97a)' : 'transparent',
    color: active ? '#0a0e1a' : 'rgba(196, 158, 71, 0.7)',
    fontSize: '14px',
    fontWeight: active ? '700' : '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  main: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem 1rem 4rem',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(196, 158, 71, 0.2)',
    borderRadius: '20px',
    padding: '2rem',
    width: '100%',
    maxWidth: '460px',
    backdropFilter: 'blur(10px)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#e8e0cc',
    marginBottom: '4px',
  },
  cardSub: {
    fontSize: '13px',
    color: 'rgba(232, 224, 204, 0.5)',
    marginBottom: '1.5rem',
  },
  label: {
    fontSize: '12px',
    color: 'rgba(196, 158, 71, 0.8)',
    marginBottom: '6px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(196, 158, 71, 0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: '#e8e0cc',
    fontSize: '14px',
    marginBottom: '1rem',
    outline: 'none',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(196, 158, 71, 0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: '#e8e0cc',
    fontSize: '14px',
    marginBottom: '1rem',
    outline: 'none',
  },
  arrow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0.5rem 0',
    color: '#c49e47',
    fontSize: '20px',
  },
  btn: (disabled) => ({
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: disabled
      ? 'rgba(196, 158, 71, 0.2)'
      : 'linear-gradient(135deg, #c49e47, #e8c97a)',
    color: disabled ? 'rgba(196, 158, 71, 0.4)' : '#0a0e1a',
    fontSize: '15px',
    fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    marginTop: '0.5rem',
  }),
  statusBox: (type) => ({
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    marginTop: '1rem',
    background: type === 'success'
      ? 'rgba(196, 158, 71, 0.1)'
      : type === 'error'
      ? 'rgba(220, 38, 38, 0.1)'
      : 'rgba(255,255,255,0.05)',
    border: `1px solid ${type === 'success' ? 'rgba(196,158,71,0.3)' : type === 'error' ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.1)'}`,
    color: type === 'success' ? '#e8c97a' : type === 'error' ? '#f87171' : 'rgba(232,224,204,0.7)',
    lineHeight: '1.5',
  }),
  faucetBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(196, 158, 71, 0.4)',
    background: 'transparent',
    color: '#c49e47',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    marginTop: '1rem',
    transition: 'all 0.2s',
  },
  divider: {
    height: '1px',
    background: 'rgba(196, 158, 71, 0.15)',
    margin: '1.5rem 0',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: 'rgba(232, 224, 204, 0.5)',
    marginBottom: '6px',
  },
  infoVal: {
    color: '#e8e0cc',
  },
}

export default function App() {
  const [tab, setTab] = useState('bridge')
  const [account, setAccount] = useState(null)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fromChain, setFromChain] = useState('Ethereum_Sepolia')
  const [toChain, setToChain] = useState('Arc_Testnet')

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus({ type: 'error', msg: 'No EVM wallet found. Install MetaMask or Rabby.' })
      return
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      setStatus({ type: 'success', msg: 'Wallet connected!' })
    } catch {
      setStatus({ type: 'error', msg: 'Connection cancelled.' })
    }
  }

  async function handleBridge() {
    if (!account || !amount) return
    setLoading(true)
    setStatus({ type: 'info', msg: 'Preparing bridge transaction...' })
    try {
      const walletClient = createWalletClient({
        account,
        transport: custom(window.ethereum),
      })
      const adapter = await createViemAdapterFromProvider(window.ethereum)
      const kit = new AppKit()
      setStatus({ type: 'info', msg: 'Confirm transaction in your wallet...' })
      const result = await kit.bridge({
        from: { adapter, chain: fromChain },
        to: { adapter, chain: toChain },
        amount: amount,
        token: 'USDC',
      })
      setStatus({ type: 'success', msg: `Bridge successful! TX: ${result?.txHash?.slice(0,16)}...` })
    } catch (e) {
      setStatus({ type: 'error', msg: e?.message || 'Bridge failed. Try again.' })
    }
    setLoading(false)
  }

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⬡</div>
          <span style={styles.logoText}>ArcGate</span>
        </div>
        <div style={styles.navRight}>
          {account ? (
            <div style={styles.walletBadge}>
              {account.slice(0,6)}...{account.slice(-4)}
            </div>
          ) : (
            <button style={styles.connectNavBtn} onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>ArcGate</h1>
        <p style={styles.heroSub}>Bridge USDC across chains and access Arc Testnet instantly.</p>
      </div>

      <div style={styles.tabs}>
        <button style={styles.tab(tab === 'bridge')} onClick={() => setTab('bridge')}>Bridge</button>
        <button style={styles.tab(tab === 'faucet')} onClick={() => setTab('faucet')}>Faucet</button>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>

          {tab === 'bridge' && (
            <>
              <div style={styles.cardTitle}>Bridge USDC</div>
              <div style={styles.cardSub}>Transfer USDC across chains via CCTP</div>

              <div style={styles.label}>From</div>
              <select
                style={styles.select}
                value={fromChain}
                onChange={e => setFromChain(e.target.value)}
              >
                <option value="Ethereum_Sepolia">Ethereum Sepolia</option>
                <option value="Arc_Testnet">Arc Testnet</option>
                <option value="Base_Sepolia">Base Sepolia</option>
                <option value="Avalanche_Fuji">Avalanche Fuji</option>
                <option value="Polygon_Amoy">Polygon Amoy</option>
              </select>

              <div style={styles.arrow}>↓</div>

              <div style={styles.label}>To</div>
              <select
                style={styles.select}
                value={toChain}
                onChange={e => setToChain(e.target.value)}
              >
                <option value="Arc_Testnet">Arc Testnet</option>
                <option value="Ethereum_Sepolia">Ethereum Sepolia</option>
                <option value="Base_Sepolia">Base Sepolia</option>
                <option value="Avalanche_Fuji">Avalanche Fuji</option>
                <option value="Polygon_Amoy">Polygon Amoy</option>
              </select>

              <div style={styles.label}>Amount (USDC)</div>
              <input
                style={styles.input}
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />

              <div style={styles.divider} />

              <div style={styles.infoRow}>
                <span>Token</span>
                <span style={styles.infoVal}>USDC</span>
              </div>
              <div style={styles.infoRow}>
                <span>Protocol</span>
                <span style={styles.infoVal}>CCTP</span>
              </div>
              <div style={styles.infoRow}>
                <span>Est. time</span>
                <span style={styles.infoVal}>~20 seconds</span>
              </div>

              <button
                style={styles.btn(!account || !amount || loading)}
                onClick={handleBridge}
                disabled={!account || !amount || loading}
              >
                {loading ? 'Bridging...' : account ? 'Bridge USDC' : 'Connect wallet first'}
              </button>

              {status && (
                <div style={styles.statusBox(status.type)}>{status.msg}</div>
              )}
            </>
          )}

          {tab === 'faucet' && (
            <>
              <div style={styles.cardTitle}>Testnet Faucet</div>
              <div style={styles.cardSub}>Get free USDC on Arc Testnet to start building</div>

              <div style={styles.divider} />

              <div style={styles.infoRow}>
                <span>Network</span>
                <span style={styles.infoVal}>Arc Testnet</span>
              </div>
              <div style={styles.infoRow}>
                <span>Token</span>
                <span style={styles.infoVal}>USDC (testnet)</span>
              </div>
              <div style={styles.infoRow}>
                <span>Provider</span>
                <span style={styles.infoVal}>Circle Faucet</span>
              </div>
              <div style={styles.infoRow}>
                <span>Explorer</span>
                <span style={styles.infoVal}>
                  <a
                    href="https://testnet.arcscan.app"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#c49e47' }}
                  >
                    testnet.arcscan.app ↗
                  </a>
                </span>
              </div>

              <div style={styles.divider} />

              <p style={{ fontSize: '13px', color: 'rgba(232,224,204,0.5)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Visit the Circle Faucet to receive free testnet USDC. Connect your wallet there and request tokens for Arc Testnet.
              </p>

              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noreferrer"
                style={styles.faucetBtn}
              >
                Open Circle Faucet ↗
              </a>

              <a
                href="https://testnet.arcscan.app"
                target="_blank"
                rel="noreferrer"
                style={{ ...styles.faucetBtn, marginTop: '8px' }}
              >
                View on ArcScan ↗
              </a>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

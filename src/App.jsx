import { useState, useEffect } from 'react'
import { createWalletClient, createPublicClient, custom, http, formatEther, parseUnits } from 'viem'
import { AppKit } from '@circle-fin/app-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'

const ARC_TESTNET = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
}

const SEPOLIA = {
  id: 11155111,
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.sepolia.org'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
}

const TOKENS = {
  arc: [
    { symbol: 'USDC', address: '0x3600000000000000000000000000000000000000', decimals: 6 },
    { symbol: 'EURC', address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', decimals: 6 },
  ],
  sepolia: [
    { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
    { symbol: 'EURC', address: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4', decimals: 6 },
  ],
}

const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
]
const styles = {
  app: { minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1229 50%, #0a0e1a 100%)', display: 'flex', flexDirection: 'column' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(196, 158, 71, 0.15)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10, 14, 26, 0.85)' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { width: '32px', height: '32px', background: 'linear-gradient(135deg, #c49e47, #e8c97a)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
  logoText: { fontSize: '20px', fontWeight: '700', background: 'linear-gradient(135deg, #c49e47, #e8c97a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' },
  navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  walletBadge: { padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(196, 158, 71, 0.4)', fontSize: '13px', color: '#c49e47', fontFamily: 'monospace' },
  connectNavBtn: { padding: '8px 18px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg, #c49e47, #e8c97a)', color: '#0a0e1a', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  hero: { textAlign: 'center', padding: '4rem 2rem 2rem' },
  heroTitle: { fontSize: '48px', fontWeight: '800', background: 'linear-gradient(135deg, #c49e47, #e8c97a, #c49e47)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '12px', letterSpacing: '-1px' },
  heroSub: { fontSize: '16px', color: 'rgba(232, 224, 204, 0.6)', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' },
  tabs: { display: 'flex', justifyContent: 'center', gap: '8px', padding: '2rem 1rem 0', flexWrap: 'wrap' },
  tab: (active) => ({ padding: '10px 22px', borderRadius: '24px', border: active ? 'none' : '1px solid rgba(196, 158, 71, 0.25)', background: active ? 'linear-gradient(135deg, #c49e47, #e8c97a)' : 'transparent', color: active ? '#0a0e1a' : 'rgba(196, 158, 71, 0.7)', fontSize: '14px', fontWeight: active ? '700' : '500', cursor: 'pointer', transition: 'all 0.2s' }),
  main: { flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem 1rem 4rem' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196, 158, 71, 0.2)', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '460px', backdropFilter: 'blur(10px)' },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: '#e8e0cc', marginBottom: '4px' },
  cardSub: { fontSize: '13px', color: 'rgba(232, 224, 204, 0.5)', marginBottom: '1.5rem' },
  label: { fontSize: '12px', color: 'rgba(196, 158, 71, 0.8)', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' },
  select: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(196, 158, 71, 0.2)', background: 'rgba(255,255,255,0.05)', color: '#e8e0cc', fontSize: '14px', marginBottom: '1rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  input: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(196, 158, 71, 0.2)', background: 'rgba(255,255,255,0.05)', color: '#e8e0cc', fontSize: '14px', marginBottom: '1rem', outline: 'none', boxSizing: 'border-box' },
  arrow: { display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0.5rem 0', color: '#c49e47', fontSize: '20px' },
  btn: (disabled) => ({ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: disabled ? 'rgba(196, 158, 71, 0.2)' : 'linear-gradient(135deg, #c49e47, #e8c97a)', color: disabled ? 'rgba(196, 158, 71, 0.4)' : '#0a0e1a', fontSize: '15px', fontWeight: '700', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '0.5rem' }),
  statusBox: (type) => ({ padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginTop: '1rem', background: type === 'success' ? 'rgba(196, 158, 71, 0.1)' : type === 'error' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${type === 'success' ? 'rgba(196,158,71,0.3)' : type === 'error' ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.1)'}`, color: type === 'success' ? '#e8c97a' : type === 'error' ? '#f87171' : 'rgba(232,224,204,0.7)', lineHeight: '1.5', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }),
  faucetBtn: { display: 'block', width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(196, 158, 71, 0.4)', background: 'transparent', color: '#c49e47', fontSize: '15px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', marginTop: '1rem', transition: 'all 0.2s' },
  divider: { height: '1px', background: 'rgba(196, 158, 71, 0.15)', margin: '1.5rem 0' },
  infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(232, 224, 204, 0.5)', marginBottom: '6px' },
  infoVal: { color: '#e8e0cc' },
  resultBox: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196, 158, 71, 0.15)', borderRadius: '12px', padding: '1rem', marginTop: '1rem' },
  resultRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '13px', marginBottom: '8px', gap: '8px' },
  resultLabel: { color: 'rgba(196, 158, 71, 0.8)', fontWeight: '600', minWidth: '80px' },
  resultVal: { color: '#e8e0cc', wordBreak: 'break-all', textAlign: 'right' },
  infoCard: { background: 'rgba(196,158,71,0.06)', border: '1px solid rgba(196,158,71,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '1rem' },
}
export default function App() {
  const [tab, setTab] = useState('bridge')
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState(null)

  const [amount, setAmount] = useState('')
  const [bridgeStatus, setBridgeStatus] = useState(null)
  const [bridgeToken, setBridgeToken] = useState('USDC')
  const [fromChain, setFromChain] = useState('Ethereum_Sepolia')
  const [toChain, setToChain] = useState('Arc_Testnet')

  const [lookupAddress, setLookupAddress] = useState('')
  const [lookupNetwork, setLookupNetwork] = useState('arc')
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupStatus, setLookupStatus] = useState(null)

  const getChainConfig = (net) => net === 'arc' ? ARC_TESTNET : SEPOLIA
  const getExplorerUrl = (net) => net === 'arc' ? 'https://testnet.arcscan.app' : 'https://sepolia.etherscan.io'

  async function fetchWalletBalance(addr, network) {
    try {
      const chain = network === "arc" ? ARC_TESTNET : SEPOLIA
      const pub = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })
      const bal = await pub.readContract({ address: "0x3600000000000000000000000000000000000000", abi: ERC20_ABI, functionName: "balanceOf", args: [addr] })
      setWalletBalance((Number(bal) / 1e6).toFixed(2) + " USDC")
    } catch { setWalletBalance(null) }
  }

  async function switchNetwork(chain) {
    const targetChainId = `0x${chain.id.toString(16)}`
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
    if (currentChainId === targetChainId) return
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetChainId }] })
    } catch (e) { }
    const finalChainId = await window.ethereum.request({ method: 'eth_chainId' })
    const net = finalChainId === '0x4cef52' ? 'arc' : 'sepolia'
    if (account) fetchWalletBalance(account, net)
    if (finalChainId !== targetChainId) {
      throw new Error(`Please switch to ${chain.name} in your wallet and try again.`)
    }
  }

  async function connectWallet() {
    if (!window.ethereum) { alert('No EVM wallet found. Install MetaMask or Rabby.'); return }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      // Fetch USDC balance
      try {
        const pub = createPublicClient({ chain: ARC_TESTNET, transport: http(ARC_TESTNET.rpcUrls.default.http[0]) })
        const bal = await pub.readContract({ address: '0x3600000000000000000000000000000000000000', abi: ERC20_ABI, functionName: 'balanceOf', args: [accounts[0]] })
        setWalletBalance((Number(bal) / 1e6).toFixed(2))
      } catch {}
    } catch { alert('Connection cancelled.') }
  }

  async function handleBridge() {
    if (!account || !amount) return
    setLoading(true)
    setBridgeStatus({ type: 'info', msg: 'Preparing bridge...' })
    try {
      const adapter = await createViemAdapterFromProvider({ provider: window.ethereum })
      const kit = new AppKit()
      setBridgeStatus({ type: 'info', msg: 'Confirm in your wallet...' })
      const result = await kit.bridge({ from: { adapter, chain: fromChain }, to: { adapter, chain: toChain }, amount, token: bridgeToken })
      const hash = result?.transactionHash || result?.txHash || ''
      setBridgeStatus({ type: 'success', msg: `Bridge successful!\nTX: ${hash.slice(0, 20)}...` })
    } catch (e) {
      setBridgeStatus({ type: 'error', msg: e?.message || 'Bridge failed.' })
    }
    setLoading(false)
  }

  async function handleLookup() {
    if (!lookupAddress.trim()) return
    setLoading(true)
    setLookupStatus({ type: 'info', msg: 'Looking up...' })
    setLookupResult(null)
    try {
      const chain = getChainConfig(lookupNetwork)
      const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })
      const addr = lookupAddress.trim()
      const tokens = TOKENS[lookupNetwork]

      const [nativeBalance, txCount, code, ...tokenBalances] = await Promise.all([
        publicClient.getBalance({ address: addr }),
        publicClient.getTransactionCount({ address: addr }),
        publicClient.getBytecode({ address: addr }),
        ...tokens.map(t => publicClient.readContract({ address: t.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [addr] }).catch(() => 0n)),
      ])

      const isContract = code && code !== '0x' && code.length > 2
      const isArc = lookupNetwork === 'arc'
      const nativeLabel = isArc ? 'USDC (native)' : 'ETH'
      const nativeFormatted = parseFloat(formatEther(nativeBalance)).toFixed(4)
      const tokenResults = tokens.map((t, i) => ({ symbol: t.symbol, balance: (Number(tokenBalances[i]) / 10 ** t.decimals).toFixed(4) }))

      let txHistory = []
      if (lookupNetwork === 'arc') {
        try {
          const res = await fetch(`https://testnet.arcscan.app/api/v2/addresses/${addr}/transactions?limit=10`)
          const data = await res.json()
          txHistory = (data.items || []).map(tx => ({
            hash: tx.hash,
            method: tx.method || tx.tx_types?.[0] || 'transfer',
            to: tx.to?.hash || '',
            toName: tx.to?.name || null,
            isContractCall: tx.to?.is_contract || false,
            value: tx.value ? (Number(tx.value) / 1e18).toFixed(4) : '0',
            status: tx.status,
            timestamp: tx.timestamp,
          }))
        } catch { }
      }

      setLookupResult({
        address: addr,
        nativeBalance: nativeFormatted,
        nativeLabel,
        tokenBalances: tokenResults,
        txCount: txCount.toString(),
        type: isContract ? 'Contract' : 'EOA (Wallet)',
        bytecodeSize: isContract ? `${((code.length - 2) / 2)} bytes` : '-',
        network: chain.name,
        explorerUrl: `${getExplorerUrl(lookupNetwork)}/address/${addr}`,
        txHistory,
      })
      setLookupStatus(null)
    } catch (e) {
      setLookupStatus({ type: 'error', msg: e?.message || 'Invalid address or network error.' })
    }
    setLoading(false)
  }

  const TAB_LABELS = { bridge: 'Bridge', lookup: 'Address Lookup', faucet: 'Faucet', about: 'What is Arc?' }
return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⬡</div>
          <span style={styles.logoText}>ArcGate</span>
        </div>
        <div style={styles.navRight}>
          <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "rgba(196,158,71,0.6)", textDecoration: "none", padding: "6px 12px", border: "1px solid rgba(196,158,71,0.2)", borderRadius: "16px" }}>ArcScan ↗</a>
          {account
            ? <div style={styles.walletBadge}>{account.slice(0, 6)}...{account.slice(-4)}{walletBalance !== null ? ' | ' + walletBalance + ' USDC' : ''}</div>
            : <button style={styles.connectNavBtn} onClick={connectWallet}>Connect Wallet</button>
          }
        </div>
      </nav>

      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>ArcGate</h1>
        <p style={styles.heroSub}>The all-in-one toolkit for Arc Testnet. Bridge USDC, explore addresses and track on-chain activity.</p>
      </div>

      <div style={styles.tabs}>
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button key={key} style={styles.tab(tab === key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div style={styles.main}>
        <div style={styles.card}>

          {tab === 'bridge' && (
            <>
              <div style={styles.cardTitle}>Bridge USDC</div>
              <div style={styles.cardSub}>Transfer USDC across chains via CCTP</div>
              <div style={styles.label}>From</div>
              <select style={styles.select} value={fromChain} onChange={e => setFromChain(e.target.value)}>
                <option value="Ethereum_Sepolia">Ethereum Sepolia</option>
                <option value="Arc_Testnet">Arc Testnet</option>
                <option value="Base_Sepolia">Base Sepolia</option>
                <option value="Avalanche_Fuji">Avalanche Fuji</option>
              </select>
              <div style={styles.arrow}><button onClick={() => { const tmp = fromChain; setFromChain(toChain); setToChain(tmp) }} style={{ background: 'none', border: '1px solid rgba(196,158,71,0.3)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: '#c49e47', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↕</button></div>
              <div style={styles.label}>To</div>
              <select style={styles.select} value={toChain} onChange={e => setToChain(e.target.value)}>
                <option value="Ethereum_Sepolia">Ethereum Sepolia</option>
                <option value="Arc_Testnet">Arc Testnet</option>
                <option value="Base_Sepolia">Base Sepolia</option>
                <option value="Avalanche_Fuji">Avalanche Fuji</option>
              </select>
              <div style={styles.label}>Amount (USDC)</div>
              <input style={styles.input} type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              <div style={styles.divider} />
              <div style={styles.infoRow}><span>Token</span><span style={styles.infoVal}>USDC</span></div>
              <div style={styles.infoRow}><span>Protocol</span><span style={styles.infoVal}>CCTP</span></div>
              <div style={styles.infoRow}><span>Estimated time</span><span style={styles.infoVal}>~20-30 seconds</span></div>
              <button style={styles.btn(!account || !amount || loading)} onClick={handleBridge} disabled={!account || !amount || loading}>
                {loading ? 'Bridging...' : account ? 'Bridge ' + bridgeToken : 'Connect wallet first'}
              </button>
              {bridgeStatus && <div style={styles.statusBox(bridgeStatus.type)}>{bridgeStatus.msg}</div>}
            </>
          )}
{tab === 'lookup' && (
            <>
              <div style={styles.cardTitle}>Address Lookup</div>
              <div style={styles.cardSub}>Look up any wallet or contract address</div>
              <div style={styles.label}>Network</div>
              <select style={styles.select} value={lookupNetwork} onChange={e => { setLookupNetwork(e.target.value); setLookupResult(null) }}>
                <option value="arc">Arc Testnet</option>
              </select>
              <div style={styles.label}>Address</div>
              <input style={styles.input} placeholder="0x..." value={lookupAddress} onChange={e => setLookupAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLookup()} />
              <button style={styles.btn(!lookupAddress.trim() || loading)} onClick={handleLookup} disabled={!lookupAddress.trim() || loading}>
                {loading ? 'Looking up...' : 'Look Up'}
              </button>
              {lookupStatus && <div style={styles.statusBox(lookupStatus.type)}>{lookupStatus.msg}</div>}
              {lookupResult && (
                <div style={styles.resultBox}>
                  <div style={styles.resultRow}><span style={styles.resultLabel}>Address</span><span style={styles.resultVal}>{lookupResult.address.slice(0,10)}...{lookupResult.address.slice(-8)}</span></div>
                  <div style={styles.resultRow}><span style={styles.resultLabel}>Type</span><span style={styles.resultVal}>{lookupResult.type}</span></div>
                  <div style={styles.resultRow}><span style={styles.resultLabel}>{lookupResult.nativeLabel}</span><span style={styles.resultVal}>{lookupResult.nativeBalance}</span></div>
                  {lookupResult.tokenBalances.map(t => (
                    <div key={t.symbol} style={styles.resultRow}><span style={styles.resultLabel}>{t.symbol}</span><span style={styles.resultVal}>{t.balance}</span></div>
                  ))}
                  <div style={styles.resultRow}><span style={styles.resultLabel}>TX Count</span><span style={styles.resultVal}>{lookupResult.txCount}</span></div>
                  {lookupResult.type === 'Contract' && (
                    <div style={styles.resultRow}><span style={styles.resultLabel}>Bytecode</span><span style={styles.resultVal}>{lookupResult.bytecodeSize}</span></div>
                  )}
                  <div style={styles.resultRow}><span style={styles.resultLabel}>Network</span><span style={styles.resultVal}>{lookupResult.network}</span></div>
                  <a href={lookupResult.explorerUrl} target="_blank" rel="noreferrer" style={{ ...styles.faucetBtn, marginTop: '12px', fontSize: '13px', padding: '10px 16px' }}>
                    View on Explorer ↗
                  </a>
                  {lookupResult.txHistory && lookupResult.txHistory.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(196,158,71,0.8)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Recent Transactions
                      </div>
                      {lookupResult.txHistory.map(tx => (
                        <a key={tx.hash} href={`https://testnet.arcscan.app/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none', marginBottom: '8px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${tx.status === 'ok' ? 'rgba(196,158,71,0.15)' : 'rgba(220,38,38,0.2)'}`, borderRadius: '10px', padding: '10px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: tx.status === 'ok' ? '#e8c97a' : '#f87171' }}>
                                {tx.status === 'ok' ? '✅' : '❌'} {tx.method || 'Transfer'}
                              </span>
                              <span style={{ fontSize: '11px', color: 'rgba(232,224,204,0.4)' }}>
                                {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(232,224,204,0.5)' }}>
                              <span>{tx.isContractCall ? '📄 Contract' : '👤 Wallet'} {tx.toName || (tx.to ? tx.to.slice(0,8) + '...' : '')}</span>
                              <span style={{ color: '#e8c97a' }}>{tx.value !== '0.0000' ? `${tx.value} USDC` : ''}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
{tab === 'faucet' && (
            <>
              <div style={styles.cardTitle}>Testnet Faucet</div>
              <div style={styles.cardSub}>Get free USDC and EURC on Arc Testnet</div>
              <div style={styles.divider} />
              <div style={styles.infoRow}><span>Network</span><span style={styles.infoVal}>Arc Testnet</span></div>
              <div style={styles.infoRow}><span>USDC</span><span style={styles.infoVal}>0x3600...0000</span></div>
              <div style={styles.infoRow}><span>EURC</span><span style={styles.infoVal}>0x89B5...D72a</span></div>
              <div style={styles.infoRow}><span>Provider</span><span style={styles.infoVal}>Circle Faucet</span></div>
              <div style={styles.infoRow}>
                <span>Explorer</span>
                <span style={styles.infoVal}><a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{ color: '#c49e47' }}>testnet.arcscan.app ↗</a></span>
              </div>
              <div style={styles.divider} />
              <p style={{ fontSize: '13px', color: 'rgba(232,224,204,0.5)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Visit the Circle Faucet to receive free testnet USDC and EURC. Select Arc Testnet and request your tokens.
              </p>
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" style={styles.faucetBtn}>Open Circle Faucet ↗</a>
              <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{ ...styles.faucetBtn, marginTop: '8px' }}>View on ArcScan ↗</a>
            </>
          )}
{tab === 'about' && (
            <>
              <div style={styles.cardTitle}>What is Arc?</div>
              <div style={styles.cardSub}>A stablecoin-native L1 blockchain built by Circle</div>
              <div style={styles.divider} />
              <p style={{ fontSize: '14px', color: 'rgba(232,224,204,0.75)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                Arc is an EVM-compatible Layer-1 blockchain purpose-built for onchain finance. It combines predictable fees, deterministic finality, and opt-in privacy to support payments, lending, and FX at scale.
              </p>
              {[
                { icon: '💵', title: 'USDC Native Gas Token', desc: 'Transaction fees are denominated in USDC — no need to hold a volatile token. Target fee is ~$0.01 per transaction.' },
                { icon: '⚡', title: 'Sub-Second Finality', desc: 'Transactions finalize in under one second with no risk of chain reorganization. Powered by Malachite BFT consensus.' },
                { icon: '🔒', title: 'Opt-in Privacy', desc: 'Confidential transfers and selective disclosure for regulated use cases, available on demand.' },
                { icon: '🔧', title: 'EVM Compatible', desc: 'Deploy existing Solidity contracts and use standard Ethereum tooling like Hardhat, Foundry, and Viem without modification.' },
                { icon: '🌍', title: 'EURC Support', desc: 'EURC is natively supported on Arc for euro-denominated transfers. Both USDC and EURC are available on the Circle Faucet.' },
              ].map(f => (
                <div key={f.title} style={{ ...styles.infoCard, marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px', marginTop: '2px' }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#e8c97a', marginBottom: '4px' }}>{f.title}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(232,224,204,0.6)', lineHeight: '1.6' }}>{f.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={styles.divider} />
              <div style={{ fontSize: '12px', color: 'rgba(196,158,71,0.8)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>Network Details</div>
              {[['Consensus','Malachite BFT'],['Execution','EVM'],['Gas Token','USDC'],['Finality','Deterministic, <1s'],['Chain ID','5042002'],['RPC','rpc.testnet.arc.network']].map(([k,v]) => (
                <div key={k} style={styles.infoRow}><span>{k}</span><span style={styles.infoVal}>{v}</span></div>
              ))}
              <div style={styles.divider} />
              <a href="https://docs.arc.network" target="_blank" rel="noreferrer" style={styles.faucetBtn}>Arc Docs ↗</a>
              <a href="https://arc.network" target="_blank" rel="noreferrer" style={{ ...styles.faucetBtn, marginTop: '8px' }}>arc.network ↗</a>
              <a href="https://arc.network/blog" target="_blank" rel="noreferrer" style={{ ...styles.faucetBtn, marginTop: "8px" }}>Arc Blog ↗</a>
            </>
          )}

        </div>
      </div>

      <div style={{ textAlign: "center", padding: "1.5rem", borderTop: "1px solid rgba(196,158,71,0.1)", fontSize: "12px", color: "rgba(232,224,204,0.3)" }}>
        Built with ♥ on Arc Testnet | v1.0.0 | by cio | <a href="https://github.com/nicee0120/arcgate" target="_blank" rel="noreferrer" style={{ color: "rgba(196,158,71,0.5)", textDecoration: "none" }}>GitHub</a>
      </div>
    </div>
  )
}

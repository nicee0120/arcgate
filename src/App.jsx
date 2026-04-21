import { useState } from 'react'
import { createWalletClient, createPublicClient, custom, http, formatEther, parseUnits } from 'viem'
import { AppKit } from '@circle-fin/app-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'

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

// Arc Testnet resmi token adresleri (docs.arc.network)
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
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
]

// Basit "Hello Arc" kontratı — constructor'da string saklayan minimal bytecode
// pragma solidity ^0.8.0;
// contract HelloArc { string public greeting = "Hello, Arc!"; }
const DEMO_BYTECODE = '0x608060405234801561001057600080fd5b506040518060400160405280600b81526020017f48656c6c6f2c2041726321000000000000000000000000000000000000000000815250600090816100559190610108565b506101d7565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806100d757607f821691505b6020821081036100ea576100e9610090565b5b50919050565b6000819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026101527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610115565b61015c8683610115565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f61019e61019961019484610174565b61017d565b610174565b9050919050565b5f819050919050565b6101b783610186565b6101cb6101c3826101a5565b8484546101a5565b825550505050565b5f90565b5f6101e26101d3565b90506101ee8184846101ae565b505050565b5b81811015610211576102065f826101d3565b6001810190506101f4565b5050565b601f8211156102565761022781610100565b61023084610103565b8101602085101561023f578190505b61025361024b85610103565b8301826101f3565b50505b505050565b5f82821c905092915050565b5f6102765f198460080261025b565b1980831691505092915050565b5f61028e8383610267565b9150826002028217905092915050565b6102a78261005b565b67ffffffffffffffff8111156102c0576102bf610065565b5b6102ca82546100bf565b6102d5828285610215565b5f60209050601f8311600181146103065f84156102f4578287015190505b6102fe8582610283565b865550610365565b601f19841661031486610100565b5f5b8281101561033b57848901518255600182019150602085019450602081019050610316565b868310156103585784890151610354601f891682610267565b8355505b6001600288020188555050505b505050505050565b603f806103835f395ff3fe6080604052600080fdfea264697066735822122'

const DEMO_ABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  { inputs: [], name: 'greeting', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
]

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1229 50%, #0a0e1a 100%)',
    display: 'flex', flexDirection: 'column',
  },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 2rem', borderBottom: '1px solid rgba(196, 158, 71, 0.15)',
    backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10, 14, 26, 0.85)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: {
    width: '32px', height: '32px',
    background: 'linear-gradient(135deg, #c49e47, #e8c97a)',
    borderRadius: '8px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '16px',
  },
  logoText: {
    fontSize: '20px', fontWeight: '700',
    background: 'linear-gradient(135deg, #c49e47, #e8c97a)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  walletBadge: {
    padding: '6px 14px', borderRadius: '20px',
    border: '1px solid rgba(196, 158, 71, 0.4)',
    fontSize: '13px', color: '#c49e47', fontFamily: 'monospace',
  },
  connectNavBtn: {
    padding: '8px 18px', borderRadius: '20px', border: 'none',
    background: 'linear-gradient(135deg, #c49e47, #e8c97a)',
    color: '#0a0e1a', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
  hero: { textAlign: 'center', padding: '4rem 2rem 2rem' },
  heroTitle: {
    fontSize: '48px', fontWeight: '800',
    background: 'linear-gradient(135deg, #c49e47, #e8c97a, #c49e47)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    marginBottom: '12px', letterSpacing: '-1px',
  },
  heroSub: {
    fontSize: '16px', color: 'rgba(232, 224, 204, 0.6)',
    maxWidth: '500px', margin: '0 auto', lineHeight: '1.6',
  },
  tabs: {
    display: 'flex', justifyContent: 'center',
    gap: '8px', padding: '2rem 1rem 0', flexWrap: 'wrap',
  },
  tab: (active) => ({
    padding: '10px 22px', borderRadius: '24px',
    border: active ? 'none' : '1px solid rgba(196, 158, 71, 0.25)',
    background: active ? 'linear-gradient(135deg, #c49e47, #e8c97a)' : 'transparent',
    color: active ? '#0a0e1a' : 'rgba(196, 158, 71, 0.7)',
    fontSize: '14px', fontWeight: active ? '700' : '500',
    cursor: 'pointer', transition: 'all 0.2s',
  }),
  main: { flex: 1, display: 'flex', justifyContent: 'center', padding: '2rem 1rem 4rem' },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(196, 158, 71, 0.2)',
    borderRadius: '20px', padding: '2rem',
    width: '100%', maxWidth: '460px', backdropFilter: 'blur(10px)',
  },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: '#e8e0cc', marginBottom: '4px' },
  cardSub: { fontSize: '13px', color: 'rgba(232, 224, 204, 0.5)', marginBottom: '1.5rem' },
  label: {
    fontSize: '12px', color: 'rgba(196, 158, 71, 0.8)',
    marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase',
  },
  select: {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1px solid rgba(196, 158, 71, 0.2)',
    background: 'rgba(255,255,255,0.05)', color: '#e8e0cc',
    fontSize: '14px', marginBottom: '1rem', outline: 'none', cursor: 'pointer',
    boxSizing: 'border-box',
  },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1px solid rgba(196, 158, 71, 0.2)',
    background: 'rgba(255,255,255,0.05)', color: '#e8e0cc',
    fontSize: '14px', marginBottom: '1rem', outline: 'none', boxSizing: 'border-box',
  },
  tokenRow: {
    display: 'flex', gap: '8px', marginBottom: '1rem',
  },
  tokenBtn: (active) => ({
    flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer',
    border: active ? '1.5px solid #c49e47' : '1px solid rgba(196, 158, 71, 0.2)',
    background: active ? 'rgba(196,158,71,0.12)' : 'rgba(255,255,255,0.03)',
    color: active ? '#e8c97a' : 'rgba(232,224,204,0.5)',
    fontSize: '14px', fontWeight: active ? '700' : '400',
    textAlign: 'center', transition: 'all 0.15s',
  }),
  arrow: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    margin: '0.25rem 0', color: '#c49e47', fontSize: '20px',
  },
  btn: (disabled) => ({
    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
    background: disabled ? 'rgba(196, 158, 71, 0.2)' : 'linear-gradient(135deg, #c49e47, #e8c97a)',
    color: disabled ? 'rgba(196, 158, 71, 0.4)' : '#0a0e1a',
    fontSize: '15px', fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '0.5rem',
  }),
  statusBox: (type) => ({
    padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginTop: '1rem',
    background: type === 'success' ? 'rgba(196, 158, 71, 0.1)' : type === 'error' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${type === 'success' ? 'rgba(196,158,71,0.3)' : type === 'error' ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.1)'}`,
    color: type === 'success' ? '#e8c97a' : type === 'error' ? '#f87171' : 'rgba(232,224,204,0.7)',
    lineHeight: '1.5', wordBreak: 'break-all', whiteSpace: 'pre-wrap',
  }),
  faucetBtn: {
    display: 'block', width: '100%', padding: '14px', borderRadius: '12px',
    border: '1px solid rgba(196, 158, 71, 0.4)', background: 'transparent',
    color: '#c49e47', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', textAlign: 'center', textDecoration: 'none',
    marginTop: '1rem', transition: 'all 0.2s',
  },
  divider: { height: '1px', background: 'rgba(196, 158, 71, 0.15)', margin: '1.5rem 0' },
  infoRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '13px', color: 'rgba(232, 224, 204, 0.5)', marginBottom: '6px',
  },
  infoVal: { color: '#e8e0cc' },
  resultBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(196, 158, 71, 0.15)',
    borderRadius: '12px', padding: '1rem', marginTop: '1rem',
  },
  resultRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    fontSize: '13px', marginBottom: '8px', gap: '8px',
  },
  resultLabel: { color: 'rgba(196, 158, 71, 0.8)', fontWeight: '600', minWidth: '80px' },
  resultVal: { color: '#e8e0cc', wordBreak: 'break-all', textAlign: 'right' },
  infoCard: {
    background: 'rgba(196,158,71,0.06)',
    border: '1px solid rgba(196,158,71,0.15)',
    borderRadius: '12px', padding: '14px', marginBottom: '1rem',
  },
}

export default function App() {
  const [tab, setTab] = useState('bridge')
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(false)

  // Bridge
  const [amount, setAmount] = useState('')
  const [bridgeStatus, setBridgeStatus] = useState(null)
  const [fromChain, setFromChain] = useState('Ethereum_Sepolia')
  const [toChain, setToChain] = useState('Arc_Testnet')

  // Swap
  const [swapFromIdx, setSwapFromIdx] = useState(0) // USDC
  const [swapToIdx, setSwapToIdx] = useState(1)     // EURC
  const [swapAmount, setSwapAmount] = useState('')
  const [swapNetwork, setSwapNetwork] = useState('arc')
  const [swapStatus, setSwapStatus] = useState(null)

  // Deploy
  const [deployNetwork, setDeployNetwork] = useState('arc')
  const [deployStatus, setDeployStatus] = useState(null)

  // Lookup
  const [lookupAddress, setLookupAddress] = useState('')
  const [lookupNetwork, setLookupNetwork] = useState('arc')
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupStatus, setLookupStatus] = useState(null)

  const getChainConfig = (net) => net === 'arc' ? ARC_TESTNET : SEPOLIA
  const getExplorerUrl = (net) => net === 'arc' ? 'https://testnet.arcscan.app' : 'https://sepolia.etherscan.io'

  async function switchNetwork(chain) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chain.id.toString(16)}` }],
      })
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chain.id.toString(16)}`,
            chainName: chain.name,
            rpcUrls: chain.rpcUrls.default.http,
            nativeCurrency: chain.nativeCurrency,
            blockExplorerUrls: [chain.blockExplorers.default.url],
          }],
        })
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) { alert('MetaMask veya Rabby yükleyin.'); return }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
    } catch { alert('Bağlantı iptal edildi.') }
  }

  // ── BRIDGE ──
  async function handleBridge() {
    if (!account || !amount) return
    setLoading(true)
    setBridgeStatus({ type: 'info', msg: 'Bridge hazırlanıyor...' })
    try {
      const adapter = await createViemAdapterFromProvider({ provider: window.ethereum })
      const kit = new AppKit()
      setBridgeStatus({ type: 'info', msg: 'Cüzdanınızda onaylayın...' })
      const result = await kit.bridge({ from: { adapter, chain: fromChain }, to: { adapter, chain: toChain }, amount, token: 'USDC' })
      const hash = result?.transactionHash || result?.txHash || ''
      setBridgeStatus({ type: 'success', msg: `✅ Bridge başarılı!\nTX: ${hash.slice(0, 20)}...` })
    } catch (e) {
      setBridgeStatus({ type: 'error', msg: e?.message || 'Bridge başarısız.' })
    }
    setLoading(false)
  }

  // ── SWAP ──
  async function handleSwap() {
    if (!account || !swapAmount) return
    setLoading(true)
    setSwapStatus({ type: 'info', msg: 'Swap hazırlanıyor...' })
    try {
      const chain = getChainConfig(swapNetwork)
      const tokens = TOKENS[swapNetwork]
      const fromToken = tokens[swapFromIdx]
      const toToken = tokens[swapToIdx]

      await switchNetwork(chain)

      const walletClient = createWalletClient({ account, chain, transport: custom(window.ethereum) })
      const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })

      const parsedAmount = parseUnits(swapAmount, fromToken.decimals)

      setSwapStatus({ type: 'info', msg: `${fromToken.symbol} → ${toToken.symbol} onayı alınıyor...` })

      // Approve tx (spender olarak toToken adresi — gerçek DEX'te router adresi olacak)
      const approveTx = await walletClient.writeContract({
        address: fromToken.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [toToken.address, parsedAmount],
      })
      await publicClient.waitForTransactionReceipt({ hash: approveTx })

      setSwapStatus({
        type: 'success',
        msg: `✅ Swap onayı tamamlandı!\n${swapAmount} ${fromToken.symbol} → ${toToken.symbol}\nTX: ${approveTx.slice(0, 20)}...\n\nNot: Gerçek swap için DEX router entegrasyonu gereklidir.`,
      })
    } catch (e) {
      setSwapStatus({ type: 'error', msg: e?.shortMessage || e?.message || 'Swap başarısız.' })
    }
    setLoading(false)
  }

  // ── DEPLOY ──
  async function handleDeploy() {
    if (!account) return
    setLoading(true)
    setDeployStatus({ type: 'info', msg: 'HelloArc kontratı deploy ediliyor...' })
    try {
      const chain = getChainConfig(deployNetwork)
      await switchNetwork(chain)

      const walletClient = createWalletClient({ account, chain, transport: custom(window.ethereum) })
      const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })

      setDeployStatus({ type: 'info', msg: 'Cüzdanınızda onaylayın...' })

      const hash = await walletClient.deployContract({
        abi: DEMO_ABI,
        bytecode: DEMO_BYTECODE,
        args: [],
      })

      setDeployStatus({ type: 'info', msg: 'TX gönderildi, receipt bekleniyor...' })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const explorerBase = getExplorerUrl(deployNetwork)

      setDeployStatus({
        type: 'success',
        msg: `✅ HelloArc kontratı deploy edildi!\n\nAdres: ${receipt.contractAddress}\nTX: ${hash.slice(0, 20)}...\n\nExplorer:\n${explorerBase}/address/${receipt.contractAddress}`,
      })
    } catch (e) {
      setDeployStatus({ type: 'error', msg: e?.shortMessage || e?.message || 'Deploy başarısız.' })
    }
    setLoading(false)
  }

  // ── LOOKUP ──
  async function handleLookup() {
    if (!lookupAddress.trim()) return
    setLoading(true)
    setLookupStatus({ type: 'info', msg: 'Sorgulanıyor...' })
    setLookupResult(null)
    try {
      const chain = getChainConfig(lookupNetwork)
      const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) })
      const addr = lookupAddress.trim()

      const [balance, txCount, code] = await Promise.all([
        publicClient.getBalance({ address: addr }),
        publicClient.getTransactionCount({ address: addr }),
        publicClient.getBytecode({ address: addr }),
      ])

      const isContract = code && code !== '0x' && code.length > 2
      setLookupResult({
        address: addr,
        balance: formatEther(balance),
        txCount: txCount.toString(),
        type: isContract ? 'Contract' : 'EOA (Wallet)',
        bytecodeSize: isContract ? `${((code.length - 2) / 2)} bytes` : '-',
        network: chain.name,
        explorerUrl: `${getExplorerUrl(lookupNetwork)}/address/${addr}`,
      })
      setLookupStatus(null)
    } catch (e) {
      setLookupStatus({ type: 'error', msg: e?.message || 'Adres sorgulanamadı.' })
    }
    setLoading(false)
  }

  const TAB_LABELS = { bridge: 'Bridge', swap: 'Swap', deploy: 'Deploy', lookup: 'Address Lookup', faucet: 'Faucet', about: 'What is Arc?' }

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⬡</div>
          <span style={styles.logoText}>ArcGate</span>
        </div>
        <div style={styles.navRight}>
          {account
            ? <div style={styles.walletBadge}>{account.slice(0, 6)}...{account.slice(-4)}</div>
            : <button style={styles.connectNavBtn} onClick={connectWallet}>Connect Wallet</button>
          }
        </div>
      </nav>

      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>ArcGate</h1>
        <p style={styles.heroSub}>Bridge, swap, deploy ve adres sorgulama — Arc Testnet için tam araç seti.</p>
      </div>

      <div style={styles.tabs}>
        {Object.entries(TAB_LABELS).map(([key, label]) => (
          <button key={key} style={styles.tab(tab === key)} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div style={styles.main}>
        <div style={styles.card}>

          {/* BRIDGE */}
          {tab === 'bridge' && (
            <>
              <div style={styles.cardTitle}>Bridge USDC</div>
              <div style={styles.cardSub}>CCTP ile zincirler arası USDC transferi</div>
              <div style={styles.label}>From</div>
              <select style={styles.select} value={fromChain} onChange={e => setFromChain(e.target.value)}>
                <option value="Ethereum_Sepolia">Ethereum Sepolia</option>
                <option value="Arc_Testnet">Arc Testnet</option>
                <option value="Base_Sepolia">Base Sepolia</option>
                <option value="Avalanche_Fuji">Avalanche Fuji</option>
              </select>
              <div style={styles.arrow}>↓</div>
              <div style={styles.label}>To</div>
              <select style={styles.select} value={toChain} onChange={e => setToChain(e.target.value)}>
                <option value="Arc_Testnet">Arc Testnet</option>
                <option value="Ethereum_Sepolia">Ethereum Sepolia</option>
                <option value="Base_Sepolia">Base Sepolia</option>
                <option value="Avalanche_Fuji">Avalanche Fuji</option>
              </select>
              <div style={styles.label}>Amount (USDC)</div>
              <input style={styles.input} type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              <div style={styles.divider} />
              <div style={styles.infoRow}><span>Token</span><span style={styles.infoVal}>USDC</span></div>
              <div style={styles.infoRow}><span>Protocol</span><span style={styles.infoVal}>CCTP</span></div>
              <div style={styles.infoRow}><span>Tahmini süre</span><span style={styles.infoVal}>~20 saniye</span></div>
              <button style={styles.btn(!account || !amount || loading)} onClick={handleBridge} disabled={!account || !amount || loading}>
                {loading ? 'Bridging...' : account ? 'Bridge USDC' : 'Önce cüzdan bağla'}
              </button>
              {bridgeStatus && <div style={styles.statusBox(bridgeStatus.type)}>{bridgeStatus.msg}</div>}
            </>
          )}

          {/* SWAP */}
          {tab === 'swap' && (() => {
            const tokens = TOKENS[swapNetwork]
            const fromToken = tokens[swapFromIdx]
            const toToken = tokens[swapToIdx]
            return (
              <>
                <div style={styles.cardTitle}>Token Swap</div>
                <div style={styles.cardSub}>USDC ↔ EURC arası swap</div>

                <div style={styles.label}>Network</div>
                <select style={styles.select} value={swapNetwork} onChange={e => { setSwapNetwork(e.target.value); setSwapFromIdx(0); setSwapToIdx(1) }}>
                  <option value="arc">Arc Testnet</option>
                  <option value="sepolia">Ethereum Sepolia</option>
                </select>

                <div style={styles.label}>From</div>
                <div style={styles.tokenRow}>
                  {tokens.map((t, i) => (
                    <button key={t.symbol} style={styles.tokenBtn(swapFromIdx === i)}
                      onClick={() => { setSwapFromIdx(i); if (swapToIdx === i) setSwapToIdx(i === 0 ? 1 : 0) }}>
                      {t.symbol}
                    </button>
                  ))}
                </div>

                <div style={styles.arrow}>⇅</div>

                <div style={styles.label}>To</div>
                <div style={styles.tokenRow}>
                  {tokens.map((t, i) => (
                    <button key={t.symbol} style={styles.tokenBtn(swapToIdx === i)}
                      onClick={() => { setSwapToIdx(i); if (swapFromIdx === i) setSwapFromIdx(i === 0 ? 1 : 0) }}>
                      {t.symbol}
                    </button>
                  ))}
                </div>

                <div style={styles.label}>Miktar ({fromToken.symbol})</div>
                <input style={styles.input} type="number" placeholder="0.00" value={swapAmount} onChange={e => setSwapAmount(e.target.value)} />

                <div style={styles.divider} />
                <div style={styles.infoRow}><span>Çift</span><span style={styles.infoVal}>{fromToken.symbol} → {toToken.symbol}</span></div>
                <div style={styles.infoRow}><span>Slippage</span><span style={styles.infoVal}>0.5%</span></div>
                <div style={styles.infoRow}><span>From adres</span><span style={styles.infoVal}>{fromToken.address.slice(0, 10)}...</span></div>

                <button style={styles.btn(!account || !swapAmount || loading)} onClick={handleSwap} disabled={!account || !swapAmount || loading}>
                  {loading ? 'İşleniyor...' : account ? `${fromToken.symbol} → ${toToken.symbol} Swap` : 'Önce cüzdan bağla'}
                </button>
                {swapStatus && <div style={styles.statusBox(swapStatus.type)}>{swapStatus.msg}</div>}
              </>
            )
          })()}

          {/* DEPLOY */}
          {tab === 'deploy' && (
            <>
              <div style={styles.cardTitle}>Contract Deploy</div>
              <div style={styles.cardSub}>Hazır HelloArc kontratını tek tıkla deploy et</div>

              <div style={styles.infoCard}>
                <div style={{ fontSize: '13px', color: 'rgba(196,158,71,0.9)', fontWeight: '600', marginBottom: '8px' }}>📄 HelloArc.sol</div>
                <div style={{ fontSize: '12px', color: 'rgba(232,224,204,0.6)', fontFamily: 'monospace', lineHeight: '1.7' }}>
                  pragma solidity ^0.8.0;<br/>
                  contract HelloArc {'{'}<br/>
                  &nbsp;&nbsp;string public greeting<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;= "Hello, Arc!";<br/>
                  {'}'}
                </div>
              </div>

              <div style={styles.label}>Network</div>
              <select style={styles.select} value={deployNetwork} onChange={e => { setDeployNetwork(e.target.value); setDeployStatus(null) }}>
                <option value="arc">Arc Testnet</option>
                <option value="sepolia">Ethereum Sepolia</option>
              </select>

              <div style={styles.divider} />
              <div style={styles.infoRow}><span>Kontrat</span><span style={styles.infoVal}>HelloArc</span></div>
              <div style={styles.infoRow}><span>Gas</span><span style={styles.infoVal}>Otomatik</span></div>
              <div style={styles.infoRow}><span>Network</span><span style={styles.infoVal}>{deployNetwork === 'arc' ? 'Arc Testnet' : 'Sepolia'}</span></div>

              <button style={styles.btn(!account || loading)} onClick={handleDeploy} disabled={!account || loading}>
                {loading ? 'Deploy ediliyor...' : account ? '🚀 Deploy Et' : 'Önce cüzdan bağla'}
              </button>
              {deployStatus && <div style={styles.statusBox(deployStatus.type)}>{deployStatus.msg}</div>}
            </>
          )}

          {/* ADDRESS LOOKUP */}
          {tab === 'lookup' && (
            <>
              <div style={styles.cardTitle}>Address Lookup</div>
              <div style={styles.cardSub}>Cüzdan veya kontrat adresini sorgula</div>
              <div style={styles.label}>Network</div>
              <select style={styles.select} value={lookupNetwork} onChange={e => { setLookupNetwork(e.target.value); setLookupResult(null) }}>
                <option value="arc">Arc Testnet</option>
                <option value="sepolia">Ethereum Sepolia</option>
              </select>
              <div style={styles.label}>Adres</div>
              <input style={styles.input} placeholder="0x..." value={lookupAddress} onChange={e => setLookupAddress(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()} />
              <button style={styles.btn(!lookupAddress.trim() || loading)} onClick={handleLookup} disabled={!lookupAddress.trim() || loading}>
                {loading ? 'Sorgulanıyor...' : 'Sorgula'}
              </button>
              {lookupStatus && <div style={styles.statusBox(lookupStatus.type)}>{lookupStatus.msg}</div>}
              {lookupResult && (
                <div style={styles.resultBox}>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Adres</span>
                    <span style={styles.resultVal}>{lookupResult.address.slice(0, 10)}...{lookupResult.address.slice(-8)}</span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Tür</span>
                    <span style={styles.resultVal}>{lookupResult.type}</span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Bakiye</span>
                    <span style={styles.resultVal}>{parseFloat(lookupResult.balance).toFixed(6)} ETH</span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>TX Sayısı</span>
                    <span style={styles.resultVal}>{lookupResult.txCount}</span>
                  </div>
                  {lookupResult.type === 'Contract' && (
                    <div style={styles.resultRow}>
                      <span style={styles.resultLabel}>Bytecode</span>
                      <span style={styles.resultVal}>{lookupResult.bytecodeSize}</span>
                    </div>
                  )}
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>Network</span>
                    <span style={styles.resultVal}>{lookupResult.network}</span>
                  </div>
                  <a href={lookupResult.explorerUrl} target="_blank" rel="noreferrer"
                    style={{ ...styles.faucetBtn, marginTop: '12px', fontSize: '13px', padding: '10px 16px' }}>
                    Explorer'da Görüntüle ↗
                  </a>
                </div>
              )}
            </>
          )}

          {/* FAUCET */}
          {tab === 'faucet' && (
            <>
              <div style={styles.cardTitle}>Testnet Faucet</div>
              <div style={styles.cardSub}>Arc Testnet için ücretsiz USDC ve EURC al</div>
              <div style={styles.divider} />
              <div style={styles.infoRow}><span>Network</span><span style={styles.infoVal}>Arc Testnet</span></div>
              <div style={styles.infoRow}><span>USDC</span><span style={styles.infoVal}>0x3600...0000</span></div>
              <div style={styles.infoRow}><span>EURC</span><span style={styles.infoVal}>0x89B5...D72a</span></div>
              <div style={styles.infoRow}><span>Provider</span><span style={styles.infoVal}>Circle Faucet</span></div>
              <div style={styles.infoRow}>
                <span>Explorer</span>
                <span style={styles.infoVal}>
                  <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{ color: '#c49e47' }}>testnet.arcscan.app ↗</a>
                </span>
              </div>
              <div style={styles.divider} />
              <p style={{ fontSize: '13px', color: 'rgba(232,224,204,0.5)', lineHeight: '1.6', marginBottom: '1rem' }}>
                Circle Faucet'ten USDC ve EURC alabilirsiniz. Arc Testnet'i seçip token isteyin.
              </p>
              <a href="https://faucet.circle.com" target="_blank" rel="noreferrer" style={styles.faucetBtn}>Circle Faucet'i Aç ↗</a>
              <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{ ...styles.faucetBtn, marginTop: '8px' }}>ArcScan'de Görüntüle ↗</a>
            </>
          )}

          {/* ABOUT */}
          {tab === 'about' && (
            <>
              <div style={styles.cardTitle}>What is Arc?</div>
              <div style={styles.cardSub}>A stablecoin-native L1 blockchain built by Circle</div>

              <div style={styles.divider} />

              <p style={{ fontSize: '14px', color: 'rgba(232,224,204,0.75)', lineHeight: '1.8', marginBottom: '1.5rem' }}>
                Arc is an EVM-compatible Layer-1 blockchain purpose-built for onchain finance.
                It combines predictable fees, deterministic finality, and opt-in privacy
                to support payments, lending, and FX at scale.
              </p>

              {/* Feature Cards */}
              {[
                {
                  icon: '💵',
                  title: 'USDC Native Gas Token',
                  desc: 'Transaction fees are denominated in USDC — no need to hold a volatile token. Target fee is ~$0.01 per transaction.',
                },
                {
                  icon: '⚡',
                  title: 'Sub-Second Finality',
                  desc: 'Transactions finalize in under one second with no risk of chain reorganization. Powered by Malachite BFT consensus.',
                },
                {
                  icon: '🔒',
                  title: 'Opt-in Privacy',
                  desc: 'Confidential transfers and selective disclosure for regulated use cases, available on demand.',
                },
                {
                  icon: '🔧',
                  title: 'EVM Compatible',
                  desc: 'Deploy existing Solidity contracts and use standard Ethereum tooling like Hardhat, Foundry, and Viem without modification.',
                },
                {
                  icon: '🌍',
                  title: 'EURC Support',
                  desc: 'EURC is natively supported on Arc for euro-denominated transfers. Both USDC and EURC are available on the Circle Faucet.',
                },
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

              {/* Network Details */}
              <div style={{ fontSize: '12px', color: 'rgba(196,158,71,0.8)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                Network Details
              </div>
              {[
                ['Consensus', 'Malachite BFT'],
                ['Execution', 'EVM'],
                ['Gas Token', 'USDC'],
                ['Finality', 'Deterministic, &lt;1s'],
                ['Chain ID', '1313161555'],
                ['RPC', 'rpc.testnet.arc.network'],
              ].map(([k, v]) => (
                <div key={k} style={styles.infoRow}>
                  <span>{k}</span>
                  <span style={styles.infoVal} dangerouslySetInnerHTML={{ __html: v }} />
                </div>
              ))}

              <div style={styles.divider} />

              <a href="https://docs.arc.network" target="_blank" rel="noreferrer" style={styles.faucetBtn}>
                Arc Docs ↗
              </a>
              <a href="https://arc.network" target="_blank" rel="noreferrer" style={{ ...styles.faucetBtn, marginTop: '8px' }}>
                arc.network ↗
              </a>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

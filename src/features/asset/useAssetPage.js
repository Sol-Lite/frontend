import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { balanceApi, useDomesticHoldings, useOverseasHoldings } from '@/api/balance'
import { useMyAccount } from '@/api/account'
import { orderApi } from '@/api/order'
import useCurrencyStore from '@/store/useCurrencyStore'

const SEED_MONEY = 100_000_000
const FALLBACK_USD_RATE = 1350
const ASSET_PAGE_SNAPSHOT_KEY = 'asset.page.snapshot.v1'

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fillAssetFlowPoints(points, range, startDate) {
  if (!Array.isArray(points) || points.length === 0 || !startDate) {
    return points
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const accountStart = new Date(startDate)
  accountStart.setHours(0, 0, 0, 0)

  let effectiveStart = accountStart
  if (range === '1W' || range === '1M') {
    const days = range === '1W' ? 7 : 30
    const windowStart = new Date(today)
    windowStart.setDate(windowStart.getDate() - (days - 1))
    effectiveStart = accountStart > windowStart ? accountStart : windowStart
  }
  const byDate = new Map(points.map((point) => [point.date, point]))
  const firstPointDate = points[0]?.date ?? null

  let carry = null
  const filled = []

  for (let cursor = new Date(effectiveStart); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const key = formatDateKey(cursor)
    const existing = byDate.get(key)
    if (existing) {
      carry = existing
      filled.push(existing)
      continue
    }
    if (firstPointDate && key < firstPointDate) {
      filled.push({
        date: key,
        totalAssets: SEED_MONEY,
        dailyReturnRate: 0,
        cumulativeReturnRate: 0,
      })
      continue
    }
    if (carry) {
      filled.push({
        ...carry,
        date: key,
        dailyReturnRate: 0,
      })
    }
  }

  return filled.length > 0 ? filled : points
}

function readAssetPageSnapshot(range) {
  try {
    const raw = localStorage.getItem(ASSET_PAGE_SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.range !== range) return null
    return parsed?.data ?? null
  } catch {
    return null
  }
}

function buildHoldingRow(h) {
  const qty = h.holdingQuantity ?? 0
  const hasCurrentPrice = h.currentPrice != null
  const cur = hasCurrentPrice ? Number(h.currentPrice) : null
  const avg = Number(h.avgBuyPrice ?? 0)
  const isKrw = h.currencyCode === 'KRW'
  const evalKrw = h.evalAmount != null ? Number(h.evalAmount) : null
  const investedLocal = Number(h.buyAmountLocal ?? (avg * qty))
  const pnl = h.unrealizedProfitLoss != null ? Number(h.unrealizedProfitLoss) : null
  const pnlRate = h.unrealizedProfitLossRate != null ? Number(h.unrealizedProfitLossRate) : null
  return {
    ...h,
    qty,
    cur,
    avg,
    investedLocal,
    evalKrw,
    pnl,
    pnlRate,
    hasCurrentPrice,
    isUp: pnl != null ? pnl >= 0 : false,
    isKrw,
  }
}

export function useAssetPage(enabled, assetFlowRange = '1W') {
  const usdRate = useCurrencyStore((s) => s.rates['USD']?.rate ?? FALLBACK_USD_RATE)
  const [cachedSnapshot, setCachedSnapshot] = useState(() => readAssetPageSnapshot(assetFlowRange))

  useEffect(() => {
    setCachedSnapshot(readAssetPageSnapshot(assetFlowRange))
  }, [assetFlowRange])

  const { data: summary, isLoading: sl } = useQuery({
    queryKey: ['balance', 'summary'],
    queryFn: balanceApi.getBalanceSummary,
    enabled,
    staleTime: 30_000,
  })

  const { data: domestic = [], isLoading: dl } = useDomesticHoldings({ enabled })
  const { data: overseas = [], isLoading: ol } = useOverseasHoldings({ enabled })

  const { data: portfolio, isLoading: pl } = useQuery({
    queryKey: ['portfolio'],
    queryFn: balanceApi.getPortfolio,
    enabled,
    staleTime: 30_000,
  })

  const { data: assetFlow, isLoading: fl } = useQuery({
    queryKey: ['balance', 'flow', assetFlowRange],
    queryFn: () => balanceApi.getAssetFlow(assetFlowRange),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const { data: accountInfo } = useMyAccount()

  const { data: filledOrders = [] } = useQuery({
    queryKey: ['orders', 'FILLED'],
    queryFn: () => orderApi.getOrders('FILLED'),
    enabled,
    staleTime: 60_000,
  })

  const derived = useMemo(() => {
    const isLoading = enabled && (sl || dl || ol || pl)
    const flowLoading = enabled && fl

    // Cash
    const cashList = summary?.cashBalances ?? []
    const krwCash = cashList.find((b) => b.currencyCode === 'KRW')
    const usdCash = cashList.find((b) => b.currencyCode === 'USD')
    const krwDeposit = Number(krwCash?.totalAmount ?? 0)
    const krwAvailable = Number(krwCash?.availableAmount ?? 0)
    const usdBal = Number(usdCash?.totalAmount ?? 0)

    // Holdings rows
    const domesticRows = domestic
      .map((h) => buildHoldingRow(h))
      .filter((h) => h.qty > 0)
      .sort((a, b) => (b.evalKrw ?? 0) - (a.evalKrw ?? 0))

    const overseasRows = overseas
      .map((h) => buildHoldingRow(h))
      .filter((h) => h.qty > 0)
      .sort((a, b) => (b.evalKrw ?? 0) - (a.evalKrw ?? 0))

    // Totals
    const domesticEval = domesticRows.reduce((s, h) => s + (h.evalKrw ?? 0), 0)
    const domesticPnl = domesticRows.reduce((s, h) => s + (h.pnl ?? 0), 0)
    const overseasEval = overseasRows.reduce((s, h) => s + (h.evalKrw ?? 0), 0)
    const overseasPnl = overseasRows.reduce((s, h) => s + (h.pnl ?? 0), 0)

    const totalStockKrw = domesticEval + overseasEval
    const totalInvestedKrw = domesticRows.reduce((s, h) => s + ((h.evalKrw ?? 0) - (h.pnl ?? 0)), 0)
      + overseasRows.reduce((s, h) => s + ((h.evalKrw ?? 0) - (h.pnl ?? 0)), 0)

    const computedTotalAssets = krwDeposit + usdBal * usdRate + totalStockKrw
    const totalAssets = Number(summary?.totalAssets ?? computedTotalAssets)

    // 헤더: 백엔드 계좌 손익 (초기금 1억 대비)
    const accountProfit = Number(summary?.accountProfitLoss ?? (totalStockKrw - totalInvestedKrw))
    const accountProfitRate = Number(summary?.accountProfitLossRate ?? 0)
    const isAccountProfit = accountProfit >= 0

    // 포트폴리오 차트: 보유 주식 매입금 대비 손익률
    const stockProfitRate = Number(summary?.totalStockUnrealizedProfitLossRate ?? 0)
    const isStockProfit = stockProfitRate >= 0

    // Simulation (AccountCard - 초기금 대비 수익률, 백엔드 값 우선)
    const startDate = accountInfo?.createdAt ? new Date(accountInfo.createdAt) : null
    const simReturn = accountProfitRate !== 0
      ? accountProfitRate
      : totalAssets > 0 ? ((totalAssets - SEED_MONEY) / SEED_MONEY) * 100 : 0
    const isSimProfit = simReturn >= 0

    const rawAssetFlowPoints = (assetFlow?.points ?? []).map((point) => ({
      date: point.date,
      totalAssets: Number(point.totalAssets ?? 0),
      dailyReturnRate: Number(point.dailyReturnRate ?? 0),
      cumulativeReturnRate: Number(point.cumulativeReturnRate ?? 0),
    }))
    const assetFlowPoints = fillAssetFlowPoints(rawAssetFlowPoints, assetFlowRange, startDate)
    const latestFlowPoint = assetFlowPoints[assetFlowPoints.length - 1] ?? null
    const latestDailyReturnRate = latestFlowPoint?.dailyReturnRate ?? 0
    const latestCumulativeReturnRate = latestFlowPoint?.cumulativeReturnRate ?? 0

    // Portfolio chart items — stocks first, cash last
    const rawItems = portfolio?.items ?? []
    const orderedItems = rawItems.filter((i) => i.type === 'STOCK')

    // label로 holdings에서 stockCode/marketType 매핑
    const allHoldings = [...domesticRows, ...overseasRows]
    const holdingByName = Object.fromEntries(allHoldings.map((h) => [h.stockName, h]))

    const portfolioItems = orderedItems.map((item) => {
      const holding = holdingByName[item.label]
      return {
        label: item.label,
        weight: Number(item.weight ?? 0),
        type: item.type,
        stockCode: holding?.stockCode ?? null,
        marketType: holding?.marketType ?? null,
      }
    })

    // Cash를 제외한 주식 비중만으로 다시 100% 정규화
    const stockWeightSum = portfolioItems.reduce((s, i) => s + i.weight, 0)
    if (stockWeightSum > 0 && portfolioItems.length > 0) {
      const normalized = portfolioItems.map((item) => ({
        ...item,
        weight: Math.round((item.weight / stockWeightSum) * 100),
      }))
      const normalizedSum = normalized.reduce((s, i) => s + i.weight, 0)
      normalized[normalized.length - 1].weight += 100 - normalizedSum
      portfolioItems.splice(0, portfolioItems.length, ...normalized)
    }

    return {
      isLoading,
      flowLoading,
      // Summary
      totalAssets,
      accountProfit,
      accountProfitRate,
      isAccountProfit,
      stockProfitRate,
      isStockProfit,
      krwDeposit,
      krwAvailable,
      usdBal,
      // Asset breakdown
      domesticEval,
      domesticPnl,
      overseasEval,
      overseasPnl,
      // Holdings tables
      domesticRows,
      overseasRows,
      // Portfolio chart
      portfolioItems,
      // Simulation
      startDate,
      simReturn,
      isSimProfit,
      assetFlowPoints,
      latestDailyReturnRate,
      latestCumulativeReturnRate,
      tradeCount: filledOrders.length,
    }
  }, [summary, domestic, overseas, portfolio, assetFlow, accountInfo, filledOrders, usdRate, sl, dl, ol, pl, fl, enabled, assetFlowRange])

  useEffect(() => {
    if (!enabled || derived.isLoading) {
      return
    }
    try {
      localStorage.setItem(
        ASSET_PAGE_SNAPSHOT_KEY,
        JSON.stringify({
          range: assetFlowRange,
          data: derived,
          savedAt: Date.now(),
        }),
      )
      setCachedSnapshot(derived)
    } catch {
      // ignore storage failures
    }
  }, [enabled, assetFlowRange, derived])

  return useMemo(() => {
    if (enabled && cachedSnapshot && derived.isLoading) {
      return {
        ...cachedSnapshot,
        flowLoading: derived.flowLoading,
        isRefreshing: true,
      }
    }
    return {
      ...derived,
      isRefreshing: false,
    }
  }, [cachedSnapshot, derived, enabled])
}

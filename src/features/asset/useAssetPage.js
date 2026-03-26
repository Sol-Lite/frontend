import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { balanceApi, useDomesticHoldings, useOverseasHoldings } from '@/api/balance'
import { useMyAccount } from '@/api/account'
import { orderApi } from '@/api/order'
import useCurrencyStore from '@/store/useCurrencyStore'

const SEED_MONEY = 100_000_000
const FALLBACK_USD_RATE = 1350

function buildHoldingRow(h, usdRate) {
  const qty = h.holdingQuantity ?? 0
  const cur = Number(h.currentPrice ?? h.avgBuyPrice ?? 0)
  const avg = Number(h.avgBuyPrice ?? 0)
  const isKrw = h.currencyCode === 'KRW'
  const rate = Number(h.avgBuyExchangeRate ?? usdRate)
  const evalKrw = isKrw ? cur * qty : cur * qty * usdRate
  const investedKrw = isKrw ? avg * qty : avg * qty * rate
  const pnl = evalKrw - investedKrw
  const pnlRate = investedKrw > 0 ? (pnl / investedKrw) * 100 : 0
  return { ...h, qty, cur, avg, evalKrw, pnl, pnlRate, isUp: pnl >= 0, isKrw }
}

export function useAssetPage(enabled) {
  const usdRate = useCurrencyStore((s) => s.rates['USD']?.rate ?? FALLBACK_USD_RATE)

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

  const { data: accountInfo } = useMyAccount()

  const { data: filledOrders = [] } = useQuery({
    queryKey: ['orders', 'FILLED'],
    queryFn: () => orderApi.getOrders('FILLED'),
    enabled,
    staleTime: 60_000,
  })

  return useMemo(() => {
    const isLoading = enabled && (sl || dl || ol || pl)

    // Cash
    const cashList = summary?.cashBalances ?? []
    const krwCash = cashList.find((b) => b.currencyCode === 'KRW')
    const usdCash = cashList.find((b) => b.currencyCode === 'USD')
    const krwDeposit = Number(krwCash?.totalAmount ?? 0)
    const krwAvailable = Number(krwCash?.availableAmount ?? 0)
    const usdBal = Number(usdCash?.totalAmount ?? 0)

    // Holdings rows
    const domesticRows = domestic
      .map((h) => buildHoldingRow(h, usdRate))
      .filter((h) => h.qty > 0)
      .sort((a, b) => b.evalKrw - a.evalKrw)

    const overseasRows = overseas
      .map((h) => buildHoldingRow(h, usdRate))
      .filter((h) => h.qty > 0)
      .sort((a, b) => b.evalKrw - a.evalKrw)

    // Totals
    const domesticEval = domesticRows.reduce((s, h) => s + h.evalKrw, 0)
    const domesticPnl = domesticRows.reduce((s, h) => s + h.pnl, 0)
    const overseasEval = overseasRows.reduce((s, h) => s + h.evalKrw, 0)
    const overseasPnl = overseasRows.reduce((s, h) => s + h.pnl, 0)

    const totalStockKrw = domesticEval + overseasEval
    const totalInvestedKrw = domesticRows.reduce((s, h) => s + h.evalKrw - h.pnl, 0)
      + overseasRows.reduce((s, h) => s + h.evalKrw - h.pnl, 0)

    const totalAssets = krwDeposit + usdBal * usdRate + totalStockKrw

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
        weight: Math.round(Number(item.weight ?? 0)),
        type: item.type,
        stockCode: holding?.stockCode ?? null,
        marketType: holding?.marketType ?? null,
      }
    })

    // Normalize weights
    const weightSum = portfolioItems.reduce((s, i) => s + i.weight, 0)
    if (weightSum > 0 && weightSum !== 100 && portfolioItems.length > 0) {
      portfolioItems[portfolioItems.length - 1].weight += 100 - weightSum
    }

    return {
      isLoading,
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
      tradeCount: filledOrders.length,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, domestic, overseas, portfolio, accountInfo, filledOrders, usdRate, sl, dl, ol, pl, enabled])
}

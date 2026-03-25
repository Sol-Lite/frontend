import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import InvestOrderBookPanel from '@/components/invest/InvestOrderBookPanel'
import InvestOrderPanel from '@/components/invest/InvestOrderPanel'
import { useBuyableAmount, useDomesticHoldings } from '@/api/balance'
import { orderApi, ORDER_SIDE, ORDER_KIND } from '@/api/order'
import usePinAuth from '@/hooks/usePinAuth'
import useAuthStore from '@/store/useAuthStore'

export default function InvestOrderSection({
  stockCode,
  marketType,
  stockName,
  currentPrice,
  changeRate,
  defaultPrice,
  orderBook,
}) {
  const queryClient = useQueryClient()
  const { isPinCached, verifyAndCachePin } = usePinAuth()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [side, setSide] = useState('buy')
  const [orderType, setOrderType] = useState('market')
  const [quantity, setQuantity] = useState(1)
  const [selectedPrice, setSelectedPrice] = useState(defaultPrice)
  const [confirmedUnitPrice, setConfirmedUnitPrice] = useState(null)

  const [step, setStep] = useState('input') // 'input' | 'confirm'
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const marketPrice = currentPrice ?? defaultPrice
  const liveUnitPrice = orderType === 'limit' ? selectedPrice : marketPrice
  const unitPrice = step === 'confirm' && confirmedUnitPrice != null
    ? confirmedUnitPrice
    : liveUnitPrice

  const { data: buyableData } = useBuyableAmount({
    stockCode,
    marketType,
    orderPrice: orderType === 'limit' ? selectedPrice : undefined,
    enabled: isAuthenticated && side === 'buy',
  })
  const { data: holdingsData } = useDomesticHoldings({ enabled: isAuthenticated && side === 'sell' })

  const availableAmount = buyableData?.availableAmount ?? 0
  const maxBuyableQuantity = buyableData?.maxBuyableQuantity ?? Math.floor(availableAmount / Math.max(unitPrice, 1))

  const holdingRaw = holdingsData?.find?.((h) => h.stockCode === stockCode)
  const availableSellQuantity = holdingRaw?.availableQuantity ?? holdingRaw?.holdingQuantity ?? 0

  const maxOrderQuantity = side === 'buy'
    ? Math.max(1, maxBuyableQuantity)
    : Math.max(1, availableSellQuantity)

  function getMaxOrderQuantity(nextSide = side, nextOrderType = orderType, nextSelectedPrice = selectedPrice) {
    if (nextSide === 'sell') return Math.max(1, availableSellQuantity)
    if (nextOrderType === 'limit') return Math.max(1, Math.floor(availableAmount / Math.max(nextSelectedPrice, 1)))
    return Math.max(1, maxBuyableQuantity)
  }

  function clampQuantity(nextValue, nextSide = side, nextOrderType = orderType, nextSelectedPrice = selectedPrice) {
    return Math.min(getMaxOrderQuantity(nextSide, nextOrderType, nextSelectedPrice), Math.max(1, nextValue))
  }

  function handleQuantityDelta(delta) {
    setQuantity((prev) => clampQuantity(prev + delta))
  }

  function handleQuantityChange(value) {
    setQuantity(clampQuantity(value))
  }

  function handleQuantityPreset(ratio) {
    const nextMax = getMaxOrderQuantity()
    setQuantity(clampQuantity(ratio === 1 ? nextMax : Math.max(1, Math.floor(nextMax * ratio))))
  }

  function handleSideChange(nextSide) {
    setConfirmedUnitPrice(null)
    setSide(nextSide)
    setQuantity((prev) => Math.min(prev, getMaxOrderQuantity(nextSide)))
  }

  function handleOrderTypeChange(nextOrderType) {
    setConfirmedUnitPrice(null)
    setOrderType(nextOrderType)
    setQuantity((prev) => Math.min(prev, getMaxOrderQuantity(side, nextOrderType)))
  }

  function handleSelectPrice(price) {
    setConfirmedUnitPrice(null)
    setSelectedPrice(price)
    setOrderType('limit')
    setQuantity((prev) => Math.min(prev, getMaxOrderQuantity(side, 'limit', price)))
  }

  async function placeOrder() {
    setIsSubmitting(true)
    try {
      await orderApi.placeOrder({
        stockCode,
        marketType,
        orderSide: ORDER_SIDE[side],
        orderKind: ORDER_KIND[orderType],
        orderChannel: 'ORDER_FORM',
        orderPrice: orderType === 'limit' ? selectedPrice : undefined,
        orderQuantity: quantity,
      })
      setStep('input')
      setShowPin(false)
      setPin('')
      setPinError('')
      setConfirmedUnitPrice(null)
      setQuantity(1)
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 매수 확정 클릭
  function handleConfirm() {
    if (isPinCached()) {
      placeOrder()
    } else {
      setShowPin(true)
      setPin('')
      setPinError('')
    }
  }

  // PIN 입력완료
  async function handlePinDone() {
    if (pin.length !== 4) {
      setPinError('4자리를 입력해주세요.')
      return
    }
    setIsSubmitting(true)
    setPinError('')
    try {
      await verifyAndCachePin(pin)
      await placeOrder()
    } catch (err) {
      setPinError(err?.message ?? '비밀번호가 올바르지 않습니다.')
      setPin('')
    } finally {
      setIsSubmitting(false)
    }
  }

  // PIN 취소
  function handlePinClose() {
    setShowPin(false)
    setPin('')
    setPinError('')
  }

  // 뒤로 (confirm → input)
  function handleBack() {
    setConfirmedUnitPrice(null)
    setStep('input')
    setShowPin(false)
    setPin('')
    setPinError('')
  }

  return (
    <>
      <InvestOrderBookPanel
        selectedPrice={selectedPrice}
        currentPrice={currentPrice}
        changeRate={changeRate}
        orderBook={orderBook}
        onSelectPrice={handleSelectPrice}
      />

      <InvestOrderPanel
        step={step}
        showPin={showPin}
        pin={pin}
        pinError={pinError}
        stockName={stockName}
        availableAmount={availableAmount}
        holdingQuantity={availableSellQuantity}
        side={side}
        orderType={orderType}
        quantity={quantity}
        maxOrderQuantity={maxOrderQuantity}
        unitPrice={unitPrice}
        selectedPrice={selectedPrice}
        onSideChange={handleSideChange}
        onOrderTypeChange={handleOrderTypeChange}
        onSelectPrice={handleSelectPrice}
        onQuantityDelta={handleQuantityDelta}
        onQuantityChange={handleQuantityChange}
        onPresetApply={handleQuantityPreset}
        onSubmit={() => {
          setConfirmedUnitPrice(liveUnitPrice)
          setStep('confirm')
        }}
        onConfirm={handleConfirm}
        onBack={handleBack}
        onPinChange={setPin}
        onPinDone={handlePinDone}
        onPinClose={handlePinClose}
        isSubmitting={isSubmitting}
      />
    </>
  )
}

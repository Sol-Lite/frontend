import { useState } from 'react'
import InvestOrderBookPanel from '@/components/invest/InvestOrderBookPanel'
import InvestOrderPanel from '@/components/invest/InvestOrderPanel'

export default function InvestOrderSection({
  stockName,
  availableAmount,
  currentPrice,
  changeRate,
  defaultPrice,
}) {
  const [side, setSide] = useState('buy')
  const [orderType, setOrderType] = useState('market')
  const [condition, setCondition] = useState('normal')
  const [quantity, setQuantity] = useState(100)
  const [selectedPrice, setSelectedPrice] = useState(defaultPrice)

  const holdingQuantity = 100
  const marketPrice = currentPrice ?? defaultPrice
  const unitPrice = orderType === 'limit' ? selectedPrice : marketPrice
  const maxOrderQuantity = side === 'buy'
    ? Math.max(1, Math.floor(availableAmount / Math.max(unitPrice, 1)))
    : holdingQuantity

  function getMaxOrderQuantity(nextSide = side, nextOrderType = orderType, nextSelectedPrice = selectedPrice) {
    const nextUnitPrice = nextOrderType === 'limit' ? nextSelectedPrice : marketPrice

    return nextSide === 'buy'
      ? Math.max(1, Math.floor(availableAmount / Math.max(nextUnitPrice, 1)))
      : holdingQuantity
  }

  function clampQuantity(nextValue, nextSide = side, nextOrderType = orderType, nextSelectedPrice = selectedPrice) {
    return Math.min(
      getMaxOrderQuantity(nextSide, nextOrderType, nextSelectedPrice),
      Math.max(1, nextValue),
    )
  }

  function handleQuantityDelta(delta) {
    setQuantity((prev) => clampQuantity(prev + delta))
  }

  function handleQuantityPreset(ratio) {
    const nextMaxOrderQuantity = getMaxOrderQuantity()
    const nextValue = ratio === 1
      ? nextMaxOrderQuantity
      : Math.max(1, Math.floor(nextMaxOrderQuantity * ratio))

    setQuantity(clampQuantity(nextValue))
  }

  function handleSideChange(nextSide) {
    const nextMaxOrderQuantity = getMaxOrderQuantity(nextSide)
    setSide(nextSide)
    setQuantity((prev) => Math.min(prev, nextMaxOrderQuantity))
  }

  function handleOrderTypeChange(nextOrderType) {
    const nextMaxOrderQuantity = getMaxOrderQuantity(side, nextOrderType)
    setOrderType(nextOrderType)
    setQuantity((prev) => Math.min(prev, nextMaxOrderQuantity))
  }

  function handleSelectPrice(price) {
    const nextMaxOrderQuantity = getMaxOrderQuantity(side, 'limit', price)
    setSelectedPrice(price)
    setOrderType('limit')
    setQuantity((prev) => Math.min(prev, nextMaxOrderQuantity))
  }

  return (
    <>
      <InvestOrderBookPanel
        selectedPrice={selectedPrice}
        currentPrice={currentPrice}
        changeRate={changeRate}
        onSelectPrice={handleSelectPrice}
      />

      <InvestOrderPanel
        stockName={stockName}
        availableAmount={availableAmount}
        side={side}
        orderType={orderType}
        condition={condition}
        quantity={quantity}
        maxOrderQuantity={maxOrderQuantity}
        unitPrice={unitPrice}
        selectedPrice={selectedPrice}
        onSideChange={handleSideChange}
        onOrderTypeChange={handleOrderTypeChange}
        onConditionChange={setCondition}
        onQuantityDelta={handleQuantityDelta}
        onPresetApply={handleQuantityPreset}
      />
    </>
  )
}

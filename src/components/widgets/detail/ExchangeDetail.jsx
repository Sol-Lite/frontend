import IndexDetail from './IndexDetail'

export default function ExchangeDetail({ config = {}, onClose }) {
  return <IndexDetail config={{ currency: 'USD', ...config }} onClose={onClose} />
}

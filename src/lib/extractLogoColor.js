/**
 * PNG 이미지에서 대표 색상을 추출합니다 (Canvas API 사용)
 * 흰색·검정·투명 픽셀은 제외하고 가장 많이 등장하는 색을 반환합니다.
 */
export async function extractDominantColor(url, fallback = '#0046FF') {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 32 // 빠른 처리를 위해 32x32로 리샘플
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        const buckets = {}
        for (let i = 0; i < data.length; i += 4) {
          const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
          if (a < 100) continue                        // 투명
          if (r > 235 && g > 235 && b > 235) continue // 흰색 계열
          if (r < 20 && g < 20 && b < 20) continue    // 검정 계열
          // 16단위로 버킷팅
          const key = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`
          buckets[key] = (buckets[key] || 0) + 1
        }

        const top = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0]
        if (!top) return resolve(fallback)

        const [r, g, b] = top[0].split(',').map(Number)
        const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
        resolve(hex)
      } catch {
        resolve(fallback)
      }
    }
    img.onerror = () => resolve(fallback)
    img.src = url
  })
}

import React from 'react'

// Small deterministic hash function to generate color from text
function hashHue(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 360
  }
  return h
}

export default function SongCard({ song }) {
  const isSvgData = song.cover?.startsWith('data:image/svg+xml')

  const audioUrl =
    song.audioUrl?.startsWith('http') || song.audioUrl?.startsWith('data:')
      ? song.audioUrl
      : song.audioUrl
      ? `https://music-task-6sbr.onrender.com${song.audioUrl.startsWith('/') ? '' : '/'}${song.audioUrl}`
      : null

  // Generate unique SVG gradient per song if it's a data URI
  const uniqueSvg = (() => {
    if (!isSvgData) return null
    const hue = hashHue(song.title + song.artist)
    const nextHue = (hue + 60) % 360
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
        <defs>
          <linearGradient id='g${hue}' x1='0' x2='1' y1='0' y2='1'>
            <stop offset='0' stop-color='hsl(${hue}, 70%, 60%)'/>
            <stop offset='1' stop-color='hsl(${nextHue}, 70%, 45%)'/>
          </linearGradient>
        </defs>
        <rect width='100%' height='100%' fill='url(#g${hue})'/>
        <text x='50%' y='60%' font-family='Arial' font-size='20' fill='white' text-anchor='middle'>
          ${song.title}
        </text>
        <text x='50%' y='80%' font-family='Arial' font-size='14' fill='white' text-anchor='middle'>
          ${song.artist}
        </text>
      </svg>
    `
    return svg
  })()

  return (
    <div className="bg-white rounded-lg shadow p-3">
      {isSvgData ? (
        <div
          className="w-full h-40 rounded overflow-hidden"
          dangerouslySetInnerHTML={{
            __html: uniqueSvg,
          }}
        />
      ) : (
        <img
          src={song.cover}
          alt={song.title}
          className="w-full h-40 object-cover rounded"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'
          }}
        />
      )}

      <div className="mt-3">
        <h3 className="font-semibold">{song.title}</h3>
        <p className="text-sm text-gray-600">{song.artist}</p>
        <p className="text-sm text-gray-500">
          {song.album} • {song.genre}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm">Likes: {song.likes ?? '-'}</div>
          {audioUrl && <audio controls src={audioUrl} className="w-28" />}
        </div>
      </div>
    </div>
  )
}

import React from 'react'

export default function SongCard({ song }) {
  const isSvgData = song.cover?.startsWith('data:image/svg+xml')

  const audioUrl =
    song.audioUrl?.startsWith('http') || song.audioUrl?.startsWith('data:')
      ? song.audioUrl
      : song.audioUrl
      ? `https://music-task-6sbr.onrender.com${song.audioUrl.startsWith('/') ? '' : '/'}${song.audioUrl}`
      : null

  return (
    <div className="bg-white rounded-lg shadow p-3">
      {isSvgData ? (
        <div
          className="w-full h-40 rounded"
          dangerouslySetInnerHTML={{
            __html: decodeURIComponent(song.cover.split(',')[1]),
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

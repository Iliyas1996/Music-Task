import React from 'react'

const API_BASE = 'https://music-task-6sbr.onrender.com'

export default function SongCard({ song }) {
  const coverUrl = song.cover?.startsWith('http')
    ? song.cover
    : `${API_BASE}${song.cover}`

  const audioUrl = song.audioUrl?.startsWith('http')
    ? song.audioUrl
    : `${API_BASE}${song.audioUrl}`

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <img
        src={coverUrl}
        alt={song.title}
        className="w-full h-40 object-cover rounded"
      />
      <div className="mt-3">
        <h3 className="font-semibold">{song.title}</h3>
        <p className="text-sm text-gray-600">{song.artist}</p>
        <p className="text-sm text-gray-500">
          {song.album} • {song.genre}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm">Likes: {song.likes ?? '-'}</div>
          <audio controls src={audioUrl} className="w-28" />
        </div>
      </div>
    </div>
  )
}

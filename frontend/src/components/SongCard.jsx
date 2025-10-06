import React from 'react'

export default function SongCard({ song }) {
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <img src={song.cover} alt={song.title} className="w-full h-40 object-cover rounded" />
      <div className="mt-3">
        <h3 className="font-semibold">{song.title}</h3>
        <p className="text-sm text-gray-600">{song.artist}</p>
        <p className="text-sm text-gray-500">{song.album} • {song.genre}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm">Likes: {song.likes ?? '-'}</div>
          <audio controls src={song.audioUrl} className="w-24" />
        </div>
      </div>
    </div>
  )
}

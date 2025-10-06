import React from 'react'

export default function Header({ locale, seed, likesAvg, view, onSeedChange, onLocaleChange, onLikesChange, onViewChange }) {
  const locales = ['en_US','uk_UA']
  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto p-4 flex flex-wrap gap-3 items-center">
        <select value={locale} onChange={e => onLocaleChange(e.target.value)} className="border px-2 py-1 rounded">
          {locales.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <input value={seed} onChange={e => onSeedChange(e.target.value)} className="border px-2 py-1 rounded w-48" />

        <button onClick={() => onSeedChange(Math.floor(Math.random()*1e9).toString(16))} className="px-3 py-1 bg-blue-600 text-white rounded">Random Seed</button>

        <label className="flex items-center gap-2">
          <input type="range" min="0" max="10" step="0.1" value={likesAvg} onChange={e => onLikesChange(Number(e.target.value))} />
          <span className="ml-2 w-12">{likesAvg}</span>
        </label>

        <select value={view} onChange={e => onViewChange(e.target.value)} className="border px-2 py-1 rounded">
          <option value="gallery">Gallery</option>
          <option value="table">Table</option>
        </select>
      </div>
    </header>
  )
}

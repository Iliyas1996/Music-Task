import React, { useEffect, useState, useRef } from 'react'
import Header from './components/Header'
import SongCard from './components/SongCard'
import { motion } from 'framer-motion'

const API_BASE = 'https://music-task-6sbr.onrender.com'

export default function App() {
  const [locale, setLocale] = useState('en_US')
  const [seed, setSeed] = useState('seed-0000')
  const [likesAvg, setLikesAvg] = useState(1.0)
  const [view, setView] = useState('gallery')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const galleryBatch = useRef(1)

  useEffect(() => { fetchPage(1) }, [locale, seed])

  useEffect(() => { updateLikesOnly() }, [likesAvg])

  async function fetchPage(p) {
    setLoading(true)
    const resp = await fetch(`${API_BASE}/api/songs?locale=${encodeURIComponent(locale)}&seed=${encodeURIComponent(seed)}&page=${p}&pageSize=${pageSize}`)
    const data = await resp.json()
    if (view === 'gallery' && p > 1) {
      setSongs(prev => [...prev, ...data.songs])
    } else {
      setSongs(data.songs)
    }
    setLoading(false)
  }

  function updateLikesOnly() {
    const avg = Number(likesAvg)
    const floor = Math.floor(avg)
    const frac = avg - floor
    const seededHash = (key) => {
      let h = 2166136261 >>> 0
      for (let i=0;i<key.length;i++){ h ^= key.charCodeAt(i); h = Math.imul(h,16777619) }
      return (h >>> 0) / 2**32
    }
    setSongs(prev => prev.map(s => {
      const r = seededHash(`${seed}::likes::${s.index}`)
      return { ...s, likes: floor + (r < frac ? 1 : 0) }
    }))
  }

  function onSeedChange(v) { setSeed(v); setPage(1); galleryBatch.current = 1; fetchPage(1) }
  function onLocaleChange(v) { setLocale(v); setPage(1); galleryBatch.current = 1; fetchPage(1) }
  function onLikesChange(v) { setLikesAvg(v) }
  function onViewChange(v) { setView(v); setPage(1); galleryBatch.current = 1; fetchPage(1) }

  useEffect(() => {
    if (view !== 'gallery') return
    const onScroll = () => {
      if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 400) && !loading) {
        galleryBatch.current += 1
        fetchPage(galleryBatch.current)
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [view, loading])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        locale={locale}
        seed={seed}
        likesAvg={likesAvg}
        view={view}
        onSeedChange={onSeedChange}
        onLocaleChange={onLocaleChange}
        onLikesChange={onLikesChange}
        onViewChange={onViewChange}
      />

      <main className="max-w-6xl mx-auto p-6">
        {view === 'table' ? (
          <table className="w-full table-auto bg-white shadow-md rounded-md overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Artist</th>
                <th className="p-3 text-left">Album</th>
                <th className="p-3 text-left">Genre</th>
                <th className="p-3 text-left">Likes</th>
              </tr>
            </thead>
            <tbody>
              {songs.map(s => (
                <tr key={s.index} className="border-t">
                  <td className="p-3">{s.index}</td>
                  <td className="p-3">{s.title}</td>
                  <td className="p-3">{s.artist}</td>
                  <td className="p-3">{s.album}</td>
                  <td className="p-3">{s.genre}</td>
                  <td className="p-3">{s.likes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {songs.map(s => (
              <motion.div key={s.index} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} whileHover={{ scale:1.02 }}>
                <SongCard song={s} />
              </motion.div>
            ))}
          </div>
        )}

        {loading && <p className="mt-6 text-center text-gray-500">Loading...</p>}

      </main>
    </div>
  )
}

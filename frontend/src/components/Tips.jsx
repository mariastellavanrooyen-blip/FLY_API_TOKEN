import React, { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { TIPS, TIP_CATEGORIES } from '../lib/tipsData.js'

export default function Tips() {
  const { state, dispatch } = useStore()
  const [category, setCategory] = useState('all')
  const [onlyFav, setOnlyFav] = useState(false)

  const list = useMemo(() => {
    let items = TIPS
    if (category !== 'all') items = items.filter((t) => t.category === category)
    if (onlyFav) items = items.filter((t) => state.favoriteTips.includes(t.id))
    return items
  }, [category, onlyFav, state.favoriteTips])

  return (
    <div>
      <div className="card pill-select">
        <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>
          All
        </button>
        {TIP_CATEGORIES.map((c) => (
          <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
        <button className={onlyFav ? 'active' : ''} onClick={() => setOnlyFav((s) => !s)}>
          ⭐ Favorites
        </button>
      </div>

      <div className="grid cols-2">
        {list.map((tip) => {
          const fav = state.favoriteTips.includes(tip.id)
          return (
            <div className="tip-card" key={tip.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <span style={{ fontSize: '1.6rem' }}>{tip.emoji}</span>
                <button className="icon-btn" onClick={() => dispatch({ type: 'TOGGLE_TIP_FAVORITE', payload: { tipId: tip.id } })}>
                  {fav ? '⭐' : '☆'}
                </button>
              </div>
              <span className="badge" style={{ marginBottom: 8 }}>
                {tip.category}
              </span>
              <h4 style={{ margin: '4px 0' }}>{tip.title}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{tip.body}</p>
            </div>
          )
        })}
        {list.length === 0 && <p className="muted">No tips match that filter yet.</p>}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useStore } from '../state/store.jsx'
import Modal from './ui/Modal.jsx'
import EmptyState from './ui/EmptyState.jsx'
import { uid } from '../lib/utils.js'
import { getImage, putImage, deleteImage, compressImage } from '../lib/db.js'

const DEFAULT_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Baking', 'Other']

function emptyForm() {
  return {
    id: uid(),
    title: '',
    category: 'Dinner',
    ingredients: [{ id: uid(), text: '' }],
    instructions: '',
    notes: '',
    hasImage: false,
  }
}

function RecipeImage({ recipeId, hasImage, className, placeholderEmoji = '🍽️' }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let objectUrl = null
    let cancelled = false
    if (hasImage) {
      getImage(recipeId).then((blob) => {
        if (blob && !cancelled) {
          objectUrl = URL.createObjectURL(blob)
          setUrl(objectUrl)
        }
      })
    }
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [recipeId, hasImage])

  // The placeholder always uses its own centered-emoji styling — `className`
  // only ever applies to the loaded <img>, so passing "recipe-image" for a
  // bigger modal view doesn't squash the placeholder into an unstyled div.
  if (!hasImage) {
    return (
      <div className="recipe-image-placeholder">
        <span>{placeholderEmoji}</span>
      </div>
    )
  }
  if (!url) return <div className="recipe-image-placeholder" />
  return <img className={className || 'recipe-image'} src={url} alt="" />
}

export default function Recipes() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState(null) // recipe object
  const [form, setForm] = useState(null) // form object while adding/editing
  const [addToListFor, setAddToListFor] = useState(null) // recipe object

  const categories = ['All', ...new Set([...DEFAULT_CATEGORIES, ...state.recipes.map((r) => r.category)])]

  const visible = state.recipes.filter((r) => {
    if (filter !== 'All' && r.category !== filter) return false
    if (query && !r.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  function openNew() {
    setForm(emptyForm())
    setViewing(null)
  }

  function openEdit(recipe) {
    setForm({ ...recipe, ingredients: recipe.ingredients.length ? recipe.ingredients : [{ id: uid(), text: '' }] })
    setViewing(null)
  }

  async function handleImageUpload(file) {
    if (!file) return
    const blob = await compressImage(file)
    await putImage(form.id, blob)
    setForm((f) => ({ ...f, hasImage: true }))
  }

  async function saveRecipe(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const cleanIngredients = form.ingredients.filter((i) => i.text.trim())
    const payload = { ...form, ingredients: cleanIngredients }
    const exists = state.recipes.some((r) => r.id === form.id)
    dispatch({ type: exists ? 'UPDATE_RECIPE' : 'ADD_RECIPE', payload })
    setForm(null)
  }

  async function removeRecipe(recipe) {
    if (!confirm(`Delete "${recipe.title}"? This can't be undone.`)) return
    if (recipe.hasImage) await deleteImage(recipe.id)
    dispatch({ type: 'DELETE_RECIPE', payload: { id: recipe.id } })
    setViewing(null)
  }

  function addIngredientRow() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { id: uid(), text: '' }] }))
  }

  function updateIngredient(id, text) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.map((i) => (i.id === id ? { ...i, text } : i)) }))
  }

  function removeIngredient(id) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((i) => i.id !== id) }))
  }

  function confirmAddToList(listId) {
    const texts = addToListFor.ingredients.map((i) => i.text)
    dispatch({ type: 'ADD_SHOPPING_ITEMS', payload: { listId, items: texts } })
    dispatch({ type: 'SHOW_TOAST', payload: { emoji: '🛒', title: 'Added to shopping list', body: `${texts.length} ingredient(s) from "${addToListFor.title}" added.` } })
    setAddToListFor(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input style={{ maxWidth: 260 }} placeholder="Search recipes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="pill-select">
          {categories.map((c) => (
            <button key={c} className={filter === c ? 'active' : ''} onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>
        <button className="btn" style={{ marginLeft: 'auto' }} onClick={openNew}>
          + Add recipe
        </button>
      </div>

      {visible.length === 0 && (
        <EmptyState emoji="📖" title="No recipes here yet" subtitle="Brain-dump your go-to budget-friendly meals so meal planning takes two minutes, not twenty." />
      )}

      <div className="grid cols-3">
        {visible.map((r) => (
          <div className="card recipe-card" key={r.id} onClick={() => setViewing(r)}>
            <RecipeImage recipeId={r.id} hasImage={r.hasImage} />
            <div className="recipe-card-body">
              <h4>{r.title}</h4>
              <span className="badge">{r.category}</span>
              <span className="muted">{r.ingredients.length} ingredient{r.ingredients.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)}>
          <RecipeImage recipeId={viewing.id} hasImage={viewing.hasImage} className="recipe-image" placeholderEmoji="🍽️" />
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge">{viewing.category}</span>
            <button className="btn secondary small" onClick={() => openEdit(viewing)}>✏️ Edit</button>
            <button className="btn danger small" onClick={() => removeRecipe(viewing)}>🗑️ Delete</button>
            <button className="btn accent small" onClick={() => { setAddToListFor(viewing); setViewing(null) }}>🛒 Add to shopping list</button>
          </div>

          <div className="section-title" style={{ marginTop: 18 }}>🥕 Ingredients</div>
          {viewing.ingredients.length === 0 && <p className="muted">No ingredients listed.</p>}
          {viewing.ingredients.map((i) => (
            <div className="ingredient-chip" key={i.id}>
              <span className="grow">{i.text}</span>
            </div>
          ))}

          {viewing.instructions && (
            <>
              <div className="section-title" style={{ marginTop: 18 }}>👩‍🍳 Instructions</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{viewing.instructions}</p>
            </>
          )}
          {viewing.notes && (
            <>
              <div className="section-title" style={{ marginTop: 18 }}>📝 Notes</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{viewing.notes}</p>
            </>
          )}
        </Modal>
      )}

      {form && (
        <Modal title={form.title ? `Edit "${form.title}"` : 'New recipe'} onClose={() => setForm(null)}>
          <form onSubmit={saveRecipe}>
            <label>Photo (optional)</label>
            <label className="image-upload-box">
              {form.hasImage ? (
                <RecipeImage recipeId={form.id} hasImage={form.hasImage} />
              ) : (
                <>
                  <span style={{ fontSize: '2rem' }}>📷</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Tap to add a photo</span>
                </>
              )}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e.target.files?.[0])} />
            </label>

            <div className="field" style={{ marginTop: 12 }}>
              <label>Title</label>
              <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Budget veggie stew" />
            </div>
            <div className="field">
              <label>Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                list="recipe-categories"
                placeholder="e.g. Dinner"
              />
              <datalist id="recipe-categories">
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <label>Ingredients</label>
            {form.ingredients.map((i) => (
              <div key={i.id} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={i.text} onChange={(e) => updateIngredient(i.id, e.target.value)} placeholder="e.g. 2 cups rice" />
                <button type="button" className="icon-btn" onClick={() => removeIngredient(i.id)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn secondary small" onClick={addIngredientRow}>+ Add ingredient</button>

            <div className="field" style={{ marginTop: 12 }}>
              <label>Instructions</label>
              <textarea rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>
            <div className="field">
              <label>Notes (optional)</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Budget-friendly, freezes well" />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit">Save recipe</button>
              <button className="btn ghost" type="button" onClick={() => setForm(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {addToListFor && (
        <Modal title="Add ingredients to which list?" onClose={() => setAddToListFor(null)}>
          {state.shoppingLists.length === 0 && <p className="muted">No shopping lists yet — create one on the Shopping List tab first.</p>}
          {state.shoppingLists.map((l) => (
            <div className="list-row" key={l.id} style={{ cursor: 'pointer' }} onClick={() => confirmAddToList(l.id)}>
              <div className="grow">
                <h4>{l.name}</h4>
                <span className="muted">{l.items.length} item(s)</span>
              </div>
              <button className="btn small">Add here</button>
            </div>
          ))}
        </Modal>
      )}
    </div>
  )
}

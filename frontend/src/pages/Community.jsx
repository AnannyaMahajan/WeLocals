import React, { useEffect, useState } from 'react'
import api, { setAuthToken } from '../api'
import { Link } from 'react-router-dom'

export default function Community(){
  const [posts,setPosts] = useState([])
  const [title,setTitle] = useState('')
  const [content,setContent] = useState('')
  const [category,setCategory] = useState('buy-sell')
  const token = localStorage.getItem('token')

  useEffect(()=>{ if(token) setAuthToken(token) }, [token])

  async function load(){
    const {data} = await api.get('/posts', { params:{ category: undefined } })
    setPosts(data)
  }
  useEffect(()=>{ load() }, [])

  async function create(e){
    e.preventDefault()
    try{
      await api.post('/posts', { title, content, category })
      setTitle(''); setContent(''); load()
    }catch(e){ alert('Login required') }
  }

  return (
    <div className="container">
      <div className="header">Community Board</div>
      <form onSubmit={create} className="card" style={{marginBottom:12}}>
        <div className="stack" style={{flexDirection:'column', alignItems:'stretch', gap:8}}>
          <input className="input" placeholder="Post title" value={title} onChange={e=>setTitle(e.target.value)} />
          <textarea className="input" placeholder="Details" value={content} onChange={e=>setContent(e.target.value)} rows={3}/>
          <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="buy-sell">Buy/Sell</option>
            <option value="lost-found">Lost & Found</option>
            <option value="events">Events</option>
            <option value="general">General</option>
          </select>
          <button className="btn">Post</button>
        </div>
      </form>

      <div className="grid">
        {posts.map(p => (
          <div className="card" key={p.id}>
            <div style={{fontWeight:700}}>{p.title}</div>
            <div className="hint">{p.category} · {new Date(p.created_at).toLocaleString()}</div>
            <div style={{marginTop:6}}>{p.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

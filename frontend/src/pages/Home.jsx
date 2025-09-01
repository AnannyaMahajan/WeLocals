import React, { useEffect, useState } from 'react'
import api from '../api'
import { Link } from 'react-router-dom'

export default function Home(){
  const [products,setProducts] = useState([])
  const [q,setQ] = useState('')

  async function load(){
    const {data} = await api.get('/products', { params:{ q } })
    setProducts(data)
  }
  useEffect(()=>{ load() }, [])

  return (
    <div className="container">
      <div className="stack" style={{justifyContent:'space-between'}}>
        <div className="header">Discover nearby items</div>
        <div className="stack">
          <input className="input" placeholder="Search products" value={q} onChange={e=>setQ(e.target.value)} />
          <button className="btn" onClick={load}>Search</button>
        </div>
      </div>
      <div className="grid">
        {products.map(p => (
          <div className="card" key={p.id}>
            <div style={{fontWeight:700}}>{p.name}</div>
            <div className="hint">₹ {p.price}</div>
            <div className="stack" style={{marginTop:8, justifyContent:'space-between'}}>
              <Link className="btn" to={`/shops?shop=${p.shop_id}`}>View Shop</Link>
              <button className="btn">Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

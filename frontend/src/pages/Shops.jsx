import React, { useEffect, useState } from 'react'
import api from '../api'

export default function Shops(){
  const [shops,setShops] = useState([])
  const [category,setCategory] = useState('')

  async function load(){
    const {data} = await api.get('/shops', { params:{ category: category || undefined } })
    setShops(data)
  }
  useEffect(()=>{ load() }, [category])

  return (
    <div className="container">
      <div className="stack" style={{justifyContent:'space-between'}}>
        <div className="header">Local Shops</div>
        <select className="input" style={{maxWidth:220}} value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="kirana">Kirana</option>
          <option value="stationery">Stationery</option>
          <option value="food">Food</option>
          <option value="services">Services</option>
        </select>
      </div>
      <div className="grid">
        {shops.map(s => (
          <div className="card" key={s.id}>
            <div style={{fontWeight:700}}>{s.name}</div>
            <div className="hint">{s.category}</div>
            <div className="hint">{s.address}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

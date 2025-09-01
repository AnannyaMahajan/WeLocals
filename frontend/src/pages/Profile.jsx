import React, { useEffect, useState } from 'react'
import api, { setAuthToken } from '../api'

export default function Profile(){
  const [me,setMe] = useState(null)
  const [shop,setShop] = useState({ name:'', category:'kirana', description:'', address:'' })
  const [shopId,setShopId] = useState(null)
  const [product,setProduct] = useState({ name:'', price:0, stock:0, image_url:'' })
  const token = localStorage.getItem('token')

  useEffect(()=>{
    if(token){ setAuthToken(token); api.get('/me').then(r=>setMe(r.data)).catch(()=>{}) }
  }, [token])

  async function createShop(e){
    e.preventDefault()
    try{
      const {data} = await api.post('/shops', shop)
      setShopId(data.id)
      alert('Shop created')
    }catch(e){ alert('Only shop owners can create shops (register as owner).') }
  }

  async function addProduct(e){
    e.preventDefault()
    try{
      await api.post(`/shops/${shopId}/products`, product)
      alert('Product added')
    }catch(e){ alert('Create a shop first or login.') }
  }

  if(!token) return <div className="container"><a className="btn" href="/login">Login / Register</a></div>

  return (
    <div className="container">
      <div className="header">Your Profile</div>
      {me && <div className="hint">Logged in as {me.name} ({me.email}) {me.is_shop_owner? '· Shop Owner' : ''}</div>}

      <div className="grid" style={{marginTop:12}}>
        <div className="card">
          <div className="header">Create Your Shop</div>
          <form onSubmit={createShop} className="stack" style={{flexDirection:'column', alignItems:'stretch', gap:8}}>
            <input className="input" placeholder="Shop name" value={shop.name} onChange={e=>setShop({...shop, name:e.target.value})} />
            <select className="input" value={shop.category} onChange={e=>setShop({...shop, category:e.target.value})}>
              <option value="kirana">Kirana</option>
              <option value="stationery">Stationery</option>
              <option value="food">Food</option>
              <option value="services">Services</option>
            </select>
            <input className="input" placeholder="Address" value={shop.address} onChange={e=>setShop({...shop, address:e.target.value})} />
            <textarea className="input" placeholder="Description" value={shop.description} onChange={e=>setShop({...shop, description:e.target.value})} rows={3}/>
            <button className="btn">Create Shop</button>
          </form>
        </div>

        <div className="card">
          <div className="header">Add Product</div>
          <form onSubmit={addProduct} className="stack" style={{flexDirection:'column', alignItems:'stretch', gap:8}}>
            <input className="input" placeholder="Product name" value={product.name} onChange={e=>setProduct({...product, name:e.target.value})} />
            <input className="input" placeholder="Price" type="number" value={product.price} onChange={e=>setProduct({...product, price:parseFloat(e.target.value)})} />
            <input className="input" placeholder="Stock" type="number" value={product.stock} onChange={e=>setProduct({...product, stock:parseInt(e.target.value)})} />
            <input className="input" placeholder="Image URL (optional)" value={product.image_url} onChange={e=>setProduct({...product, image_url:e.target.value})} />
            <button className="btn">Add Product</button>
          </form>
        </div>
      </div>
    </div>
  )
}

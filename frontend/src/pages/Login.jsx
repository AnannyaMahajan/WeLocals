import React, { useState } from 'react'
import api, { setAuthToken } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const nav = useNavigate()
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [name,setName] = useState('')
  const [mode,setMode] = useState('login') // or register
  const [isOwner,setIsOwner] = useState(false)
  const [err,setErr] = useState('')

  async function submit(e){
    e.preventDefault(); setErr('')
    try{
      if(mode==='register'){
        await api.post('/auth/register',{email,name,password,is_shop_owner:isOwner})
      }
      const form = new FormData()
      form.append('username', email); form.append('password', password)
      const {data} = await api.post('/auth/login', form, { headers:{'Content-Type':'multipart/form-data'} })
      localStorage.setItem('token', data.access_token)
      setAuthToken(data.access_token)
      nav('/profile')
    }catch(ex){ setErr(ex?.response?.data?.detail || 'Failed') }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:420, margin:'60px auto'}}>
        <div className="header">{mode==='login'?'Welcome back':'Create account'}</div>
        <form onSubmit={submit} className="stack" style={{flexDirection:'column', alignItems:'stretch'}}>
          {mode==='register' && <input className="input" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />}
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          {mode==='register' && <label className="stack"><input type="checkbox" checked={isOwner} onChange={e=>setIsOwner(e.target.checked)} /> Register as shop owner</label>}
          {err && <div className="hint" style={{color:'crimson'}}>{err}</div>}
          <button className="btn">{mode==='login'?'Login':'Register & Login'}</button>
        </form>
        <div className="hint" style={{marginTop:10}}>
          {mode==='login'? <span onClick={()=>setMode('register')} style={{color:'#ff6a00', cursor:'pointer'}}>New here? Create an account</span>
          : <span onClick={()=>setMode('login')} style={{color:'#ff6a00', cursor:'pointer'}}>Have an account? Sign in</span>}
        </div>
      </div>
    </div>
  )
}

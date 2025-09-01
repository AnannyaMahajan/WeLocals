from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import sessionmaker, DeclarativeBase, relationship
from passlib.context import CryptContext
from jose import jwt, JWTError
from typing import List, Optional
import os, datetime

class Settings(BaseSettings):
    SECRET_KEY: str = "changeme"
    DB_URL: str = "sqlite:///./welocals.db"
    CORS_ORIGINS: str = "http://localhost:5173"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60*24*7
settings = Settings()

# DB setup
class Base(DeclarativeBase): pass
engine = create_engine(settings.DB_URL, connect_args={"check_same_thread": False} if settings.DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Security
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_shop_owner = Column(Boolean, default=False)

class Shop(Base):
    __tablename__ = "shops"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, default="")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    address = Column(String, default="")
    owner = relationship("User")
    products = relationship("Product", back_populates="shop", cascade="all, delete")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String, default="")
    shop = relationship("Shop", back_populates="products")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    content = Column(Text, default="")
    category = Column(String, default="general") # buy-sell, lost-found, events
    price = Column(Float, nullable=True)
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())
    user = relationship("User")

Base.metadata.create_all(bind=engine)

# Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    is_shop_owner: bool = False

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    is_shop_owner: bool
    class Config: from_attributes = True

class ShopIn(BaseModel):
    name: str
    category: str
    description: str = ""
    lat: float | None = None
    lng: float | None = None
    address: str = ""

class ProductIn(BaseModel):
    name: str
    price: float
    stock: int = 0
    image_url: str = ""

class PostIn(BaseModel):
    title: str
    content: str = ""
    category: str = "general"
    price: float | None = None

# Utils
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_password_hash(password: str): return pwd_ctx.hash(password)
def verify_password(p, hp): return pwd_ctx.verify(p, hp)

def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> User:
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        uid: int = int(payload.get("sub"))
    except Exception as e:
        raise credentials_exception
    user = db.query(User).filter(User.id == uid).first()
    if not user: raise credentials_exception
    return user

# App
app = FastAPI(title="WeLocals API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes
@app.post("/auth/register", response_model=UserOut)
def register(u: UserCreate, db=Depends(get_db)):
    if db.query(User).filter(User.email == u.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(email=u.email, name=u.name, is_shop_owner=u.is_shop_owner, hashed_password=get_password_hash(u.password))
    db.add(user); db.commit(); db.refresh(user)
    return user

@app.post("/auth/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}

@app.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user

# Shops
@app.post("/shops", response_model=dict)
def create_shop(s: ShopIn, user: User = Depends(get_current_user), db=Depends(get_db)):
    if not user.is_shop_owner:
        raise HTTPException(403, "Only shop owners can create shops")
    shop = Shop(owner_id=user.id, **s.model_dump())
    db.add(shop); db.commit(); db.refresh(shop)
    return {"id": shop.id}

@app.get("/shops", response_model=List[dict])
def list_shops(db=Depends(get_db), category: Optional[str]=None):
    q = db.query(Shop)
    if category: q = q.filter(Shop.category == category)
    return [{
        "id": s.id, "name": s.name, "category": s.category, "description": s.description,
        "lat": s.lat, "lng": s.lng, "address": s.address
    } for s in q.all()]

# Products
@app.post("/shops/{shop_id}/products", response_model=dict)
def add_product(shop_id: int, p: ProductIn, user: User = Depends(get_current_user), db=Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id==shop_id).first()
    if not shop or shop.owner_id != user.id: raise HTTPException(403, "Not your shop")
    prod = Product(shop_id=shop_id, **p.model_dump())
    db.add(prod); db.commit(); db.refresh(prod)
    return {"id": prod.id}

@app.get("/products", response_model=List[dict])
def list_products(db=Depends(get_db), shop_id: Optional[int]=None, q: Optional[str]=None):
    query = db.query(Product)
    if shop_id: query = query.filter(Product.shop_id==shop_id)
    prods = query.all()
    out = []
    for p in prods:
        if q and q.lower() not in p.name.lower(): continue
        out.append({"id": p.id, "name": p.name, "price": p.price, "stock": p.stock, "image_url": p.image_url, "shop_id": p.shop_id})
    return out

# Community posts
@app.post("/posts", response_model=dict)
def create_post(post: PostIn, user: User = Depends(get_current_user), db=Depends(get_db)):
    p = Post(user_id=user.id, **post.model_dump())
    db.add(p); db.commit(); db.refresh(p)
    return {"id": p.id}

@app.get("/posts", response_model=List[dict])
def list_posts(db=Depends(get_db), category: Optional[str]=None):
    q = db.query(Post)
    if category: q = q.filter(Post.category==category)
    res = []
    for p in q.order_by(Post.id.desc()).all():
        res.append({"id": p.id, "title": p.title, "content": p.content, "category": p.category, "price": p.price, "created_at": p.created_at, "user_id": p.user_id})
    return res

@app.get("/")
def root():
    return {"status":"ok","app":"WeLocals API"}

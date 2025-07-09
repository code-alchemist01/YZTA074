from fastapi import FastAPI, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db import SessionLocal, engine
import models, schemas, crud

# Ensure tables are created and metadata is up to date
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Marathon Backend API", description="Eğitim platformu için backend API", version="1.0.0")

# CORS middleware ekle
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175", 
        "http://localhost:5176", 
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],  # Frontend URL'leri
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Marathon Backend API'ye hoş geldiniz!"}

# Login endpoint
@app.post("/login")
def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    try:
        # Kullanıcıyı email ile bul
        ogrenci = crud.get_ogrenci_by_email(db, email=email)
        if not ogrenci:
            raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
        
        # Şifre kontrolü (basit kodlama ile)
        expected_hash = email + 'password'
        import base64
        expected_encoded = base64.b64encode(expected_hash.encode()).decode()
        
        if ogrenci.ogrenci_sifreHashed != expected_encoded:
            raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
        
        # Başarılı login
        return {
            "message": "Giriş başarılı",
            "user": ogrenci,
            "token": base64.b64encode(f"{ogrenci.ogrenci_id}:{email}".encode()).decode()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Giriş sırasında hata: {str(e)}")

# Ogrenci Endpoints
@app.post("/ogrenciler/", response_model=schemas.Ogrenci)
def ogrenci_olustur(ogrenci: schemas.OgrenciCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_ogrenci(db=db, ogrenci=ogrenci)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Öğrenci oluşturulurken hata: {str(e)}")

@app.get("/ogrenciler/", response_model=list[schemas.Ogrenci])
def ogrencileri_listele(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_ogrenciler(db, skip=skip, limit=limit)

@app.get("/ogrenciler/{ogrenci_id}", response_model=schemas.Ogrenci)
def ogrenci_getir(ogrenci_id: int, db: Session = Depends(get_db)):
    db_ogrenci = crud.get_ogrenci(db, ogrenci_id=ogrenci_id)
    if db_ogrenci is None:
        raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
    return db_ogrenci

@app.put("/ogrenciler/{ogrenci_id}", response_model=schemas.Ogrenci)
def ogrenci_guncelle(ogrenci_id: int, ogrenci: schemas.OgrenciCreate, db: Session = Depends(get_db)):
    try:
        db_ogrenci = crud.update_ogrenci(db=db, ogrenci_id=ogrenci_id, ogrenci_update=ogrenci)
        if db_ogrenci is None:
            raise HTTPException(status_code=404, detail="Öğrenci bulunamadı")
        return db_ogrenci
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Öğrenci güncellenirken hata: {str(e)}")

# Dersler Endpoints
@app.post("/dersler/", response_model=schemas.Dersler)
def ders_olustur(ders: schemas.DerslerCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_ders(db=db, ders=ders)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ders oluşturulurken hata: {str(e)}")

@app.get("/dersler/", response_model=list[schemas.Dersler])
def dersleri_listele(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_dersler(db, skip=skip, limit=limit)

@app.get("/dersler/{ders_id}", response_model=schemas.Dersler)
def ders_getir(ders_id: int, db: Session = Depends(get_db)):
    db_ders = crud.get_ders(db, ders_id=ders_id)
    if db_ders is None:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    return db_ders

# Konular Endpoints
@app.post("/konular/", response_model=schemas.Konular)
def konu_olustur(konu: schemas.KonularCreate, db: Session = Depends(get_db)):
    return crud.create_konu(db=db, konu=konu)

@app.get("/konular/", response_model=list[schemas.Konular])
def konulari_listele(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_konular(db, skip=skip, limit=limit)

@app.get("/konular/{konu_id}", response_model=schemas.Konular)
def konu_getir(konu_id: int, db: Session = Depends(get_db)):
    db_konu = crud.get_konu(db, konu_id=konu_id)
    if db_konu is None:
        raise HTTPException(status_code=404, detail="Konu bulunamadı")
    return db_konu

# SinavSimilasyonlari Endpoints
@app.post("/sinavlar/", response_model=schemas.SinavSimilasyonlari)
def sinav_olustur(sinav: schemas.SinavSimilasyonlariCreate, db: Session = Depends(get_db)):
    return crud.create_sinav(db=db, sinav=sinav)

@app.get("/sinavlar/", response_model=list[schemas.SinavSimilasyonlari])
def sinavlari_listele(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_sinavlar(db, skip=skip, limit=limit)

@app.get("/sinavlar/{sinav_id}", response_model=schemas.SinavSimilasyonlari)
def sinav_getir(sinav_id: int, db: Session = Depends(get_db)):
    db_sinav = crud.get_sinav(db, sinav_id=sinav_id)
    if db_sinav is None:
        raise HTTPException(status_code=404, detail="Sınav bulunamadı")
    return db_sinav

# Istatistikler Endpoints
@app.post("/istatistikler/", response_model=schemas.Istatistikler)
def istatistik_olustur(istatistik: schemas.IstatistiklerCreate, db: Session = Depends(get_db)):
    return crud.create_istatistik(db=db, istatistik=istatistik)

@app.get("/istatistikler/", response_model=list[schemas.Istatistikler])
def istatistikleri_listele(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_istatistikler(db, skip=skip, limit=limit)

@app.get("/istatistikler/{istatistik_id}", response_model=schemas.Istatistikler)
def istatistik_getir(istatistik_id: int, db: Session = Depends(get_db)):
    db_istatistik = crud.get_istatistik(db, istatistik_id=istatistik_id)
    if db_istatistik is None:
        raise HTTPException(status_code=404, detail="İstatistik bulunamadı")
    return db_istatistik

# OdullerVeBasarimlar Endpoints
@app.post("/basarimlar/", response_model=schemas.OdullerVeBasarimlar)
def basarim_olustur(basarim: schemas.OdullerVeBasarimlarCreate, db: Session = Depends(get_db)):
    return crud.create_basarim(db=db, basarim=basarim)

@app.get("/basarimlar/", response_model=list[schemas.OdullerVeBasarimlar])
def basarimlari_listele(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_basarimlar(db, skip=skip, limit=limit)

@app.get("/basarimlar/{basarim_id}", response_model=schemas.OdullerVeBasarimlar)
def basarim_getir(basarim_id: int, db: Session = Depends(get_db)):
    db_basarim = crud.get_basarim(db, basarim_id=basarim_id)
    if db_basarim is None:
        raise HTTPException(status_code=404, detail="Başarım bulunamadı")
    return db_basarim

# ChatbotEtkilesim Endpoints
@app.post("/chatbot/", response_model=schemas.ChatbotEtkilesim)
def chatbot_olustur(chatbot: schemas.ChatbotEtkilesimCreate, db: Session = Depends(get_db)):
    return crud.create_chatbot(db=db, chatbot=chatbot)

@app.get("/chatbot/", response_model=list[schemas.ChatbotEtkilesim])
def chatbotlari_listele(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_chatbotlar(db, skip=skip, limit=limit)

@app.get("/chatbot/{chatbot_id}", response_model=schemas.ChatbotEtkilesim)
def chatbot_getir(chatbot_id: int, db: Session = Depends(get_db)):
    db_chatbot = crud.get_chatbot(db, chatbot_id=chatbot_id)
    if db_chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot etkileşimi bulunamadı")
    return db_chatbot 
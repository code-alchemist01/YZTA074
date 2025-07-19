from sqlalchemy.orm import Session
import models, schemas

# Ogrenci

def get_ogrenci(db: Session, ogrenci_id: int):
    return db.query(models.Ogrenci).filter(models.Ogrenci.ogrenci_id == ogrenci_id).first()

def get_ogrenci_by_email(db: Session, email: str):
    return db.query(models.Ogrenci).filter(models.Ogrenci.ogrenci_email == email).first()

def get_ogrenciler(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Ogrenci).offset(skip).limit(limit).all()

def create_ogrenci(db: Session, ogrenci: schemas.OgrenciCreate):
    db_ogrenci = models.Ogrenci(**ogrenci.model_dump())
    db.add(db_ogrenci)
    db.commit()
    db.refresh(db_ogrenci)
    return db_ogrenci

def update_ogrenci(db: Session, ogrenci_id: int, ogrenci_update: schemas.OgrenciCreate):
    db_ogrenci = db.query(models.Ogrenci).filter(models.Ogrenci.ogrenci_id == ogrenci_id).first()
    if db_ogrenci:
        for key, value in ogrenci_update.model_dump(exclude_unset=True).items():
            setattr(db_ogrenci, key, value)
        db.commit()
        db.refresh(db_ogrenci)
    return db_ogrenci

# Dersler

def get_ders(db: Session, ders_id: int):
    return db.query(models.Dersler).filter(models.Dersler.ders_id == ders_id).first()

def get_dersler(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Dersler).offset(skip).limit(limit).all()

def create_ders(db: Session, ders: schemas.DerslerCreate):
    db_ders = models.Dersler(**ders.model_dump())
    db.add(db_ders)
    db.commit()
    db.refresh(db_ders)
    return db_ders

# Konular

def get_konu(db: Session, konu_id: int):
    return db.query(models.Konular).filter(models.Konular.konu_id == konu_id).first()

def get_konular(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Konular).offset(skip).limit(limit).all()

def create_konu(db: Session, konu: schemas.KonularCreate):
    db_konu = models.Konular(**konu.model_dump())
    db.add(db_konu)
    db.commit()
    db.refresh(db_konu)
    return db_konu

# SinavSimilasyonlari

def get_sinav(db: Session, sinav_id: int):
    return db.query(models.SinavSimilasyonlari).filter(models.SinavSimilasyonlari.sinav_id == sinav_id).first()

def get_sinavlar(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.SinavSimilasyonlari).offset(skip).limit(limit).all()

def create_sinav(db: Session, sinav: schemas.SinavSimilasyonlariCreate):
    db_sinav = models.SinavSimilasyonlari(**sinav.model_dump())
    db.add(db_sinav)
    db.commit()
    db.refresh(db_sinav)
    return db_sinav

# Istatistikler

def get_istatistik(db: Session, istatistik_id: int):
    return db.query(models.Istatistikler).filter(models.Istatistikler.istatistik_id == istatistik_id).first()

def get_istatistikler(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Istatistikler).offset(skip).limit(limit).all()

def create_istatistik(db: Session, istatistik: schemas.IstatistiklerCreate):
    db_istatistik = models.Istatistikler(**istatistik.model_dump())
    db.add(db_istatistik)
    db.commit()
    db.refresh(db_istatistik)
    return db_istatistik

# OdullerVeBasarimlar

def get_basarim(db: Session, basarim_id: int):
    return db.query(models.OdullerVeBasarimlar).filter(models.OdullerVeBasarimlar.basarim_id == basarim_id).first()

def get_basarimlar(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.OdullerVeBasarimlar).offset(skip).limit(limit).all()

def create_basarim(db: Session, basarim: schemas.OdullerVeBasarimlarCreate):
    db_basarim = models.OdullerVeBasarimlar(**basarim.model_dump())
    db.add(db_basarim)
    db.commit()
    db.refresh(db_basarim)
    return db_basarim

# ChatbotEtkilesim

def get_chatbot(db: Session, chatbot_id: int):
    return db.query(models.ChatbotEtkilesim).filter(models.ChatbotEtkilesim.chatbot_id == chatbot_id).first()

def get_chatbotlar(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.ChatbotEtkilesim).offset(skip).limit(limit).all()

def create_chatbot(db: Session, chatbot: schemas.ChatbotEtkilesimCreate):
    db_chatbot = models.ChatbotEtkilesim(**chatbot.model_dump())
    db.add(db_chatbot)
    db.commit()
    db.refresh(db_chatbot)
    return db_chatbot

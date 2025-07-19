from sqlalchemy import Column, Integer, String, Date, DateTime, DECIMAL, SmallInteger, Text, ForeignKey, Table
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.orm import relationship
from db import Base

class Ogrenci(Base):
    __tablename__ = "ogrenci"
    
    ogrenci_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ogrenci_kullaniciAdi = Column(String(45), unique=True, nullable=False)
    ogrenci_email = Column(String(45), unique=True, nullable=False)
    ogrenci_sifreHashed = Column(String(255), nullable=False)
    ogrenci_ad = Column(String(45), nullable=False)
    ogrenci_soyad = Column(String(45), nullable=False)
    ogrenci_dogumTarihi = Column(Date, nullable=False)
    ogrenci_okulSeviyesi = Column(String(45))
    ogrenci_adhdSeviyesi = Column(String(45))
    ogrenci_kayitTarihi = Column(String(45))
    ogrenci_odakSuresi = Column(DECIMAL(5,2), default=0.0)
    ogrenci_soruCozmeHizi = Column(DECIMAL(5,2), default=0.0)
    ogrenci_basariOrani = Column(DECIMAL(5,2), default=0.0)
    ogrenci_dikkatSeviyesi = Column(DECIMAL(5,2), default=0.0)
    ogrenci_mevcutSeviye = Column(SmallInteger)
    ogrenci_ogrenmeStili = Column(String(45))
    ogrenci_sonGuncellemeTarihi = Column(DateTime, nullable=False)

class Dersler(Base):
    __tablename__ = "dersler"
    ders_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ders_adi = Column(String(45), nullable=False)
    ders_baslangicSaati = Column(DateTime)
    ders_bitisSaati = Column(DateTime)
    ders_tamamlandiMi = Column(TINYINT)
    ders_kazanilanHalkaSayisi = Column(TINYINT)
    ders_odakPuani = Column(DECIMAL(5,2))
    ders_enerjiSeviyesi = Column(DECIMAL(5,2))
    ders_tarihi = Column(Date)

class Konular(Base):
    __tablename__ = "konular"
    konu_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    konu_adi = Column(String(45), nullable=False)
    konu_seviyesi = Column(TINYINT)
    konu_tipi = Column(String(45))
    konu_metni = Column(Text)
    konu_dogruCevap = Column(String(45))
    konu_ipucu = Column(String(45))
    konu_cozumMetni = Column(Text)
    konu_cozumVideoUrl = Column(String(45))
    ders_id = Column(Integer, ForeignKey('Dersler.ders_id'))

class SinavSimilasyonlari(Base):
    __tablename__ = "sinavsimilasyonlari"
    sinav_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sinav_adi = Column(String(45))
    sinav_baslangicSaati = Column(DateTime)
    sinav_bitisSaati = Column(DateTime)
    sinav_puan = Column(DECIMAL(5,2))
    sinav_dogruCevapSayisi = Column(TINYINT)
    sinav_yanlisCevapSayisi = Column(TINYINT)
    sinav_tarihi = Column(Date)
    sinav_kullanilanSenaryo = Column(Text)
    sinav_detayliAnalizMetni = Column(Text)

class Istatistikler(Base):
    __tablename__ = "istatistikler"
    istatistik_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    istatistik_tarihi = Column(Date)
    istatistik_gunlukcalismaSuresi = Column(DECIMAL(5,2))
    istatistik_tamamlananModulSayisi = Column(TINYINT)
    istatistik_ortalamaodakPuani = Column(DECIMAL(5,2))
    istatistik_cozulenSoruSayisi = Column(TINYINT)
    istatistik_dogruCevapOrani = Column(DECIMAL(5,2))
    istatistik_kazanilanHalkaSayisi = Column(TINYINT)
    istatistik_molaSayisi = Column(TINYINT)
    istatistik_toplamMolaSuresi = Column(DECIMAL(5,2))
    istatistik_uykuKalitesi = Column(DECIMAL(5,2))
    istatistik_notlar = Column(Text)
    ogrenci_id = Column(Integer, ForeignKey('Ogrenci.ogrenci_id'))

class OdullerVeBasarimlar(Base):
    __tablename__ = "odullervebasarimlar"
    basarim_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    basarim_adi = Column(String(45))
    basarim_kazanmaTarihi = Column(Date)

class ChatbotEtkilesim(Base):
    __tablename__ = "chatbotetkilesim"
    chatbot_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chatbot_soruMetni = Column(Text)
    chatbot_cevapMetni = Column(Text)
    chatbot_zamanDamgasi = Column(DateTime)
    chatbot_duyguCikarimi = Column(String(45))
    ogrenci_id = Column(Integer, ForeignKey('Ogrenci.ogrenci_id'))

# Çoktan-çoğa ilişki tabloları
class Dersler_has_Ogrenci(Base):
    __tablename__ = "dersler_has_ogrenci"
    ders_id = Column(Integer, ForeignKey('dersler.ders_id'), primary_key=True)
    ogrenci_id = Column(Integer, ForeignKey('ogrenci.ogrenci_id'), primary_key=True)

class SinavSimilasyonlari_has_Ogrenci(Base):
    __tablename__ = "sinavsimilasyonlari_has_ogrenci"
    sinav_id = Column(Integer, ForeignKey('sinav_similasyonlari.sinav_id'), primary_key=True)
    ogrenci_id = Column(Integer, ForeignKey('ogrenci.ogrenci_id'), primary_key=True)

class OdullerVeBasarimlar_has_Ogrenci(Base):
    __tablename__ = "odullervebasarimlar_has_ogrenci"
    basarim_id = Column(Integer, ForeignKey('oduller_ve_basarimlar.basarim_id'), primary_key=True)
    ogrenci_id = Column(Integer, ForeignKey('ogrenci.ogrenci_id'), primary_key=True) 
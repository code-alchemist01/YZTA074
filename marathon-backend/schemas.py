from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# Ogrenci
class OgrenciBase(BaseModel):
    ogrenci_kullaniciAdi: str
    ogrenci_email: str
    ogrenci_ad: str
    ogrenci_soyad: str
    ogrenci_dogumTarihi: Optional[date]
    ogrenci_okulSeviyesi: Optional[str]
    ogrenci_adhdSeviyesi: Optional[str]
    ogrenci_kayitTarihi: Optional[str]
    ogrenci_odakSuresi: Optional[float]
    ogrenci_soruCozmeHizi: Optional[float]
    ogrenci_basariOrani: Optional[float]
    ogrenci_dikkatSeviyesi: Optional[float]
    ogrenci_mevcutSeviye: Optional[int]
    ogrenci_ogrenmeStili: Optional[str]
    ogrenci_sonGuncellemeTarihi: Optional[datetime]

class OgrenciCreate(OgrenciBase):
    ogrenci_sifreHashed: str

class Ogrenci(OgrenciBase):
    ogrenci_id: int
    class Config:
        from_attributes = True

# Dersler
class DerslerBase(BaseModel):
    ders_adi: str
    ders_baslangicSaati: Optional[datetime]
    ders_bitisSaati: Optional[datetime]
    ders_tamamlandiMi: Optional[int]
    ders_kazanilanHalkaSayisi: Optional[int]
    ders_odakPuani: Optional[float]
    ders_enerjiSeviyesi: Optional[float]
    ders_tarihi: Optional[date]

class DerslerCreate(DerslerBase):
    pass

class Dersler(DerslerBase):
    ders_id: int
    class Config:
        from_attributes = True

# Konular
class KonularBase(BaseModel):
    konu_adi: str
    konu_seviyesi: Optional[int]
    konu_tipi: Optional[str]
    konu_metni: Optional[str]
    konu_dogruCevap: Optional[str]
    konu_ipucu: Optional[str]
    konu_cozumMetni: Optional[str]
    konu_cozumVideoUrl: Optional[str]
    ders_id: Optional[int]

class KonularCreate(KonularBase):
    pass

class Konular(KonularBase):
    konu_id: int
    class Config:
        from_attributes = True

# SinavSimilasyonlari
class SinavSimilasyonlariBase(BaseModel):
    sinav_adi: Optional[str]
    sinav_baslangicSaati: Optional[datetime]
    sinav_bitisSaati: Optional[datetime]
    sinav_puan: Optional[float]
    sinav_dogruCevapSayisi: Optional[int]
    sinav_yanlisCevapSayisi: Optional[int]
    sinav_tarihi: Optional[date]
    sinav_kullanilanSenaryo: Optional[str]
    sinav_detayliAnalizMetni: Optional[str]

class SinavSimilasyonlariCreate(SinavSimilasyonlariBase):
    pass

class SinavSimilasyonlari(SinavSimilasyonlariBase):
    sinav_id: int
    class Config:
        from_attributes = True

# Istatistikler
class IstatistiklerBase(BaseModel):
    istatistik_tarihi: Optional[date]
    istatistik_gunlukcalismaSuresi: Optional[float]
    istatistik_tamamlananModulSayisi: Optional[int]
    istatistik_ortalamaodakPuani: Optional[float]
    istatistik_cozulenSoruSayisi: Optional[int]
    istatistik_dogruCevapOrani: Optional[float]
    istatistik_kazanilanHalkaSayisi: Optional[int]
    istatistik_molaSayisi: Optional[int]
    istatistik_toplamMolaSuresi: Optional[float]
    istatistik_uykuKalitesi: Optional[float]
    istatistik_notlar: Optional[str]
    ogrenci_id: Optional[int]

class IstatistiklerCreate(IstatistiklerBase):
    pass

class Istatistikler(IstatistiklerBase):
    istatistik_id: int
    class Config:
        from_attributes = True

# OdullerVeBasarimlar
class OdullerVeBasarimlarBase(BaseModel):
    basarim_adi: str
    basarim_kazanmaTarihi: Optional[date]

class OdullerVeBasarimlarCreate(OdullerVeBasarimlarBase):
    pass

class OdullerVeBasarimlar(OdullerVeBasarimlarBase):
    basarim_id: int
    class Config:
        from_attributes = True

# ChatbotEtkilesim
class ChatbotEtkilesimBase(BaseModel):
    chatbot_soruMetni: Optional[str]
    chatbot_cevapMetni: Optional[str]
    chatbot_zamanDamgasi: Optional[datetime]
    chatbot_duyguCikarimi: Optional[str]
    ogrenci_id: Optional[int]

class ChatbotEtkilesimCreate(ChatbotEtkilesimBase):
    pass

class ChatbotEtkilesim(ChatbotEtkilesimBase):
    chatbot_id: int
    class Config:
        from_attributes = True

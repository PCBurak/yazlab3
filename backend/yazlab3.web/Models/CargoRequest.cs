using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace yazlab3.web.Models
{
    public class CargoRequest
    {
        // --- MEVCUT DEĞİŞKENLER (Dokunulmadı) ---
        public int Id { get; set; }

        public int StationId { get; set; }
        public Station Station { get; set; }

        public int CargoCount { get; set; } // Adet
        public int TotalWeightKg { get; set; } // Ağırlık

        public DateTime RequestDate { get; set; } = DateTime.Now; // Varsayılan tarih

        // --- YENİ EKLENEN ÖZELLİKLER (Tam Fonksiyonellik İçin) ---

        // Kargo kime gidiyor?
        public string ReceiverName { get; set; } = "";

        // Kargo tipi ne? (Standart, Hassas, Tehlikeli vb.)
        public string CargoType { get; set; } = "Standart";

        // Bu kargoyu hangi kullanıcı gönderdi? (İlişki)
        public int UserId { get; set; }
        // public User User { get; set; } // Eğer User modelin varsa bu satırı açabilirsin
    }
}
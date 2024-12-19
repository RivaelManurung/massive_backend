class artikel {
    constructor(id, judul, deskripsi,imageUrl, categoryArtikelId, createdAt, updatedAt) {
        this.id = id;
        this.judul = judul;
        this.deskripsi = deskripsi;
        this.imageUrl = imageUrl;
        this.categoryArtikelId = categoryArtikelId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
module.exports = artikel
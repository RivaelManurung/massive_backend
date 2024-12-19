class Forum {
    constructor(id, title, content, userId, keywords, imageUrl, createdAt, updatedAt, replies = []) {
      this.id = id; // ID unik untuk forum post
      this.title = title; // Judul post
      this.content = content; // Isi post
      this.userId = userId; // ID user yang membuat post
      this.keywords = keywords; // Kata kunci, maksimal 3
      this.imageUrl = imageUrl; // URL gambar opsional
      this.createdAt = createdAt; // Timestamp pembuatan
      this.updatedAt = updatedAt; // Timestamp pembaruan
      this.replies = replies; // Array berisi balasan dari user lain
    }
  
    // Method untuk menambahkan balasan ke forum
    addReply(reply) {
      this.replies.push(reply);
    }
  }
  
  module.exports = Forum;
  
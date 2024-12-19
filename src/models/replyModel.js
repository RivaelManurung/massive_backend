class Reply {
    constructor(id, forumId, userId, content, createdAt, updatedAt) {
      this.id = id; // ID unik untuk balasan
      this.forumId = forumId; // ID forum yang dibalas
      this.userId = userId; // ID user yang membalas
      this.content = content; // Isi balasan
      this.createdAt = createdAt; // Timestamp pembuatan
      this.updatedAt = updatedAt; // Timestamp pembaruan
    }
  }
  
  module.exports = Reply;
  
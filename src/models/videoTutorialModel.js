const dbpool = require("../config/database");

class VideoTutorial {
  constructor(id, title, description, videoUrl, categoryVideoId, thumbnailUrl, createdAt, updatedAt) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.videoUrl = videoUrl;
    this.categoryVideoId = categoryVideoId;
    this.thumbnailUrl = thumbnailUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = VideoTutorial;

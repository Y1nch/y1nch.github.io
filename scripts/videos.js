document.addEventListener("DOMContentLoaded", () => {
  const videoUploadForm = document.getElementById("video-upload-form");
  const videosContainer = document.getElementById("videos-container");

  // ⭐ Railway 雲端公網網址
  const BACKEND_URL = "https://y1nchgithubio-production.up.railway.app"; 

  if (videoUploadForm) {
    videoUploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData();
      formData.append("title", document.getElementById("video-title").value);
      formData.append("description", document.getElementById("video-description").value);
      formData.append("video", document.getElementById("video-file").files[0]);

      try {
        const response = await fetch(`${BACKEND_URL}/api/videos/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          alert("影片上傳成功！ (Video uploaded successfully!)");
          videoUploadForm.reset();
          loadVideos();
        } else {
          const errorData = await response.json();
          alert(`上傳失敗: ${errorData.message}`);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("連線失敗，請檢查網路或後端狀態。 (An error occurred during video upload.)");
      }
    });
  }

  async function loadVideos() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos`);
      if (response.ok) {
        const videos = await response.json();
        videosContainer.innerHTML = "";
        
        if (videos.length === 0) {
          videosContainer.innerHTML = "<p style='color: #64748b; text-align: center; margin-top: 20px;'>目前還沒有任何影片，快來上傳一個吧！</p>";
          return;
        }

        videos.forEach((video) => {
          const videoElement = document.createElement("div");
          
          // ⭕ 1. 改為對應 HTML 裡全新設計的科技藍微光外框 Class
          videoElement.classList.add("video-card");
          
          // ⭕ 2. 完美的結構填充：左側放文字區（video-info）、右側放安全播放器（video-player-wrapper）
          // 這樣影片控制條就會被死死鎖在框框內，絕對不會再爆出去了！
          videoElement.innerHTML = `
            <div class="video-info">
              <h3 class="video-card-title">${video.title}</h3>
              <p class="video-card-desc">${video.description || '暫無描述。'}</p>
              <span class="video-card-time">
                上傳時間: ${new Date(video.upload_date).toLocaleString()}
              </span>
            </div>
            <div class="video-player-wrapper">
              <video controls>
                <source src="${BACKEND_URL}/uploads/${video.filename}" type="video/mp4">
                您的瀏覽器不支援此影片標籤。
              </video>
            </div>
          `;
          videosContainer.appendChild(videoElement);
        });
      } else {
        console.error("Failed to load videos:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading videos:", error);
    }
  }

  loadVideos();
});

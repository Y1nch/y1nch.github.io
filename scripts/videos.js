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

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // 建立全域刪除影片函數
  window.deleteVideo = async function(videoId) {
    if (!confirm('確定要刪除這部影片嗎？此操作無法復原。')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('影片刪除成功！');
        loadVideos();
      } else {
        const err = await response.json();
        alert(`刪除失敗: ${err.message}`);
      }
    } catch (error) {
      console.error('刪除影片失敗:', error);
      alert('刪除失敗，請檢查網路連線。');
    }
  };

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

        const token = localStorage.getItem('token');
        const payload = token ? parseJwt(token) : null;
        const isAdmin = payload && payload.role === 'admin';

        videos.forEach((video) => {
          const videoElement = document.createElement("div");
          
          // ⭕ 1. 改為對應 HTML 裡全新設計的科技藍微光外框 Class
          videoElement.classList.add("video-card");
          
          let deleteBtnHtml = '';
          if (isAdmin) {
            deleteBtnHtml = `<button class="delete-btn" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-top: 14px; width: fit-content; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#dc2626'" onmouseout="this.style.backgroundColor='#ef4444'" onclick="window.deleteVideo(${video.id})">刪除影片</button>`;
          }

          // ⭕ 2. 完美的結構填充：左側放文字區（video-info）、右側放安全播放器（video-player-wrapper）
          // 這樣影片控制條就會被死死鎖在框框內，絕對不會再爆出去了！
          videoElement.innerHTML = `
            <div class="video-info">
              <h3 class="video-card-title">${video.title}</h3>
              <p class="video-card-desc">${video.description || '暫無描述。'}</p>
              <span class="video-card-time">
                上傳時間: ${new Date(video.upload_date).toLocaleString()}
              </span>
              ${deleteBtnHtml}
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

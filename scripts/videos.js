document.addEventListener("DOMContentLoaded", () => {
  const videoUploadForm = document.getElementById("video-upload-form");
  const videosContainer = document.getElementById("videos-container");

  // ⭐ 已經成功幫你換成 Railway 的雲端公網網址！
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
          videosContainer.innerHTML = "<p style='color: #64748b;'>目前還沒有任何影片，快來上傳一個吧！</p>";
          return;
        }

        videos.forEach((video) => {
          const videoElement = document.createElement("div");
          videoElement.classList.add("video-item");
          
          // 加上一些簡單精緻的 CSS 陰影樣式
          videoElement.style.backgroundColor = "#1e293b";
          videoElement.style.padding = "20px";
          videoElement.style.borderRadius = "8px";
          videoElement.style.marginBottom = "20px";
          videoElement.style.border = "1px solid #334155";

          videoElement.innerHTML = `
            <h3 style="margin-top:0; color:#ffffff;">${video.title}</h3>
            <p style="color:#cbd5e1; font-size:0.95rem;">${video.description || '無描述'}</p>
            <video controls width="100%" style="border-radius:6px; background:#0f172a;">
              <source src="${BACKEND_URL}/uploads/${video.filename}" type="video/mp4">
              您的瀏覽器不支援此影片標籤。
            </video>
            <p style="color:#64748b; font-size:0.85rem; margin-bottom:0; margin-top:10px;">
              上傳時間: ${new Date(video.upload_date).toLocaleString()}
            </p>
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

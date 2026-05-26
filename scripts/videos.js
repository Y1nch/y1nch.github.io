document.addEventListener("DOMContentLoaded", () => {
  const videoUploadForm = document.getElementById("video-upload-form");
  const imageUploadForm = document.getElementById("image-upload-form");
  const videosContainer = document.getElementById("videos-container");
  const imagesContainer = document.getElementById("images-container");

  // ⭐ 動態適應本地與 Railway 雲端公網網址
  const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://y1nchgithubio-production.up.railway.app';

  // 影片上傳處理
  if (videoUploadForm) {
    videoUploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData();
      formData.append("title", document.getElementById("video-title").value);
      formData.append("description", document.getElementById("video-description").value);
      formData.append("video", document.getElementById("video-file").files[0]);

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/videos/upload`, {
          method: "POST",
          headers: headers,
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
        alert("連線失敗，請檢查網路或後端狀態。");
      }
    });
  }

  // 圖片上傳處理
  if (imageUploadForm) {
    imageUploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData();
      formData.append("title", document.getElementById("image-title").value);
      formData.append("description", document.getElementById("image-description").value);
      formData.append("image", document.getElementById("image-file").files[0]);

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/images/upload`, {
          method: "POST",
          headers: headers,
          body: formData,
        });

        if (response.ok) {
          alert("圖片上傳成功！ (Image uploaded successfully!)");
          imageUploadForm.reset();
          loadImages();
        } else {
          const errorData = await response.json();
          alert(`上傳失敗: ${errorData.message}`);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("連線失敗，請檢查網路或後端狀態。");
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

  // 建立全域刪除圖片函數
  window.deleteImage = async function(imageId) {
    if (!confirm('確定要刪除這張圖片嗎？此操作無法復原。')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${BACKEND_URL}/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('圖片刪除成功！');
        loadImages();
      } else {
        const err = await response.json();
        alert(`刪除失敗: ${err.message}`);
      }
    } catch (error) {
      console.error('刪除圖片失敗:', error);
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
        let isAdmin = false;
        if (token) {
          try {
            const profileRes = await fetch(`${BACKEND_URL}/api/auth/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              isAdmin = profileData.role === 'admin';
            }
          } catch (e) {
            console.error('即時載入身分失敗:', e);
          }
        }

        videos.forEach((video) => {
          const videoElement = document.createElement("div");
          videoElement.classList.add("video-card");
          
          let deleteBtnHtml = '';
          if (isAdmin) {
            deleteBtnHtml = `<button class="delete-btn" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-top: 14px; width: fit-content; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#dc2626'" onmouseout="this.style.backgroundColor='#ef4444'" onclick="window.deleteVideo(${video.id})">刪除影片</button>`;
          }

          videoElement.innerHTML = `
            <div class="video-info">
              <h3 class="video-card-title">${video.title}</h3>
              <p class="video-card-desc">${video.description || '暫無描述。'}</p>
              <span class="video-card-time" style="display: flex; flex-direction: column; gap: 4px; color: #64748b;">
                <span>上傳者: <strong style="color: #3b82f6;">${video.uploader || '訪客'}</strong></span>
                <span>上傳時間: ${new Date(video.upload_date).toLocaleString()}</span>
              </span>
              ${deleteBtnHtml}
            </div>
            <div class="video-player-wrapper">
              <video controls src="${BACKEND_URL}/uploads/${video.filename}" style="width: 100%; height: 100%; object-fit: contain;">
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

  async function loadImages() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/images`);
      if (response.ok) {
        const images = await response.json();
        imagesContainer.innerHTML = "";
        
        if (images.length === 0) {
          imagesContainer.innerHTML = "<p style='color: #64748b; text-align: center; margin-top: 20px;'>目前還沒有任何圖片，快來上傳一張吧！</p>";
          return;
        }

        const token = localStorage.getItem('token');
        let isAdmin = false;
        if (token) {
          try {
            const profileRes = await fetch(`${BACKEND_URL}/api/auth/profile`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              isAdmin = profileData.role === 'admin';
            }
          } catch (e) {
            console.error('即時載入身分失敗:', e);
          }
        }

        images.forEach((image) => {
          const imageElement = document.createElement("div");
          imageElement.classList.add("video-card"); // 使用相同的微光科技外框類別

          let deleteBtnHtml = '';
          if (isAdmin) {
            deleteBtnHtml = `<button class="delete-btn" style="background-color: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-top: 14px; width: fit-content; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#dc2626'" onmouseout="this.style.backgroundColor='#ef4444'" onclick="window.deleteImage(${image.id})">刪除圖片</button>`;
          }

          imageElement.innerHTML = `
            <div class="video-info">
              <h3 class="video-card-title">${image.title}</h3>
              <p class="video-card-desc">${image.description || '暫無描述。'}</p>
              <span class="video-card-time" style="display: flex; flex-direction: column; gap: 4px; color: #64748b;">
                <span>上傳者: <strong style="color: #10b981;">${image.uploader || '訪客'}</strong></span>
                <span>上傳時間: ${new Date(image.upload_date).toLocaleString()}</span>
              </span>
              ${deleteBtnHtml}
            </div>
            <div class="video-player-wrapper" style="background-color: transparent;">
              <img src="${BACKEND_URL}/uploads/${image.filename}" alt="${image.title}" style="width: 100%; height: auto; border-radius: 8px; display: block; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.5); cursor: pointer;" onclick="window.openImageModal('${BACKEND_URL}/uploads/${image.filename}', '${image.title}')">
            </div>
          `;
          imagesContainer.appendChild(imageElement);
        });
      } else {
        console.error("Failed to load images:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading images:", error);
    }
  }

  // 全域圖片放大函數
  window.openImageModal = function(src, title) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    if (!modal || !modalImg) return;

    modalImg.src = src;
    modalImg.alt = title || '圖片放大';
    if (modalCaption) {
      modalCaption.textContent = title || '圖片分享';
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  };

  // 關閉 Modal 的事件
  const modal = document.getElementById('imageModal');
  if (modal) {
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      });
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  loadVideos();
  loadImages();
});

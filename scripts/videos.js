document.addEventListener("DOMContentLoaded", () => {
  const videoUploadForm = document.getElementById("video-upload-form");
  const videosContainer = document.getElementById("videos-container");

  // Replace with your Railway backend URL
  const BACKEND_URL = "YOUR_RAILWAY_BACKEND_URL"; 

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
          alert("Video uploaded successfully!");
          videoUploadForm.reset();
          loadVideos();
        } else {
          const errorData = await response.json();
          alert(`Error uploading video: ${errorData.message}`);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred during video upload.");
      }
    });
  }

  async function loadVideos() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/videos`);
      if (response.ok) {
        const videos = await response.json();
        videosContainer.innerHTML = "";
        videos.forEach((video) => {
          const videoElement = document.createElement("div");
          videoElement.classList.add("video-item");
          videoElement.innerHTML = `
                        <h3>${video.title}</h3>
                        <p>${video.description}</p>
                        <video controls width="300">
                            <source src="${BACKEND_URL}/uploads/${video.filename}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <p>Uploaded: ${new Date(video.upload_date).toLocaleDateString()}</p>
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
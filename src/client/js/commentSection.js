const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const deleteBtns = document.querySelectorAll(".deleteBtn");

const handleDelete = async (event) => {
  const deleteBtn = event.target.parentElement;
  deleteBtn.remove();
  const commentId = deleteBtn.dataset.id;
  await fetch(`/api/comments/${commentId}`, {
    method: "DELETE",
  });
};

const addComment = (text, id, nickname) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = id;
  newComment.className = "video__comment";
  const h6 = document.createElement("h6");
  h6.innerText = new Date().toLocaleDateString("ko-kr", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  h6.className = "comment_date";
  const h4 = document.createElement("h4");
  h4.innerText = nickname;
  const br = document.createElement("br");
  const span = document.createElement("span");
  span.innerText = ` ${text}`;
  const span2 = document.createElement("span");
  span2.className = "fas fa-xmark";
  newComment.appendChild(h6);
  newComment.appendChild(h4);
  newComment.appendChild(br);
  newComment.appendChild(span);
  newComment.appendChild(span2);
  videoComments.prepend(newComment);

  const handleDeleteNew = (event) => {
    event.target.parentElement.remove();
  };

  span2.addEventListener("click", handleDeleteNew);
  span2.addEventListener("click", handleDelete);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (response.status === 201) {
    textarea.value = "";
    const { newCommentId, nickname } = await response.json();
    addComment(text, newCommentId, nickname);
  }
};

if (form) {
  form.addEventListener("submit", handleSubmit);
  if (deleteBtns) {
    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", handleDelete);
    });
  }
}

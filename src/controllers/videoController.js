import Video from "../models/Video";
import Comment from "../models/Comment";
import User from "../models/User";

export const home = async (req, res) => {
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
  return res.render("home", { pageTitle: "Home", videos });
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate("owner").populate("comments");
  if (!video) {
    return res.render("404", { pageTitle: "존재하지 않는 글입니다." });
  }
  return res.render("watch", { pageTitle: video.title, video });
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res
      .status(404)
      .render("404", { pageTitle: "존재하지 않는 글입니다." });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "글 수정 권한이 없습니다.");
    return res.status(403).redirect("/");
  }
  return res.render("edit", { pageTitle: `Edit: ${video.title}`, video });
};

export const postEdit = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { id } = req.params;
  const { title, writing, hashtags } = req.body;
  const video = await Video.findById(id);
  if (!video) {
    return res
      .status(404)
      .render("404", { pageTitle: "존재하지 않는 글입니다." });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "글 수정 권한이 없습니다.");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndUpdate(id, {
    title,
    writing,
    hashtags: Video.formatHashtags(hashtags),
  });
  req.flash("success", "수정이 완료되었습니다.");
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "글쓰기" });
};

export const postUpload = async (req, res) => {
  const {
    body: { title, writing, hashtags },
    files: { thumb },
    session: {
      user: { _id },
    },
  } = req;
  const isRender = process.env.NODE_ENV === "production";
  try {
    const newVideo = await Video.create({
      title,
      writing,
      thumbUrl: isRender ? thumb[0].location : thumb[0].path,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags),
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(400).render("upload", {
      pageTitle: "글쓰기",
      errorMessage: error._message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res
      .status(404)
      .render("404", { pageTitle: "해당 글을 찾을 수 없습니다." });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  video.comments.forEach(async (commentId) => {
    await Comment.findByIdAndDelete(commentId);
  });
  await Video.findByIdAndDelete(id);

  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(`${keyword}`, "i"),
      },
    }).populate("owner");
  }
  return res.render("home", { pageTitle: "글 검색", videos });
};

export const registerView = async (req, res) => {
  const {
    params: { id },
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views = video.meta.views + 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const {
    session: { user },
    body: { text },
    params: { id },
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    text,
    owner: user._id,
    video: id,
    nickname: user.nickname,
  });
  video.comments.push(comment._id);
  video.save();
  return res
    .status(201)
    .json({ newCommentId: comment._id, nickname: comment.nickname });
};

export const deleteComment = async (req, res) => {
  const {
    params: { id },
    session: {
      user: { _id },
    },
  } = req;

  const comment = await Comment.findById(id);
  if (String(comment.owner) !== String(_id)) {
    return res.sendStatus(404);
  }
  await Comment.findByIdAndDelete(id);
  const video = await Video.findOne({ comments: id });
  video.comments.pull(id);
  video.save();
};

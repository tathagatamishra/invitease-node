const galleryModel = require("../models/galleryModel");

exports.uploadGalleryImage = async (req, res) => {
  try {
    const { event, uploader, image, title, description } = req.body;

    if (!image) {
      return res.status(400).json({ message: "image url not found" });
    }

    const parts = image.split("/upload/");
    if (parts.length < 2) {
      return res.status(400).json({ message: "Invalid Cloudinary URL format" });
    }

    const afterUpload = parts[1];
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf("."));

    const imgDetails = await cloudinary.api.resource(publicId);

    const gallery = await galleryModel.create({
      event,
      uploader,
      image,
      width: imgDetails.width,
      height: imgDetails.height,
      title,
      description,
    });

    return res.status(201).json(gallery);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};


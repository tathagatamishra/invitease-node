const cloudinary = require("../config/cloudinary");

exports.getCloudSignature = async (req, res) => {
  try {
    const userid = req.body?.userid
    if (!userid) {
      return res.json({message: "invalid userid!"})
    }
    
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Generate the signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: `Invitease/Users/${userid}`,
      },
      process.env.CLOUDINARY_API_SECRET
    );

    // Return the necessary data for frontend
    return res.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
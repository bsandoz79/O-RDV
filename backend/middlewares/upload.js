const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const shopStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'ordv/shops',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'ordv/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
});

const uploadShopImage = multer({ storage: shopStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadAvatar    = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { uploadShopImage, uploadAvatar };

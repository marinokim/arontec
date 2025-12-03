import express from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'arontec-products', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp']
    }
})

const upload = multer({ storage: storage })

// Upload endpoint
router.post('/', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
    }

    // Cloudinary returns the URL in req.file.path
    res.json({
        url: req.file.path,
        filename: req.file.filename,
        originalName: req.file.originalname
    })
})

export default router

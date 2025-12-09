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

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
})

// Upload endpoint
router.post('/', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error('Multer error:', err)
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File is too large (Max 50MB)' })
            }
            return res.status(400).json({ error: `Upload error: ${err.message}` })
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error('Unknown upload error:', err)
            return res.status(500).json({ error: `Server error: ${err.message}` })
        }

        // Everything went fine.
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
})

export default router

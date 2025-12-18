import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const listImages = async () => {
    try {
        console.log("Fetching images from folder 'arontec-products'...")
        // Lists up to 500 resources
        const result = await cloudinary.search
            .expression('folder:arontec-products')
            .sort_by('created_at', 'desc')
            .max_results(100)
            .execute()

        console.log(`Found ${result.resources.length} images.`)

        for (const res of result.resources) {
            console.log(`[${res.created_at}] Public ID: ${res.public_id} | URL: ${res.secure_url} | Format: ${res.format}`)
            // Attempt to show filename if stored as metadata/tag or inferred from public_id
        }
    } catch (error) {
        console.error("Error fetching images:", error)
    }
}

listImages()

/**
 * Compresses an image file to ensure it's below a certain size.
 * Strategy: "Smart Balance" with Pixel Cap
 * 1. Cap TOTAL PIXELS at 25MP (Cloudinary limit is 25MP).
 *    - This allows long images (e.g. 1000x25000) without resizing width.
 * 2. Cap WIDTH at 3000px (to prevent insanely wide images), but allow height to flow.
 * 3. Then cycle quality (0.9 -> 0.75).
 * 4. If still too large, resize 0.9x loop.
 * 
 * @param {File} file - The image file to compress.
 * @param {number} maxSizeMB - The maximum file size in MB.
 * @returns {Promise<File>} - A promise that resolves with the compressed file.
 */
export const compressImage = async (file, maxSizeMB = 9.5) => {
    // If file is already smaller than limit, return it
    if (file.size <= maxSizeMB * 1024 * 1024) {
        return file
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target.result
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // CAP 1: Maximum Width (readability)
                if (width > 3000) {
                    const ratio = 3000 / width
                    width = 3000
                    height *= ratio
                }

                // CAP 2: Maximum MegaPixels (Cloudinary limit is ~25MP)
                // Example: 1000px * 25000px = 25,000,000 pixels (Safe)
                // Example: 1000px * 40000px = 40,000,000 pixels -> Scale down to 25MP area
                const MAX_PIXELS = 25000000
                const currentPixels = width * height
                if (currentPixels > MAX_PIXELS) {
                    const ratio = Math.sqrt(MAX_PIXELS / currentPixels)
                    width *= ratio
                    height *= ratio
                }

                const ctx = canvas.getContext('2d')

                // Compression state
                let currentWidth = width
                let currentHeight = height
                let currentQuality = 0.9
                const targetSize = maxSizeMB * 1024 * 1024

                // Helper to run compression attempt
                const attemptCompression = () => {
                    canvas.width = currentWidth
                    canvas.height = currentHeight
                    ctx.drawImage(img, 0, 0, currentWidth, currentHeight)

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error("Image compression failed"))
                            return
                        }

                        // Success condition: Size OK or dimensions too small to shrink further
                        if (blob.size <= targetSize || currentWidth < 600) {
                            // console.log(`Compressed: ${Math.round(currentWidth)}x${Math.round(currentHeight)}, Quality: ${currentQuality}`)

                            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            })
                            resolve(newFile)
                        } else {
                            // Retry logic
                            if (currentQuality > 0.75) {
                                currentQuality -= 0.1
                                attemptCompression()
                            }
                            else {
                                // If quality is low, shrink dimensions
                                currentWidth *= 0.9
                                currentHeight *= 0.9
                                currentQuality = 0.9
                                attemptCompression()
                            }
                        }
                    }, 'image/jpeg', currentQuality)
                }

                // Start attempts
                attemptCompression()
            }
            img.onerror = (err) => reject(err)
        }
        reader.onerror = (err) => reject(err)
    })
}

/**
 * Compresses an image file to ensure it's below a certain size.
 * Strategy: "Smart Balance"
 * 1. Try reducing quality down to 0.75 to save size without resizing.
 * 2. If that's not enough, resize dimensions slightly (0.9x) and RESET quality to 0.9.
 * This prevents "high resolution but blocky/blurry" images.
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

                // Safety cap: 8000px
                const SAFETY_MAX = 8000
                if (width > SAFETY_MAX || height > SAFETY_MAX) {
                    const ratio = Math.min(SAFETY_MAX / width, SAFETY_MAX / height)
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

                        // Success condition
                        if (blob.size <= targetSize || currentWidth < 600) {
                            console.log(`Compressed: ${file.size} -> ${blob.size} bytes. Resolution: ${Math.round(currentWidth)}x${Math.round(currentHeight)}, Quality: ${currentQuality}`)

                            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            })
                            resolve(newFile)
                        } else {
                            // Retry logic
                            // If quality is high, lower it first
                            if (currentQuality > 0.75) {
                                currentQuality -= 0.1
                                attemptCompression()
                            }
                            // If quality is already getting low (<= 0.75), resize dimensions instead and RESET quality
                            // This avoids "blocky" artifacts by preferring clean pixels at slightly lower res
                            else {
                                currentWidth *= 0.9
                                currentHeight *= 0.9
                                currentQuality = 0.9 // Reset to high quality
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

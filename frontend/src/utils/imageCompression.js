/**
 * Compresses an image file to ensure it's below a certain size.
 * Strategy: Prioritize quality reduction to retain original resolution.
 * Only resize dimensions if quality reduction is insufficient.
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

                // Safety cap: 8000px is very safe for modern browsers, prevents crashes on massive images
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

                        const targetSize = maxSizeMB * 1024 * 1024

                        // Success condition: Size is under limit OR we've hit minimums
                        // (Min quality 0.5 and min width 1000px as a failsafe to stop infinite loops)
                        if (blob.size <= targetSize || (currentQuality <= 0.5 && currentWidth < 1000)) {
                            console.log(`Compressed: ${file.size} -> ${blob.size} bytes. Resolution: ${currentWidth}x${currentHeight}, Quality: ${currentQuality}`)

                            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            })
                            resolve(newFile)
                        } else {
                            // Retry logic
                            // 1. Reduce quality first (down to 0.5)
                            if (currentQuality > 0.55) { // Floating point safety margin
                                currentQuality -= 0.1
                                attemptCompression()
                            }
                            // 2. If quality is already low, reduce dimensions and reset quality slightly
                            else {
                                currentWidth *= 0.8
                                currentHeight *= 0.8
                                currentQuality = 0.8 // Reset quality to try high-qual at smaller size
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

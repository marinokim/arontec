/**
 * Compresses an image file to ensure it's below a certain size.
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

                // Logic for tall images (product details) vs wide images
                if (width > height) {
                    // Wide image: Cap width at 2500
                    const MAX_WIDTH = 2500
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }
                } else {
                    // Tall image: Cap width at 1500 (sufficient for detail), let height be large
                    // But also cap height to prevent canvas errors (e.g. 30000px might crash IOS)
                    const MAX_WIDTH = 1500
                    const MAX_HEIGHT = 15000

                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width
                        width = MAX_WIDTH
                    }

                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height
                        height = MAX_HEIGHT
                    }
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                // Start with high quality
                let quality = 0.9

                const processBlob = (blob) => {
                    if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.5) {
                        // Create a new File object
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        })
                        resolve(newFile)
                    } else {
                        // Retry with lower quality
                        quality -= 0.1
                        canvas.toBlob(processBlob, 'image/jpeg', quality)
                    }
                }

                // Initial attempt
                canvas.toBlob(processBlob, 'image/jpeg', quality)
            }
            img.onerror = (err) => reject(err)
        }
        reader.onerror = (err) => reject(err)
    })
}

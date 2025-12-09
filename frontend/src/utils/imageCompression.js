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

                // Resize if too huge (e.g. > 4000px) to help with size
                const MAX_DIMENSION = 2500
                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width
                        width = MAX_DIMENSION
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height
                        height = MAX_DIMENSION
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

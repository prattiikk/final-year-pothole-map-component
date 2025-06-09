// utils/api.ts or services/potholeService.ts

export const markPotholeAsFixed = async (detectionId: string): Promise<boolean> => {
    try {
        const response = await fetch(`/api/detections/${detectionId}/fix`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Failed to mark pothole as fixed')
        }

        const result = await response.json()
        console.log('Pothole marked as fixed:', result.message)
        return true
    } catch (error) {
        console.error('Error marking pothole as fixed:', error)
        throw error
    }
}
import cloudinary
import cloudinary.uploader
from app.config import settings
from typing import Optional
from datetime import datetime, timedelta

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


class FileUploadService:
    """Service for uploading files to Cloudinary"""
    
    def upload_result_pdf(
        self,
        file_content: bytes,
        booking_id: str,
        filename: str
    ) -> str:
        """
        Upload PDF result to Cloudinary
        
        Args:
            file_content: PDF file bytes
            booking_id: Booking ID (for folder organization)
            filename: Original filename
            
        Returns:
            Cloudinary URL of uploaded file
        """
        try:
            # Upload to Cloudinary with organized folder structure
            upload_result = cloudinary.uploader.upload(
                file_content,
                folder=f"test_results/{booking_id}",
                resource_type="raw",  # For PDFs
                public_id=filename.replace('.pdf', ''),
                type="private",  # Not publicly accessible
                overwrite=True
            )
            
            print(f"✅ File uploaded to Cloudinary: {upload_result['secure_url']}")
            
            return upload_result['secure_url']
            
        except Exception as e:
            print(f"❌ Cloudinary upload failed: {e}")
            raise
    
    
    def generate_signed_url(
        self,
        public_id: str,
        expires_in_hours: int = 1
    ) -> str:
        """
        Generate time-limited signed URL for secure access
        
        Args:
            public_id: Cloudinary public ID
            expires_in_hours: URL validity period (default 1 hour)
            
        Returns:
            Signed URL valid for specified duration
        """
        try:
            # Generate signed URL
            url = cloudinary.utils.private_download_url(
                public_id,
                format='pdf',
                resource_type='raw',
                expires_at=int((datetime.utcnow() + timedelta(hours=expires_in_hours)).timestamp())
            )
            
            return url
            
        except Exception as e:
            print(f"❌ Failed to generate signed URL: {e}")
            raise
    
    
    def delete_file(self, public_id: str) -> bool:
        """
        Delete file from Cloudinary
        
        Args:
            public_id: Cloudinary public ID
            
        Returns:
            True if deleted successfully
        """
        try:
            result = cloudinary.uploader.destroy(
                public_id,
                resource_type='raw'
            )
            
            return result.get('result') == 'ok'
            
        except Exception as e:
            print(f"❌ Failed to delete file: {e}")
            return False


# Create singleton instance
file_upload_service = FileUploadService()
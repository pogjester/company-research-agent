import logging
import os
import re
from fastapi import HTTPException
from backend.utils.utils import generate_pdf_from_md
from fastapi.responses import StreamingResponse
import io

logger = logging.getLogger(__name__)

class PDFService:
    def __init__(self, config):
        self.output_dir = config.get("pdf_output_dir", "pdfs")
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
    def _sanitize_company_name(self, company_name):
        """Sanitize company name for use in filenames."""
        # Replace spaces with underscores and remove special characters
        sanitized = re.sub(r'[^\w\s-]', '', company_name).strip().replace(' ', '_')
        return sanitized.lower()
    
    def _generate_pdf_filename(self, company_name):
        """Generate a PDF filename based on the company name."""
        sanitized_name = self._sanitize_company_name(company_name)
        return f"{sanitized_name}_report.pdf"
    
    def generate_pdf_stream(self, markdown_content, company_name=None):
        """
        Generate a PDF from markdown content and return it as a stream.
        
        Args:
            markdown_content (str): The markdown content to convert to PDF
            company_name (str, optional): The company name to use in the filename
            
        Returns:
            tuple: (success status, PDF stream or error message)
        """
        try:
            # Extract company name from the first line if not provided
            if not company_name:
                first_line = markdown_content.split('\n')[0].strip()
                if first_line.startswith('# '):
                    company_name = first_line[2:].strip()
                else:
                    company_name = "Company Research"
            
            # Generate the output filename
            pdf_filename = self._generate_pdf_filename(company_name)
            
            # Create a BytesIO object to store the PDF
            pdf_buffer = io.BytesIO()
            
            # Generate the PDF directly to the buffer
            generate_pdf_from_md(markdown_content, pdf_buffer)
            
            # Reset buffer position to start
            pdf_buffer.seek(0)
            
            # Return success and the buffer
            return True, (pdf_buffer, pdf_filename)
            
        except Exception as e:
            error_msg = f"Error generating PDF: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

    def generate_pdf_from_job(self, job_id: str, job_status: dict, mongodb=None) -> dict:
        """Generate a PDF from a job's report content."""
        try:
            # First try to get report from memory
            report_content = None
            if job_id in job_status:
                result = job_status[job_id]
                if isinstance(result, dict):
                    report_content = result.get('report')

            # If not in memory and MongoDB is available, try to get from MongoDB
            if not report_content and mongodb:
                try:
                    report = mongodb.get_report(job_id)
                    if report and isinstance(report, dict):
                        report_content = report.get('report')
                except Exception as e:
                    logger.warning(f"Failed to get report from MongoDB: {e}")

            if not report_content:
                raise HTTPException(status_code=404, detail="No report content available")

            # Get company name from memory or MongoDB
            company_name = None
            if job_id in job_status:
                company_name = job_status[job_id].get('company')
            if not company_name and mongodb:
                try:
                    job = mongodb.get_job(job_id)
                    if job and isinstance(job, dict):
                        company_name = job.get('company')
                except Exception as e:
                    logger.warning(f"Failed to get company name from MongoDB: {e}")

            success, result = self.generate_pdf_stream(report_content, company_name)
            if success:
                pdf_buffer, filename = result
                return StreamingResponse(
                    pdf_buffer,
                    media_type='application/pdf',
                    headers={
                        'Content-Disposition': f'attachment; filename="{filename}"'
                    }
                )
            else:
                raise HTTPException(status_code=500, detail=result)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            raise HTTPException(status_code=500, detail=str(e)) 
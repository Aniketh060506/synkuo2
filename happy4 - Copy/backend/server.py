from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from storage_service import storage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class WebCaptureRequest(BaseModel):
    selectedText: str
    selectedHTML: str = ""
    sourceDomain: str
    sourceUrl: str
    targetNotebookId: Optional[str] = None
    timestamp: str

class WebCaptureResponse(BaseModel):
    success: bool
    notebookId: str
    notebookName: str
    message: str

class TargetNotebookRequest(BaseModel):
    notebookId: str
    notebookName: str

class TargetNotebookResponse(BaseModel):
    notebookId: str
    notebookName: str


# Configure simple logging for .exe compatibility
try:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(__name__)
except Exception as e:
    # Fallback to basic console output if logging fails
    import sys
    class SimpleLogger:
        def info(self, msg): print(f"[INFO] {msg}", file=sys.stdout)
        def error(self, msg): print(f"[ERROR] {msg}", file=sys.stderr)
        def warning(self, msg): print(f"[WARNING] {msg}", file=sys.stderr)
    logger = SimpleLogger()


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "CopyDock Backend API - Running with localStorage"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "Backend is running",
        "storage": "localStorage",
        "version": "1.0.0"
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    # Store in file-based storage
    storage.add_status_check(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Get status checks from file storage
    status_checks = storage.get_status_checks()
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post("/web-capture", response_model=WebCaptureResponse)
async def capture_web_content(capture: WebCaptureRequest):
    """
    Receive web content from Chrome extension and store in localStorage.
    Returns the notebook ID and name where content was saved.
    """
    try:
        # Get current target notebook settings
        settings = storage.get_settings()
        target_notebook_id = capture.targetNotebookId or settings.get('target_notebook_id', 'default')
        target_notebook_name = settings.get('target_notebook_name', 'Web Captures')
        
        # Create a web capture document
        capture_doc = {
            "id": str(uuid.uuid4()),
            "selectedText": capture.selectedText,
            "selectedHTML": capture.selectedHTML,
            "sourceDomain": capture.sourceDomain,
            "sourceUrl": capture.sourceUrl,
            "targetNotebookId": target_notebook_id,
            "timestamp": capture.timestamp,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        # Store in file-based storage
        success = storage.add_web_capture(capture_doc)
        
        if success:
            logger.info(f"Web capture saved: {capture.sourceDomain} -> {target_notebook_id}")
            return WebCaptureResponse(
                success=True,
                notebookId=target_notebook_id,
                notebookName=target_notebook_name,
                message="Content captured successfully"
            )
        else:
            raise Exception("Failed to save capture")
            
    except Exception as e:
        logger.error(f"Error saving web capture: {str(e)}")
        return WebCaptureResponse(
            success=False,
            notebookId="",
            notebookName="",
            message=f"Error: {str(e)}"
        )

@api_router.get("/web-captures")
async def get_web_captures(limit: int = 100):
    """Get recent web captures"""
    captures = storage.get_web_captures(limit)
    return {"captures": captures, "count": len(captures)}

@api_router.get("/settings/target-notebook", response_model=TargetNotebookResponse)
async def get_target_notebook():
    """Get the current target notebook for Chrome extension"""
    settings = storage.get_settings()
    return TargetNotebookResponse(
        notebookId=settings.get('target_notebook_id', 'default'),
        notebookName=settings.get('target_notebook_name', 'Web Captures')
    )

@api_router.post("/settings/target-notebook")
async def set_target_notebook(notebook: TargetNotebookRequest):
    """Set the target notebook for Chrome extension"""
    storage.update_settings({
        'target_notebook_id': notebook.notebookId,
        'target_notebook_name': notebook.notebookName
    })
    logger.info(f"Target notebook updated: {notebook.notebookName}")
    return {
        "success": True,
        "message": "Target notebook updated",
        "notebookId": notebook.notebookId,
        "notebookName": notebook.notebookName
    }

@api_router.get("/notebooks")
async def get_notebooks():
    """Get all notebooks for Chrome extension"""
    try:
        notebooks = storage.get_notebooks()
        # If no notebooks exist, create a default one
        if not notebooks:
            default_notebook = {
                'id': 'default',
                'name': 'Web Captures',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'description': 'Default notebook for web captures'
            }
            storage.add_notebook(default_notebook)
            notebooks = [default_notebook]
        
        return notebooks
    except Exception as e:
        logger.error(f"Failed to get notebooks: {e}")
        # Return default notebook on error
        return [{
            'id': 'default',
            'name': 'Web Captures',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'description': 'Default notebook for web captures'
        }]

@api_router.post("/capture")
async def capture_content(data: dict):
    """Capture web content from extension"""
    try:
        logger.info(f"Capturing content from {data.get('sourceDomain', 'unknown')}")
        
        # Create a web capture entry
        capture_entry = {
            'id': str(uuid.uuid4()),
            'selected_text': data.get('selectedText', ''),
            'selected_html': data.get('selectedHTML', ''),
            'source_domain': data.get('sourceDomain', ''),
            'source_url': data.get('sourceUrl', ''),
            'target_notebook_id': data.get('targetNotebookId', 'default'),
            'timestamp': data.get('timestamp', datetime.now(timezone.utc).isoformat()),
            'captured_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Store the capture
        storage.add_web_capture(capture_entry)
        
        # Get notebook name
        notebooks = storage.get_notebooks()
        notebook_name = 'Web Captures'
        for nb in notebooks:
            if nb['id'] == capture_entry['target_notebook_id']:
                notebook_name = nb['name']
                break
        
        return {
            'success': True,
            'notebookId': capture_entry['target_notebook_id'],
            'notebookName': notebook_name,
            'message': 'Content captured successfully'
        }
        
    except Exception as e:
        logger.error(f"Capture failed: {e}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Failed to capture content'
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CopyDock Backend started with localStorage")

# Run the server when executed directly
if __name__ == "__main__":
    import uvicorn
    print("[BACKEND] Starting CopyDock Backend Server on port 8001...")
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001,
        log_level="info",
        access_log=True
    )

import os
import uuid
from flask import current_app
from werkzeug.utils import secure_filename

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def get_user_upload_dir(user_id):
    """Get the upload directory for a specific user."""
    user_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], user_id)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir

def save_uploaded_file(file, user_id, subdir=None):
    """Save an uploaded file to the user's upload directory."""
    if not file or not allowed_file(file.filename):
        return None
    
    user_dir = get_user_upload_dir(user_id)
    
    if subdir:
        target_dir = os.path.join(user_dir, subdir)
        os.makedirs(target_dir, exist_ok=True)
    else:
        target_dir = user_dir
    
    # Generate a unique filename
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
    
    file_path = os.path.join(target_dir, unique_filename)
    file.save(file_path)
    
    return {
        "original_filename": original_filename,
        "saved_filename": unique_filename,
        "path": file_path
    }
import os
import zipfile

source_dir = r"D:\Travel.IO"
output_zip = r"D:\Travel.IO_Shareable.zip"

exclude_dirs = {
    'node_modules', 
    'venv', 
    '__pycache__', 
    '.git', 
    '.idea', 
    '.vscode'
}

exclude_files = {
    '.DS_Store',
    'package-lock.json',
    'create_zip.ps1',
    'create_zip.py'
}

print("Zipping the project, please wait...")

with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        # Modify dirs in-place to skip excluded directories entirely
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file in exclude_files:
                continue
            
            file_path = os.path.join(root, file)
            # Calculate path inside the zip file relative to the source dir
            arcname = os.path.relpath(file_path, source_dir)
            zipf.write(file_path, arcname)

print(f"✅ Created {output_zip} successfully!")

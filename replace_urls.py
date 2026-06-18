import os
import re

frontend_src = r"c:\Users\akans\Documents\pm-tool\frontend\src"

for root, _, files in os.walk(frontend_src):
    for file in files:
        if file.endswith((".jsx", ".js")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Replace double quotes
            new_content = re.sub(r'"http://127\.0\.0\.1:8000([^"]*)"', r'`${import.meta.env.VITE_API_URL}\1`', content)
            
            # Replace single quotes
            new_content = re.sub(r"'http://127\.0\.0\.1:8000([^']*)'", r'`${import.meta.env.VITE_API_URL}\1`', new_content)

            # Replace backticks
            new_content = new_content.replace('http://127.0.0.1:8000', '${import.meta.env.VITE_API_URL}')
            
            if new_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

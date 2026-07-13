import os
import re

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False
        
    if '<<<<<<< HEAD' not in content:
        return False
        
    # Match <<<<<<< HEAD\n ... =======\n ... >>>>>>> [anything]\n
    # Use re.split to keep the delimiters
    parts = re.split(r'(<<<<<<< HEAD\n.*?\n=======\n.*?\n>>>>>>> [^\n]+)', content, flags=re.DOTALL)
    
    new_content = ""
    for p in parts:
        if p.startswith('<<<<<<< HEAD'):
            # Extract HEAD part
            m = re.search(r'<<<<<<< HEAD\n(.*?)\n=======', p, flags=re.DOTALL)
            head_part = m.group(1) if m else ""
            new_content += head_part
        else:
            new_content += p
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js') or file.endswith('.py'):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                print(f"Resolved: {filepath}")

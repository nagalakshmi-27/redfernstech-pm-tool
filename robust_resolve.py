import os

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return False

    has_conflict = False
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            has_conflict = True
            break
            
    if not has_conflict:
        return False

    new_lines = []
    state = 0 # 0=normal, 1=head, 2=remote
    head_block = []
    remote_block = []
    
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            state = 1
            head_block = []
            remote_block = []
            continue
        elif line.startswith('======='):
            if state == 1:
                state = 2
                continue
        elif line.startswith('>>>>>>> '):
            if state == 2:
                state = 0
                
                head_str = "".join(head_block)
                remote_str = "".join(remote_block)
                
                # Default logic: We generally prefer HEAD because we just did a lot of cleanups.
                # However, we must keep specific remote features.
                if 'max="9999-12-31"' in remote_str:
                    new_lines.extend(remote_block)
                else:
                    new_lines.extend(head_block)
                
                continue

        if state == 0:
            new_lines.append(line)
        elif state == 1:
            head_block.append(line)
        elif state == 2:
            remote_block.append(line)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    return True

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js') or file.endswith('.py'):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                print(f"Resolved: {filepath}")
